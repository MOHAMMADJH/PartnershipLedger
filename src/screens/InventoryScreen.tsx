import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, ROUTES } from '../constants/index';
import { getInventoryItems, getPurchases, getSales } from '../services/supabase';
import { InventoryItem, Purchase, Sale } from '../types';

const InventoryScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modal state
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Get low stock items
  const getLowStockItems = () => {
    return inventory.filter(item =>
      (item.minQuantity !== undefined && item.quantity <= item.minQuantity) ||
      item.quantity === 0
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters when inventory or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [inventory, searchQuery, filterCategory, showLowStockOnly]);

  // Show low stock alert on load if there are items below minimum quantity
  useEffect(() => {
    if (!loading && getLowStockItems().length > 0) {
      setShowAlertModal(true);
    }
  }, [loading]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch inventory items
      const inventoryData = await getInventoryItems();
      setInventory(inventoryData);
      setFilteredInventory(inventoryData); // Initialize filtered inventory with all items

      // Fetch purchase and sales history for movement tracking
      const purchasesData = await getPurchases();
      setPurchases(purchasesData);

      const salesData = await getSales();
      setSales(salesData);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      Alert.alert(t('common.error'), t('common.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...inventory];

    console.log(`Applying filters: searchQuery=${searchQuery}, filterCategory=${filterCategory}, showLowStockOnly=${showLowStockOnly}`);
    console.log(`Initial inventory count: ${result.length}`);

    // Apply search filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query))
      );
      console.log(`After search filter: ${result.length} items`);
    }

    // Apply category filter
    if (filterCategory) {
      result = result.filter(item =>
        item.category === filterCategory
      );
      console.log(`After category filter: ${result.length} items`);
    }

    // Apply low stock filter
    if (showLowStockOnly) {
      result = result.filter(item =>
        (item.minQuantity !== undefined && item.quantity <= item.minQuantity) ||
        item.quantity === 0
      );
      console.log(`After low stock filter: ${result.length} items`);
    }

    console.log(`Final filtered inventory count: ${result.length}`);
    setFilteredInventory(result);
  };

  const getTotalInventoryValue = () => {
    return inventory.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
  };

  const getTotalInventoryCount = () => {
    return inventory.reduce((sum, item) => sum + item.quantity, 0);
  };

  const navigateToItemManagement = () => {
    // @ts-ignore - Type safety is handled at runtime
    navigation.navigate(ROUTES.ITEM_MANAGEMENT);
  };

  // Get purchase history for an item
  const getItemPurchaseHistory = (itemId: string) => {
    return purchases
      .filter(purchase =>
        purchase.items.some(item => item.inventoryItemId === itemId)
      )
      .map(purchase => {
        const purchaseItem = purchase.items.find(item => item.inventoryItemId === itemId);
        return {
          id: purchase.id,
          date: purchase.date,
          quantity: purchaseItem?.quantity || 0,
          pricePerUnit: purchaseItem?.pricePerUnit || 0,
          totalPrice: purchaseItem?.totalPrice || 0,
          supplier: purchase.supplier
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
  };

  // Get sales history for an item
  const getItemSaleHistory = (itemId: string) => {
    return sales
      .filter(sale =>
        sale.items.some(item => item.inventoryItemId === itemId)
      )
      .map(sale => {
        const saleItem = sale.items.find(item => item.inventoryItemId === itemId);
        return {
          id: sale.id,
          date: sale.date,
          quantity: saleItem?.quantity || 0,
          pricePerUnit: saleItem?.pricePerUnit || 0,
          totalPrice: saleItem?.totalPrice || 0,
          profit: saleItem?.profit || 0,
          customer: sale.customer
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
  };

  // Show item movement history
  const showItemMovement = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowMovementModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('inventory.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={navigateToItemManagement}
        >
          <Ionicons name="list" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.GRAY} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('inventory.search')}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.GRAY} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Options */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            !filterCategory && !showLowStockOnly && styles.activeFilterButton
          ]}
          onPress={() => {
            setFilterCategory('');
            setShowLowStockOnly(false);
          }}
        >
          <Text style={[
            styles.filterButtonText,
            !filterCategory && !showLowStockOnly && styles.activeFilterTypeText
          ]}>{t('inventory.all')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            showLowStockOnly && styles.activeFilterButton
          ]}
          onPress={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          <Text style={[
            styles.filterButtonText,
            showLowStockOnly && styles.activeFilterTypeText
          ]}>{t('inventory.lowStockItems')}</Text>
          {getLowStockItems().length > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{getLowStockItems().length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Show unique categories as filter buttons */}
        {Array.from(new Set(inventory.map(item => item.category).filter(Boolean))).map(
          (category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                filterCategory === category && styles.activeFilterButton
              ]}
              onPress={() => {
                setFilterCategory(filterCategory === category ? '' : category as string);
                setShowLowStockOnly(false);
              }}
            >
              <Text style={[
                styles.filterButtonText,
                filterCategory === category && styles.activeFilterTypeText
              ]}>{category}</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('inventory.totalItems')}</Text>
          <Text style={styles.summaryValue}>{inventory.length}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('inventory.totalQuantity')}</Text>
          <Text style={styles.summaryValue}>{getTotalInventoryCount()}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('inventory.totalValue')}</Text>
          <Text style={styles.summaryValue}>{getTotalInventoryValue().toFixed(2)}</Text>
        </View>
      </View>

      <ScrollView style={styles.inventoryList}>
        {filteredInventory.length > 0 ? (
          filteredInventory.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.inventoryItem}
              onPress={() => showItemMovement(item)}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>{t('inventory.quantity')}</Text>
                  <Text
                    style={[
                      styles.quantityValue,
                      item.quantity === 0 && styles.outOfStockText,
                      item.minQuantity !== undefined &&
                      item.quantity <= item.minQuantity &&
                      item.quantity > 0 && styles.lowStockText
                    ]}
                  >
                    {item.quantity}
                  </Text>
                </View>
              </View>

              {/* Stock Status Indicator */}
              {item.quantity === 0 ? (
                <View style={styles.stockStatusContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.DANGER} />
                  <Text style={styles.outOfStockText}>{t('inventory.outOfStock')}</Text>
                </View>
              ) : item.minQuantity !== undefined && item.quantity <= item.minQuantity ? (
                <View style={styles.stockStatusContainer}>
                  <Ionicons name="warning" size={16} color={COLORS.WARNING} />
                  <Text style={styles.lowStockText}>{t('inventory.lowStock')}</Text>
                </View>
              ) : (
                <View style={styles.stockStatusContainer}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                  <Text style={styles.inStockText}>{t('inventory.inStock')}</Text>
                </View>
              )}

              <View style={styles.itemDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('inventory.purchasePrice')}</Text>
                  <Text style={styles.detailValue}>{item.purchasePrice.toFixed(2)}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('inventory.sellingPrice')}</Text>
                  <Text style={styles.detailValue}>{item.sellingPrice.toFixed(2)}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('inventory.totalCost')}</Text>
                  <Text style={styles.detailValue}>
                    {(item.quantity * item.purchasePrice).toFixed(2)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={COLORS.GRAY} />
            <Text style={styles.emptyText}>{t('inventory.noItems')}</Text>
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={navigateToItemManagement}
            >
              <Text style={styles.addItemButtonText}>{t('inventory.addItem')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Item Movement History Modal */}
      <Modal
        visible={showMovementModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMovementModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedItem?.name} - {t('inventory.movement')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMovementModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedItem && (
                <>
                  {/* Item Details */}
                  <View style={styles.movementItemDetails}>
                    <Text style={styles.movementItemName}>{selectedItem.name}</Text>
                    {selectedItem.description && (
                      <Text style={styles.movementItemDescription}>{selectedItem.description}</Text>
                    )}
                    <View style={styles.movementItemStats}>
                      <View style={styles.movementItemStat}>
                        <Text style={styles.movementItemStatLabel}>{t('inventory.quantity')}</Text>
                        <Text style={styles.movementItemStatValue}>{selectedItem.quantity}</Text>
                      </View>
                      <View style={styles.movementItemStat}>
                        <Text style={styles.movementItemStatLabel}>{t('inventory.purchasePrice')}</Text>
                        <Text style={styles.movementItemStatValue}>{selectedItem.purchasePrice.toFixed(2)}</Text>
                      </View>
                      <View style={styles.movementItemStat}>
                        <Text style={styles.movementItemStatLabel}>{t('inventory.sellingPrice')}</Text>
                        <Text style={styles.movementItemStatValue}>{selectedItem.sellingPrice.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Purchase History */}
                  <View style={styles.movementSection}>
                    <Text style={styles.movementSectionTitle}>{t('inventory.purchaseHistory')}</Text>
                    {getItemPurchaseHistory(selectedItem.id).length > 0 ? (
                      getItemPurchaseHistory(selectedItem.id).map((purchase) => (
                        <View key={purchase.id} style={styles.movementItem}>
                          <View style={styles.movementItemHeader}>
                            <Text style={styles.movementItemDate}>
                              {purchase.date.toLocaleDateString()}
                            </Text>
                            <Text style={styles.movementItemSupplier}>{purchase.supplier}</Text>
                          </View>
                          <View style={styles.movementItemDetails}>
                            <Text style={styles.movementItemQuantity}>
                              {t('inventory.quantity')}: {purchase.quantity}
                            </Text>
                            <Text style={styles.movementItemPrice}>
                              {purchase.pricePerUnit.toFixed(2)} × {purchase.quantity} = {purchase.totalPrice.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noMovementText}>{t('inventory.noPurchases')}</Text>
                    )}
                  </View>

                  {/* Sales History */}
                  <View style={styles.movementSection}>
                    <Text style={styles.movementSectionTitle}>{t('inventory.saleHistory')}</Text>
                    {getItemSaleHistory(selectedItem.id).length > 0 ? (
                      getItemSaleHistory(selectedItem.id).map((sale) => (
                        <View key={sale.id} style={styles.movementItem}>
                          <View style={styles.movementItemHeader}>
                            <Text style={styles.movementItemDate}>
                              {sale.date.toLocaleDateString()}
                            </Text>
                            <Text style={styles.movementItemCustomer}>{sale.customer}</Text>
                          </View>
                          <View style={styles.movementItemDetails}>
                            <Text style={styles.movementItemQuantity}>
                              {t('inventory.quantity')}: {sale.quantity}
                            </Text>
                            <Text style={styles.movementItemPrice}>
                              {sale.pricePerUnit.toFixed(2)} × {sale.quantity} = {sale.totalPrice.toFixed(2)}
                            </Text>
                            <Text style={styles.movementItemProfit}>
                              {t('inventory.profit')}: {sale.profit.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noMovementText}>{t('inventory.noSales')}</Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Low Stock Alert Modal */}
      <Modal
        visible={showAlertModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={styles.alertModalContainer}>
          <View style={styles.alertModalContent}>
            <View style={styles.alertModalHeader}>
              <Ionicons name="warning" size={24} color={COLORS.WARNING} />
              <Text style={styles.alertModalTitle}>{t('inventory.stockAlert')}</Text>
            </View>

            <Text style={styles.alertModalDescription}>
              {t('inventory.stockAlertDescription')}
            </Text>

            <ScrollView style={styles.alertModalList}>
              {getLowStockItems().map((item) => (
                <View key={item.id} style={styles.alertModalItem}>
                  <Text style={styles.alertModalItemName}>{item.name}</Text>
                  <View style={styles.alertModalItemQuantity}>
                    <Text style={styles.alertModalItemQuantityText}>
                      {item.quantity} / {item.minQuantity}
                    </Text>
                    <View
                      style={[
                        styles.alertModalItemQuantityBar,
                        { width: `${Math.min(100, (item.quantity / (item.minQuantity || 1)) * 100)}%` }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.alertModalButton}
              onPress={() => setShowAlertModal(false)}
            >
              <Text style={styles.alertModalButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Search and Filter styles
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.DARK,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    color: COLORS.GRAY,
    fontSize: 14,
  },
  activeFilterButtonText: {
    color: COLORS.WHITE,
  },
  activeFilterTypeText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  badgeContainer: {
    backgroundColor: COLORS.DANGER,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  inventoryList: {
    flex: 1,
    padding: 16,
  },
  inventoryItem: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    flex: 1,
  },
  quantityContainer: {
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  // Stock status styles
  stockStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  outOfStockText: {
    color: COLORS.DANGER,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  lowStockText: {
    color: COLORS.WARNING,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  inStockText: {
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.DARK,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addItemButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addItemButtonText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  movementItemDetails: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
  },
  movementItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  movementItemDescription: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 8,
  },
  movementItemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  movementItemStat: {
    alignItems: 'center',
  },
  movementItemStatLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  movementItemStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  movementSection: {
    marginBottom: 16,
  },
  movementSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
    paddingBottom: 4,
  },
  movementItem: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  movementItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  movementItemDate: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  movementItemSupplier: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  movementItemCustomer: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  movementItemQuantity: {
    fontSize: 14,
    color: COLORS.DARK,
  },
  movementItemPrice: {
    fontSize: 14,
    color: COLORS.DARK,
  },
  movementItemProfit: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  noMovementText: {
    fontSize: 14,
    color: COLORS.GRAY,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  // Alert modal styles
  alertModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertModalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    width: '80%',
    maxHeight: '70%',
    padding: 16,
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  alertModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginLeft: 8,
  },
  alertModalDescription: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 16,
  },
  alertModalList: {
    maxHeight: 300,
  },
  alertModalItem: {
    marginBottom: 12,
  },
  alertModalItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  alertModalItemQuantity: {
    backgroundColor: COLORS.LIGHT,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  alertModalItemQuantityText: {
    position: 'absolute',
    fontSize: 12,
    color: COLORS.DARK,
    width: '100%',
    textAlign: 'center',
    lineHeight: 20,
  },
  alertModalItemQuantityBar: {
    height: '100%',
    backgroundColor: COLORS.WARNING,
  },
  alertModalButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  alertModalButtonText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
});

export default InventoryScreen;
