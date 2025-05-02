import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { getSales, getPurchases, getPartners, getInventoryItems } from '../services/firestore';
import { Sale, Purchase, Partner, InventoryItem } from '../types';
import ProfitSummaryCard from '../components/ProfitSummaryCard';
import ProfitDistributionCard from '../components/ProfitDistributionCard';

// Definir las pestañas disponibles
type TabType = 'summary' | 'distribution';

// Interfaz para los datos de resumen de ganancias
interface ProfitSummary {
  totalSales: number;
  totalPurchases: number;
  costOfGoodsSold: number; // Costo de los bienes vendidos (COGS)
  salesProfit: number;
  inventoryValue: number;
  grossProfit: number; // Beneficio bruto (totalSales - COGS)
  netProfit: number;
}

// Interfaz para los datos de distribución de ganancias
interface ProfitDistributionData {
  partnerId: string;
  partnerName: string;
  percentage: number;
  amount: number;
}

const ProfitsScreen = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [loading, setLoading] = useState(true);

  // Estados para almacenar los datos
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Estados para los cálculos de ganancias
  const [profitSummary, setProfitSummary] = useState<ProfitSummary>({
    totalSales: 0,
    totalPurchases: 0,
    costOfGoodsSold: 0,
    salesProfit: 0,
    inventoryValue: 0,
    grossProfit: 0,
    netProfit: 0
  });

  const [profitDistribution, setProfitDistribution] = useState<ProfitDistributionData[]>([]);

  // Cargar datos al iniciar
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Cargar ventas, compras, socios e inventario
      const salesData = await getSales();
      const purchasesData = await getPurchases();
      const partnersData = await getPartners();
      const inventoryData = await getInventoryItems();

      setSales(salesData);
      setPurchases(purchasesData);
      setPartners(partnersData);
      setInventory(inventoryData);

      // Calcular ganancias y distribución
      calculateProfits(salesData, purchasesData, inventoryData, partnersData);
    } catch (error) {
      console.error('Error fetching profit data:', error);
      Alert.alert(t('common.error'), t('common.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Calcular las ganancias y la distribución
  const calculateProfits = (
    salesData: Sale[],
    purchasesData: Purchase[],
    inventoryData: InventoryItem[],
    partnersData: Partner[]
  ) => {
    try {
      // Calcular el total de ventas
      const totalSales = salesData.reduce((sum, sale) => sum + sale.totalAmount, 0);

      // Calcular el total de compras
      const totalPurchases = purchasesData.reduce((sum, purchase) => sum + purchase.totalAmount, 0);

      // Calcular el costo de los bienes vendidos (COGS)
      // Esto se calcula sumando el costo de compra de todos los artículos vendidos
      const costOfGoodsSold = salesData.reduce((sum, sale) => {
        // Calcular el costo de los artículos en esta venta
        const saleCost = sale.items.reduce((itemSum, item) => {
          // Costo = precio de compra unitario * cantidad
          const itemCost = item.quantity * (item.pricePerUnit - (item.profit || 0) / item.quantity);
          return itemSum + itemCost;
        }, 0);
        return sum + saleCost;
      }, 0);

      // Calcular la ganancia de ventas (suma de las ganancias individuales de cada venta)
      const salesProfit = salesData.reduce((sum, sale) => {
        // Sumar la ganancia de cada artículo en la venta
        const saleProfit = sale.items.reduce((itemSum, item) => itemSum + (item.profit || 0), 0);
        return sum + saleProfit;
      }, 0);

      // Calcular el valor actual del inventario
      const inventoryValue = inventoryData.reduce((sum, item) => sum + item.totalSaleValue, 0);

      // Calcular el beneficio bruto (ventas totales - costo de bienes vendidos)
      const grossProfit = totalSales - costOfGoodsSold;

      // Calcular la ganancia neta (ganancia de ventas - gastos adicionales si los hubiera)
      const netProfit = salesProfit;

      // Actualizar el resumen de ganancias
      setProfitSummary({
        totalSales,
        totalPurchases,
        costOfGoodsSold,
        salesProfit,
        inventoryValue,
        grossProfit,
        netProfit
      });

      // Calcular la distribución de ganancias entre los socios
      calculateProfitDistribution(netProfit, partnersData);
    } catch (error) {
      console.error('Error calculating profits:', error);
    }
  };

  // Calcular la distribución de ganancias entre los socios
  const calculateProfitDistribution = (netProfit: number, partnersData: Partner[]) => {
    try {
      // Verificar que hay socios y ganancias para distribuir
      if (partnersData.length === 0 || netProfit <= 0) {
        setProfitDistribution([]);
        return;
      }

      // Calcular la suma total de los porcentajes de participación
      const totalPercentage = partnersData.reduce((sum, partner) => sum + partner.profitShare, 0);

      // Distribuir las ganancias según el porcentaje de cada socio
      const distribution = partnersData.map(partner => {
        // Calcular el porcentaje normalizado si la suma no es exactamente 100%
        const normalizedPercentage = totalPercentage !== 100
          ? (partner.profitShare / totalPercentage) * 100
          : partner.profitShare;

        // Calcular el monto correspondiente a este socio
        const amount = (normalizedPercentage / 100) * netProfit;

        return {
          partnerId: partner.id,
          partnerName: partner.name,
          percentage: normalizedPercentage,
          amount
        };
      });

      setProfitDistribution(distribution);
    } catch (error) {
      console.error('Error calculating profit distribution:', error);
    }
  };

  // Renderizar la pestaña activa
  const renderActiveTab = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'summary':
        return renderSummaryTab();
      case 'distribution':
        return renderDistributionTab();
      default:
        return null;
    }
  };

  // Renderizar la pestaña de resumen
  const renderSummaryTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>{t('profits.profitSummary')}</Text>

        {/* Tarjetas de resumen */}
        <View style={styles.summaryCardsContainer}>
          {/* Total de ventas */}
          <ProfitSummaryCard
            title={t('profits.totalSales')}
            amount={profitSummary.totalSales}
            icon="cart"
            color={COLORS.PRIMARY}
            isPositive={true}
          />

          {/* Costo de bienes vendidos (COGS) */}
          <ProfitSummaryCard
            title={t('profits.costOfGoodsSold')}
            amount={profitSummary.costOfGoodsSold}
            icon="pricetag"
            color={COLORS.DANGER}
            isPositive={false}
          />

          {/* Beneficio bruto */}
          <ProfitSummaryCard
            title={t('profits.grossProfit')}
            amount={profitSummary.grossProfit}
            icon="trending-up"
            color={COLORS.SUCCESS}
            isPositive={true}
          />

          {/* Total de compras */}
          <ProfitSummaryCard
            title={t('profits.totalPurchases')}
            amount={profitSummary.totalPurchases}
            icon="basket"
            color={COLORS.WARNING}
            isPositive={false}
          />

          {/* Valor del inventario */}
          <ProfitSummaryCard
            title={t('profits.inventoryValue')}
            amount={profitSummary.inventoryValue}
            icon="cube"
            color={COLORS.INFO}
            isPositive={true}
          />

          {/* Ganancia de ventas */}
          <ProfitSummaryCard
            title={t('profits.salesProfit')}
            amount={profitSummary.salesProfit}
            icon="cash"
            color={COLORS.SUCCESS}
            isPositive={true}
          />
        </View>

        {/* Ganancia neta */}
        <View style={styles.netProfitContainer}>
          <Text style={styles.netProfitLabel}>{t('profits.totalProfit')}</Text>
          <Text style={styles.netProfitValue}>
            {profitSummary.netProfit.toFixed(2)}
          </Text>
        </View>
      </ScrollView>
    );
  };

  // Renderizar la pestaña de distribución
  const renderDistributionTab = () => {
    // Buscar los socios correspondientes a la distribución
    const getPartnerById = (partnerId: string) => {
      return partners.find(partner => partner.id === partnerId) || null;
    };

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>{t('profits.profitDistribution')}</Text>

        {/* Mostrar la ganancia total a distribuir */}
        <View style={styles.totalProfitContainer}>
          <Text style={styles.totalProfitLabel}>{t('profits.totalProfit')}</Text>
          <Text style={styles.totalProfitValue}>{profitSummary.netProfit.toFixed(2)}</Text>
        </View>

        {/* Mostrar la distribución entre los socios */}
        {profitDistribution.length > 0 ? (
          <View style={styles.distributionContainer}>
            {profitDistribution.map((distribution) => {
              const partner = getPartnerById(distribution.partnerId);

              if (!partner) return null;

              return (
                <ProfitDistributionCard
                  key={distribution.partnerId}
                  partner={partner}
                  amount={distribution.amount}
                  percentage={distribution.percentage}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyDistributionContainer}>
            <Ionicons name="people" size={64} color={COLORS.GRAY} />
            <Text style={styles.emptyDistributionText}>
              {profitSummary.netProfit <= 0
                ? t('profits.noDistributions')
                : t('common.loading')}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('profits.title')}</Text>
      </View>

      {/* Pestañas de navegación */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
          onPress={() => setActiveTab('summary')}
        >
          <Ionicons
            name="stats-chart"
            size={20}
            color={activeTab === 'summary' ? COLORS.PRIMARY : COLORS.GRAY}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'summary' && styles.activeTabText,
            ]}
          >
            {t('profits.profitSummary')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'distribution' && styles.activeTab]}
          onPress={() => setActiveTab('distribution')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'distribution' ? COLORS.PRIMARY : COLORS.GRAY}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'distribution' && styles.activeTabText,
            ]}
          >
            {t('profits.profitDistribution')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido de la pestaña activa */}
      {renderActiveTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.WHITE,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginLeft: 8,
  },
  activeTabText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  comingSoon: {
    fontSize: 18,
    color: COLORS.GRAY,
    textAlign: 'center',
    marginTop: 32,
  },
  // Estilos para la pestaña de resumen
  summaryCardsContainer: {
    marginBottom: 24,
  },
  netProfitContainer: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  netProfitLabel: {
    fontSize: 16,
    color: COLORS.WHITE,
    marginBottom: 8,
  },
  netProfitValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  // Estilos para la pestaña de distribución
  totalProfitContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalProfitLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  totalProfitValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  distributionContainer: {
    marginBottom: 16,
  },
  emptyDistributionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyDistributionText: {
    fontSize: 16,
    color: COLORS.GRAY,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ProfitsScreen;
