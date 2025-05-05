import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/index';
import { getPartners, getFunds, getInventoryItems, getTransactions, getPurchases, getSales } from '../services/supabase';
import { Partner, Fund, Transaction, Purchase, Sale } from '../types';
import { InventoryItem } from '../types/index';

const DashboardScreen = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [partnersData, fundsData, inventoryData, transactionsData, purchasesData, salesData] = await Promise.all([
          getPartners(),
          getFunds(),
          getInventoryItems(),
          getTransactions(),
          getPurchases(),
          getSales(),
        ]);

        setPartners(partnersData);
        setFunds(fundsData);
        setInventory(inventoryData);
        setTransactions(transactionsData);
        setPurchases(purchasesData);
        setSales(salesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate totals
  const totalCapital = partners.reduce((sum, partner) => sum + partner.currentCapital, 0);
  const cashFund = funds.find(fund => fund.name === 'Cash');
  const bankFund = funds.find(fund => fund.name === 'Bank');
  const totalCash = cashFund ? cashFund.balance : 0;
  const totalBank = bankFund ? bankFund.balance : 0;
  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.totalPurchaseCost, 0);

  // Calculate sales by payment method
  const totalCashSales = sales
    .filter(sale => sale.paymentMethod === 'cash')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);

  const totalBankSales = sales
    .filter(sale => sale.paymentMethod === 'bank')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);

  // Calculate purchases by payment method
  const totalCashPurchases = purchases
    .filter(purchase => purchase.paymentMethod === 'cash')
    .reduce((sum, purchase) => sum + purchase.totalAmount, 0);

  const totalBankPurchases = purchases
    .filter(purchase => purchase.paymentMethod === 'bank')
    .reduce((sum, purchase) => sum + purchase.totalAmount, 0);

  // Get recent transactions, purchases, and sales
  const recentTransactions = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  const recentPurchases = [...purchases].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  const recentSales = [...sales].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('dashboard.title')}</Text>

      {/* Summary Cards */}
      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.totalCapital')}</Text>
          <Text style={styles.cardValue}>{totalCapital.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.totalCash')}</Text>
          <Text style={styles.cardValue}>{totalCash.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.totalBank')}</Text>
          <Text style={styles.cardValue}>{totalBank.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.totalInventory')}</Text>
          <Text style={styles.cardValue}>{totalInventoryValue.toFixed(2)}</Text>
        </View>
      </View>

      {/* Sales by Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('sales.title')}</Text>
        <View style={styles.paymentMethodCards}>
          <View style={styles.paymentMethodCard}>
            <Text style={styles.paymentMethodTitle}>{t('dashboard.totalCashSales')}</Text>
            <Text style={[styles.paymentMethodValue, { color: COLORS.SUCCESS }]}>
              {totalCashSales.toFixed(2)}
            </Text>
          </View>
          <View style={styles.paymentMethodCard}>
            <Text style={styles.paymentMethodTitle}>{t('dashboard.totalBankSales')}</Text>
            <Text style={[styles.paymentMethodValue, { color: COLORS.SUCCESS }]}>
              {totalBankSales.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Purchases by Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('purchases.title')}</Text>
        <View style={styles.paymentMethodCards}>
          <View style={styles.paymentMethodCard}>
            <Text style={styles.paymentMethodTitle}>{t('dashboard.totalCashPurchases')}</Text>
            <Text style={[styles.paymentMethodValue, { color: COLORS.DANGER }]}>
              {totalCashPurchases.toFixed(2)}
            </Text>
          </View>
          <View style={styles.paymentMethodCard}>
            <Text style={styles.paymentMethodTitle}>{t('dashboard.totalBankPurchases')}</Text>
            <Text style={[styles.paymentMethodValue, { color: COLORS.DANGER }]}>
              {totalBankPurchases.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dashboard.recentTransactions')}</Text>
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.listItemTitle}>
                  {transaction.type === 'deposit' ? t('funds.deposit') : t('funds.withdrawal')}
                </Text>
                <Text
                  style={[
                    styles.listItemAmount,
                    { color: transaction.type === 'deposit' ? COLORS.SUCCESS : COLORS.DANGER },
                  ]}
                >
                  {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.listItemDescription}>{transaction.description}</Text>
              <Text style={styles.listItemDate}>
                {transaction.date.toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent transactions</Text>
        )}
      </View>

      {/* Recent Purchases */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dashboard.recentPurchases')}</Text>
        {recentPurchases.length > 0 ? (
          recentPurchases.map((purchase) => (
            <View key={purchase.id} style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.listItemTitle}>{purchase.supplier}</Text>
                <Text style={[styles.listItemAmount, { color: COLORS.DANGER }]}>
                  -{purchase.totalAmount.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.listItemDescription}>
                {purchase.items.length} {t('purchases.items')}
              </Text>
              <Text style={styles.listItemDate}>
                {purchase.date.toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent purchases</Text>
        )}
      </View>

      {/* Recent Sales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dashboard.recentSales')}</Text>
        {recentSales.length > 0 ? (
          recentSales.map((sale) => (
            <View key={sale.id} style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.listItemTitle}>{sale.customer}</Text>
                <Text style={[styles.listItemAmount, { color: COLORS.SUCCESS }]}>
                  +{sale.totalAmount.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.listItemDescription}>
                {sale.items.length} {t('sales.items')}
              </Text>
              <Text style={styles.listItemDate}>
                {sale.date.toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent sales</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.LIGHT,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.DARK,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
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
  cardTitle: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  paymentMethodCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethodCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    elevation: 1,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentMethodTitle: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 8,
  },
  paymentMethodValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.DARK,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
    paddingVertical: 12,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItemDescription: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginTop: 4,
  },
  listItemDate: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.GRAY,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
});

export default DashboardScreen;
