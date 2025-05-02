import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import CustomDateTimePicker from '../components/CustomDateTimePicker';
import { COLORS } from '../constants';
import {
  getPurchases,
  addPurchase,
  updatePurchase,
  deletePurchase,
  getInventoryItems,
  getFunds,
  updateInventoryItem,
  updateFund
} from '../services/firestore';
import { checkFirebaseConnection } from '../services/firebase';
import { Purchase, PurchaseItem, InventoryItem, Fund } from '../types';

const PurchasesScreen = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State for purchases list
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // State for saving process
  const [saving, setSaving] = useState(false);

  // State for inventory items and funds (needed for purchase form)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);

  // State for purchase form modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  // Form state
  const [date, setDate] = useState(new Date());
  const [supplier, setSupplier] = useState('');
  const [selectedFundId, setSelectedFundId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [isPaid, setIsPaid] = useState(true);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data...');

      // Check Firebase connection first
      const isConnected = await checkFirebaseConnection();
      if (!isConnected) {
        Alert.alert(
          t('common.error'),
          'Could not connect to Firebase. Please check your internet connection and try again.'
        );
        return;
      }

      console.log('Firebase connection verified, fetching data...');

      // Fetch purchases
      console.log('Fetching purchases...');
      const purchasesData = await getPurchases();
      console.log(`Fetched ${purchasesData.length} purchases`);
      setPurchases(purchasesData);

      // Fetch inventory items for the form
      console.log('Fetching inventory items...');
      const inventoryData = await getInventoryItems();
      console.log(`Fetched ${inventoryData.length} inventory items`);
      setInventoryItems(inventoryData);

      // Fetch funds for the form
      console.log('Fetching funds...');
      const fundsData = await getFunds();
      console.log(`Fetched ${fundsData.length} funds`);
      setFunds(fundsData);

      if (fundsData.length > 0 && !selectedFundId) {
        console.log(`Setting default fund ID to ${fundsData[0].id}`);
        setSelectedFundId(fundsData[0].id);
      }

      console.log('All data fetched successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert(t('common.error'), `${t('common.fetchError')} ${error instanceof Error ? error.message : ''}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPurchase = () => {
    // Reset form state
    setEditingPurchase(null);
    setDate(new Date());
    setSupplier('');
    setPurchaseItems([]);
    setPaymentMethod('cash');
    setIsPaid(true);

    // Set default fund if available
    if (funds.length > 0) {
      setSelectedFundId(funds[0].id);
    }

    setModalVisible(true);
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setDate(purchase.date);
    setSupplier(purchase.supplier);
    setPurchaseItems([...purchase.items]);
    setSelectedFundId(purchase.fundId);
    setPaymentMethod(purchase.paymentMethod || 'cash'); // Default to cash if not set
    setIsPaid(purchase.isPaid);
    setModalVisible(true);
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    try {
      await deletePurchase(purchaseId);
      setPurchases(purchases.filter(p => p.id !== purchaseId));
      Alert.alert(t('common.success'), t('purchases.purchaseDeleted'));
    } catch (error) {
      console.error('Error deleting purchase:', error);
      Alert.alert(t('common.error'), t('common.deleteError'));
    }
  };

  const calculateTotalAmount = () => {
    return purchaseItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const formatDate = (date: Date) => {
    // Use the i18n object from the component scope instead of calling useTranslation() again
    const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      calendar: 'gregory',
    });
  };

  const getTotalPurchasesAmount = () => {
    return purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
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
        <Text style={styles.title}>{t('purchases.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPurchase}
        >
          <Ionicons name="add" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('purchases.totalPurchases')}</Text>
          <Text style={styles.summaryValue}>{getTotalPurchasesAmount().toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('purchases.purchaseCount')}</Text>
          <Text style={styles.summaryValue}>{purchases.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.purchasesList}>
        {purchases.length > 0 ? (
          purchases.map((purchase) => (
            <View key={purchase.id} style={styles.purchaseCard}>
              <View style={styles.purchaseHeader}>
                <Text style={styles.purchaseSupplier}>{purchase.supplier}</Text>
                <Text style={styles.purchaseAmount}>
                  {purchase.totalAmount.toFixed(2)}
                </Text>
              </View>

              <Text style={styles.purchaseItemsCount}>
                {purchase.items.length} {t('purchases.items')}
              </Text>

              <View style={styles.purchaseDetails}>
                <Text style={styles.purchaseDate}>
                  {formatDate(purchase.date)}
                </Text>
                <View style={styles.purchaseActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditPurchase(purchase)}
                  >
                    <Ionicons name="pencil" size={16} color={COLORS.PRIMARY} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeletePurchase(purchase.id)}
                  >
                    <Ionicons name="trash" size={16} color={COLORS.DANGER} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t('purchases.noPurchases')}</Text>
        )}
      </ScrollView>

      {/* Purchase Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingPurchase ? t('purchases.editPurchase') : t('purchases.addPurchase')}
            </Text>

            {/* Date Input */}
            <CustomDateTimePicker
              label={t('purchases.date')}
              value={date}
              onChange={(selectedDate) => setDate(selectedDate)}
              mode="date"
            />

            {/* Supplier Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('purchases.supplier')}</Text>
              <TextInput
                style={styles.input}
                value={supplier}
                onChangeText={setSupplier}
                placeholder={t('purchases.supplier')}
              />
            </View>

            {/* Fund Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('purchases.paymentMethod')}</Text>
              <View style={styles.pickerContainer}>
                {funds.map((fund) => (
                  <TouchableOpacity
                    key={fund.id}
                    style={[
                      styles.pickerItem,
                      selectedFundId === fund.id && styles.selectedPickerItem
                    ]}
                    onPress={() => {
                      setSelectedFundId(fund.id);
                      // Set payment method based on fund name
                      if (fund.name === 'Cash') {
                        setPaymentMethod('cash');
                      } else if (fund.name === 'Bank') {
                        setPaymentMethod('bank');
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedFundId === fund.id && styles.selectedPickerItemText
                      ]}
                    >
                      {fund.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('purchases.paymentMethod')}</Text>
              <View style={styles.paymentMethodContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodItem,
                    paymentMethod === 'cash' && styles.selectedPaymentMethodItem
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Text
                    style={[
                      styles.paymentMethodItemText,
                      paymentMethod === 'cash' && styles.selectedPaymentMethodItemText
                    ]}
                  >
                    {t('purchases.cash')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodItem,
                    paymentMethod === 'bank' && styles.selectedPaymentMethodItem
                  ]}
                  onPress={() => setPaymentMethod('bank')}
                >
                  <Text
                    style={[
                      styles.paymentMethodItemText,
                      paymentMethod === 'bank' && styles.selectedPaymentMethodItemText
                    ]}
                  >
                    {t('purchases.bank')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Is Paid Toggle */}
            <View style={styles.inputContainer}>
              <View style={styles.switchContainer}>
                <Text style={styles.inputLabel}>{t('purchases.isPaid')}</Text>
                <Switch
                  value={isPaid}
                  onValueChange={setIsPaid}
                  trackColor={{ false: COLORS.LIGHT, true: COLORS.PRIMARY }}
                  thumbColor={isPaid ? COLORS.WHITE : COLORS.GRAY}
                />
              </View>
            </View>

            {/* Items Section */}
            <View style={styles.itemsSection}>
              <View style={styles.itemsSectionHeader}>
                <Text style={styles.itemsSectionTitle}>{t('purchases.items')}</Text>
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={() => {
                    // Add a new empty item
                    const newItem: PurchaseItem = {
                      id: Date.now().toString(),
                      inventoryItemId: '',
                      name: '',
                      quantity: 0,
                      pricePerUnit: 0,
                      totalPrice: 0
                    };
                    setPurchaseItems([...purchaseItems, newItem]);
                  }}
                >
                  <Ionicons name="add" size={20} color={COLORS.WHITE} />
                </TouchableOpacity>
              </View>

              {purchaseItems.length > 0 ? (
                <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                  {purchaseItems.map((item, index) => (
                    <View key={item.id} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemIndexText}>#{index + 1}</Text>
                        <TouchableOpacity
                          style={styles.removeItemButton}
                          onPress={() => {
                            const updatedItems = [...purchaseItems];
                            updatedItems.splice(index, 1);
                            setPurchaseItems(updatedItems);
                          }}
                        >
                          <Ionicons name="close" size={20} color={COLORS.DANGER} />
                        </TouchableOpacity>
                      </View>

                      {/* Item Selection */}
                      <View style={styles.itemInputContainer}>
                        <Text style={styles.itemInputLabel}>{t('purchases.item')}</Text>
                        <View style={styles.itemPickerContainer}>
                          {inventoryItems.map((invItem) => (
                            <TouchableOpacity
                              key={invItem.id}
                              style={[
                                styles.itemPickerItem,
                                item.inventoryItemId === invItem.id && styles.selectedItemPickerItem
                              ]}
                              onPress={() => {
                                const updatedItems = [...purchaseItems];
                                updatedItems[index] = {
                                  ...updatedItems[index],
                                  inventoryItemId: invItem.id,
                                  name: invItem.name,
                                  pricePerUnit: invItem.purchasePrice,
                                  totalPrice: updatedItems[index].quantity * invItem.purchasePrice
                                };
                                setPurchaseItems(updatedItems);
                              }}
                            >
                              <Text
                                style={[
                                  styles.itemPickerItemText,
                                  item.inventoryItemId === invItem.id && styles.selectedItemPickerItemText
                                ]}
                              >
                                {invItem.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Quantity Input */}
                      <View style={styles.itemInputContainer}>
                        <Text style={styles.itemInputLabel}>{t('purchases.quantity')}</Text>
                        <TextInput
                          style={styles.itemInput}
                          value={item.quantity.toString()}
                          onChangeText={(value) => {
                            const quantity = parseFloat(value) || 0;
                            const updatedItems = [...purchaseItems];
                            updatedItems[index] = {
                              ...updatedItems[index],
                              quantity,
                              totalPrice: quantity * updatedItems[index].pricePerUnit
                            };
                            setPurchaseItems(updatedItems);
                          }}
                          keyboardType="numeric"
                        />
                      </View>

                      {/* Price Per Unit Input */}
                      <View style={styles.itemInputContainer}>
                        <Text style={styles.itemInputLabel}>{t('purchases.pricePerUnit')}</Text>
                        <TextInput
                          style={styles.itemInput}
                          value={item.pricePerUnit.toString()}
                          onChangeText={(value) => {
                            const pricePerUnit = parseFloat(value) || 0;
                            const updatedItems = [...purchaseItems];
                            updatedItems[index] = {
                              ...updatedItems[index],
                              pricePerUnit,
                              totalPrice: updatedItems[index].quantity * pricePerUnit
                            };
                            setPurchaseItems(updatedItems);
                          }}
                          keyboardType="numeric"
                        />
                      </View>

                      {/* Total Price (Calculated) */}
                      <View style={styles.itemInputContainer}>
                        <Text style={styles.itemInputLabel}>{t('purchases.totalPrice')}</Text>
                        <Text style={styles.itemTotalPrice}>
                          {item.totalPrice.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noItemsText}>{t('purchases.noItems')}</Text>
              )}

              {/* Total Amount */}
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>{t('purchases.totalAmount')}</Text>
                <Text style={styles.totalValue}>{calculateTotalAmount().toFixed(2)}</Text>
              </View>
            </View>

            {/* Form Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, saving && styles.saveButtonDisabled]}
                disabled={saving}
                onPress={async () => {
                  // Validate form
                  if (!supplier.trim()) {
                    Alert.alert(t('common.error'), t('purchases.supplierRequired'));
                    return;
                  }

                  if (purchaseItems.length === 0) {
                    Alert.alert(t('common.error'), t('purchases.itemsRequired'));
                    return;
                  }

                  for (const item of purchaseItems) {
                    if (!item.inventoryItemId || item.quantity <= 0) {
                      Alert.alert(t('common.error'), t('purchases.invalidItems'));
                      return;
                    }
                  }

                  try {
                    setLoading(true);
                    setSaving(true);
                    console.log('Saving purchase...');

                    // Check Firebase connection first
                    console.log('Checking Firebase connection...');
                    const isConnected = await checkFirebaseConnection();
                    if (!isConnected) {
                      setLoading(false);
                      Alert.alert(
                        t('common.error'),
                        'Could not connect to Firebase. Please check your internet connection and try again.'
                      );
                      return;
                    }
                    console.log('Firebase connection verified');

                    const totalAmount = calculateTotalAmount();
                    console.log('Total amount:', totalAmount);

                    // Prepare purchase data with proper date format for Firestore
                    const purchaseData = {
                      date,
                      supplier,
                      items: purchaseItems,
                      totalAmount,
                      fundId: selectedFundId,
                      paymentMethod,
                      isPaid
                    };

                    console.log('Purchase data:', JSON.stringify(purchaseData));

                    if (editingPurchase) {
                      console.log('Updating existing purchase:', editingPurchase.id);
                      // Update existing purchase
                      await updatePurchase(editingPurchase.id, purchaseData);

                      // Update purchases list
                      setPurchases(
                        purchases.map(p =>
                          p.id === editingPurchase.id
                            ? {
                                ...p,
                                ...purchaseData
                              }
                            : p
                        )
                      );
                      console.log('Purchase updated successfully');
                    } else {
                      console.log('Adding new purchase');
                      // Add new purchase
                      const newPurchase = await addPurchase(purchaseData);
                      console.log('New purchase added with ID:', newPurchase.id);

                      // Update purchases list
                      setPurchases([newPurchase, ...purchases]);
                    }

                    console.log('Updating inventory quantities...');
                    // Update inventory quantities
                    for (const item of purchaseItems) {
                      const inventoryItem = inventoryItems.find(i => i.id === item.inventoryItemId);
                      if (inventoryItem) {
                        console.log('Updating inventory item:', inventoryItem.id);
                        console.log('Current quantity:', inventoryItem.quantity);
                        console.log('Adding quantity:', item.quantity);

                        const newQuantity = inventoryItem.quantity + item.quantity;
                        const newTotalPurchaseCost = inventoryItem.totalPurchaseCost + item.totalPrice;

                        console.log('New quantity:', newQuantity);
                        console.log('New total purchase cost:', newTotalPurchaseCost);

                        await updateInventoryItem(inventoryItem.id, {
                          quantity: newQuantity,
                          totalPurchaseCost: newTotalPurchaseCost
                        });
                        console.log('Inventory item updated successfully');
                      }
                    }

                    // Update fund balance if paid
                    if (isPaid) {
                      console.log('Updating fund balance...');
                      const fund = funds.find(f => f.id === selectedFundId);
                      if (fund) {
                        console.log('Current fund balance:', fund.balance);
                        console.log('Deducting amount:', totalAmount);

                        const newBalance = fund.balance - totalAmount;
                        console.log('New fund balance:', newBalance);

                        await updateFund(fund.id, { balance: newBalance });
                        console.log('Fund balance updated successfully');
                      }
                    }

                    // Close modal first
                    setModalVisible(false);

                    // Show success message with more details
                    Alert.alert(
                      t('common.success'),
                      editingPurchase
                        ? `${t('purchases.purchaseUpdated')} - ${supplier} (${totalAmount.toFixed(2)})`
                        : `${t('purchases.purchaseAdded')} - ${supplier} (${totalAmount.toFixed(2)})`
                    );

                    // Refresh data
                    console.log('Refreshing data...');
                    fetchData();
                    console.log('Data refreshed successfully');
                  } catch (error) {
                    console.error('Error saving purchase:', error);
                    // Show more detailed error message
                    Alert.alert(
                      t('common.error'),
                      `${t('common.saveError')} ${error instanceof Error ? error.message : ''}`
                    );
                  } finally {
                    setLoading(false);
                    setSaving(false);
                  }
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.WHITE} />
                ) : (
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
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
  purchasesList: {
    flex: 1,
    padding: 16,
  },
  purchaseCard: {
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
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  purchaseSupplier: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  purchaseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DANGER,
  },
  purchaseItemsCount: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 8,
  },
  purchaseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  purchaseDate: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  purchaseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: COLORS.LIGHT,
  },
  deleteButton: {
    backgroundColor: COLORS.LIGHT,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY,
    textAlign: 'center',
    marginTop: 32,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.LIGHT,
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  dateInput: {
    backgroundColor: COLORS.LIGHT,
    borderRadius: 4,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: COLORS.DARK,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerItem: {
    backgroundColor: COLORS.LIGHT,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPickerItem: {
    backgroundColor: COLORS.PRIMARY,
  },
  pickerItemText: {
    color: COLORS.DARK,
  },
  selectedPickerItemText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethodItem: {
    flex: 1,
    backgroundColor: COLORS.LIGHT,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedPaymentMethodItem: {
    backgroundColor: COLORS.PRIMARY,
  },
  paymentMethodItemText: {
    color: COLORS.DARK,
    fontSize: 16,
  },
  selectedPaymentMethodItemText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsSection: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
    padding: 16,
    maxHeight: 300,
  },
  itemsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  addItemButton: {
    backgroundColor: COLORS.PRIMARY,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsList: {
    maxHeight: 200,
  },
  itemCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemIndexText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  removeItemButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInputContainer: {
    marginBottom: 8,
  },
  itemInputLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 2,
  },
  itemInput: {
    backgroundColor: COLORS.LIGHT,
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
  },
  itemPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemPickerItem: {
    backgroundColor: COLORS.LIGHT,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  selectedItemPickerItem: {
    backgroundColor: COLORS.PRIMARY,
  },
  itemPickerItemText: {
    fontSize: 12,
    color: COLORS.DARK,
  },
  selectedItemPickerItemText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  itemTotalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.DARK,
    padding: 8,
  },
  noItemsText: {
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: 'center',
    marginVertical: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.WHITE,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DANGER,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.LIGHT,
  },
  cancelButtonText: {
    color: COLORS.GRAY,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.PRIMARY + '80', // 50% opacity
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
});

export default PurchasesScreen;
