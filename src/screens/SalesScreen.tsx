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
  getSales,
  addSale,
  updateSale,
  deleteSale,
  getInventoryItems,
  getFunds,
  updateInventoryItem,
  updateFund
} from '../services/firestore';
import { checkFirebaseConnection } from '../services/firebase';
import { Sale, SaleItem, InventoryItem, Fund } from '../types';

const SalesScreen = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State for sales list
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);

  // State for saving process
  const [saving, setSaving] = useState(false);

  // State for inventory items and funds (needed for sale form)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);

  // State for sale form modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // State for sale form fields
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customer, setCustomer] = useState('');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedFundId, setSelectedFundId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [isPaid, setIsPaid] = useState(true);

  // State for item selection
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');

  // Load sales data on component mount
  useEffect(() => {
    loadSalesData();
  }, []);

  // Function to load sales data from Firestore
  const loadSalesData = async () => {
    try {
      setLoading(true);

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

      // Fetch sales data
      const salesData = await getSales();
      console.log(`Fetched ${salesData.length} sales from Firestore`);
      setSales(salesData);

      // Fetch inventory items for sale form
      const inventoryData = await getInventoryItems();
      console.log(`Fetched ${inventoryData.length} inventory items from Firestore`);
      setInventoryItems(inventoryData);

      // Fetch funds for sale form
      const fundsData = await getFunds();
      console.log(`Fetched ${fundsData.length} funds from Firestore`);
      setFunds(fundsData);

      // Set default fund if available
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

  // Calculate total sales amount
  const getTotalSalesAmount = () => {
    return sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  };

  // Handle adding a new sale
  const handleAddSale = () => {
    // Reset form state
    setEditingSale(null);
    setDate(new Date());
    setCustomer('');
    setSaleItems([]);
    setPaymentMethod('cash');
    setIsPaid(true);

    // Set default fund if available
    if (funds.length > 0) {
      setSelectedFundId(funds[0].id);
    }

    setModalVisible(true);
  };

  // Handle editing an existing sale
  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setDate(sale.date);
    setCustomer(sale.customer);
    setSaleItems([...sale.items]);
    setSelectedFundId(sale.fundId);
    setPaymentMethod(sale.paymentMethod || 'cash'); // Default to cash if not set
    setIsPaid(sale.isPaid);
    setModalVisible(true);
  };

  // Handle deleting a sale
  const handleDeleteSale = async (saleId: string) => {
    try {
      await deleteSale(saleId);
      setSales(sales.filter(s => s.id !== saleId));
      Alert.alert(t('common.success'), t('sales.saleDeleted'));
    } catch (error) {
      console.error('Error deleting sale:', error);
      Alert.alert(t('common.error'), t('common.deleteError'));
    }
  };

  // Calculate total amount for the current sale form
  const calculateTotalAmount = () => {
    return saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Add item to the current sale
  const addItemToSale = () => {
    if (!selectedItemId || !quantity || !pricePerUnit) {
      Alert.alert(t('common.error'), t('sales.invalidItems'));
      return;
    }

    const inventoryItem = inventoryItems.find(item => item.id === selectedItemId);
    if (!inventoryItem) {
      Alert.alert(t('common.error'), t('common.invalidInput'));
      return;
    }

    const quantityNum = parseFloat(quantity);
    const pricePerUnitNum = parseFloat(pricePerUnit);

    if (isNaN(quantityNum) || isNaN(pricePerUnitNum) || quantityNum <= 0 || pricePerUnitNum <= 0) {
      Alert.alert(t('common.error'), t('common.invalidInput'));
      return;
    }

    // Check if there's enough quantity in inventory
    if (quantityNum > inventoryItem.quantity) {
      Alert.alert(t('common.error'), t('sales.insufficientQuantity'));
      return;
    }

    const totalPrice = quantityNum * pricePerUnitNum;

    // Calculate profit (selling price - purchase price)
    const profit = (pricePerUnitNum - inventoryItem.purchasePrice) * quantityNum;

    const newItem: SaleItem = {
      id: Date.now().toString(), // Temporary ID
      inventoryItemId: selectedItemId,
      name: inventoryItem.name,
      quantity: quantityNum,
      pricePerUnit: pricePerUnitNum,
      totalPrice,
      profit
    };

    setSaleItems([...saleItems, newItem]);

    // Reset item form
    setSelectedItemId('');
    setQuantity('');
    setPricePerUnit('');
  };

  // Remove item from the current sale
  const removeItemFromSale = (itemId: string) => {
    setSaleItems(saleItems.filter(item => item.id !== itemId));
  };

  // Save the current sale
  const saveSale = async () => {
    try {
      console.log('Saving sale...');

      if (!customer) {
        console.log('Customer is required');
        Alert.alert(t('common.error'), t('sales.customerRequired'));
        return;
      }

      if (saleItems.length === 0) {
        console.log('No items added to sale');
        Alert.alert(t('common.error'), t('sales.itemsRequired'));
        return;
      }

      // Check Firebase connection first
      console.log('Checking Firebase connection...');
      setSaving(true); // Start showing loading animation
      const isConnected = await checkFirebaseConnection();
      if (!isConnected) {
        setSaving(false); // Stop loading animation
        Alert.alert(
          t('common.error'),
          'Could not connect to Firebase. Please check your internet connection and try again.'
        );
        return;
      }
      console.log('Firebase connection verified');

      const totalAmount = calculateTotalAmount();
      console.log('Total amount:', totalAmount);

      // Prepare sale data
      const saleData: Omit<Sale, 'id'> = {
        date,
        customer,
        items: saleItems,
        totalAmount,
        fundId: selectedFundId,
        paymentMethod,
        isPaid
      };

      console.log('Sale data prepared:', JSON.stringify(saleData));

      if (editingSale) {
        console.log('Updating existing sale:', editingSale.id);
        // Update existing sale
        await updateSale(editingSale.id, saleData);
        console.log('Sale updated in Firestore');

        // Update sales list
        setSales(sales.map(s => s.id === editingSale.id ? { ...saleData, id: editingSale.id } : s));
        console.log('Sales list updated in state');
      } else {
        console.log('Adding new sale');
        // Add new sale
        const newSale = await addSale(saleData);
        console.log('New sale added to Firestore with ID:', newSale.id);

        // Update sales list
        setSales([newSale, ...sales]);
        console.log('Sales list updated in state with new sale');
      }

      console.log('Updating inventory quantities...');
      // Update inventory quantities
      for (const item of saleItems) {
        const inventoryItem = inventoryItems.find(i => i.id === item.inventoryItemId);
        if (inventoryItem) {
          const newQuantity = inventoryItem.quantity - item.quantity;
          console.log(`Updating inventory item ${inventoryItem.name} quantity from ${inventoryItem.quantity} to ${newQuantity}`);
          await updateInventoryItem(item.inventoryItemId, { quantity: newQuantity });
        }
      }
      console.log('Inventory quantities updated');

      console.log('Updating fund balance...');
      // Update fund balance
      const fund = funds.find(f => f.id === selectedFundId);
      if (fund) {
        const newBalance = fund.balance + totalAmount;
        console.log(`Updating fund ${fund.name} balance from ${fund.balance} to ${newBalance}`);
        await updateFund(selectedFundId, { balance: newBalance });
      }
      console.log('Fund balance updated');

      // Show success message with more details
      Alert.alert(
        t('common.success'),
        editingSale
          ? `${t('sales.saleUpdated')} - ${customer} (${totalAmount.toFixed(2)})`
          : `${t('sales.saleAdded')} - ${customer} (${totalAmount.toFixed(2)})`
      );

      // Close modal and refresh data
      setModalVisible(false);
      console.log('Refreshing data...');
      loadSalesData();
      console.log('Data refreshed');
    } catch (error) {
      console.error('Error saving sale:', error);
      // Show more detailed error message
      Alert.alert(t('common.error'), `${t('common.saveError')} ${error instanceof Error ? error.message : ''}`);
    } finally {
      setSaving(false); // Stop loading animation regardless of success or failure
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      calendar: 'gregory',
    });
  };

  // Show loading indicator while data is being fetched
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
        <Text style={styles.title}>{t('sales.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddSale}
        >
          <Ionicons name="add" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('sales.totalAmount')}</Text>
          <Text style={styles.summaryValue}>{getTotalSalesAmount().toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('sales.saleCount')}</Text>
          <Text style={styles.summaryValue}>{sales.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.salesList}>
        {sales.length > 0 ? (
          sales.map((sale) => (
            <View key={sale.id} style={styles.saleCard}>
              <View style={styles.saleHeader}>
                <Text style={styles.saleCustomer}>{sale.customer}</Text>
                <Text style={styles.saleAmount}>
                  {sale.totalAmount.toFixed(2)}
                </Text>
              </View>

              <Text style={styles.saleItemsCount}>
                {sale.items.length} {t('sales.items')}
              </Text>

              <View style={styles.saleDetails}>
                <Text style={styles.saleDate}>
                  {formatDate(sale.date)}
                </Text>
                <View style={styles.saleActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditSale(sale)}
                  >
                    <Ionicons name="pencil" size={16} color={COLORS.PRIMARY} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteSale(sale.id)}
                  >
                    <Ionicons name="trash" size={16} color={COLORS.DANGER} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t('sales.noSales')}</Text>
        )}
      </ScrollView>

      {/* Sale Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSale ? t('sales.editSale') : t('sales.addSale')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              {/* Date Picker */}
              <CustomDateTimePicker
                label={t('sales.date')}
                value={date}
                onChange={(selectedDate) => {
                  setDate(selectedDate);
                  setShowDatePicker(false);
                }}
                mode="date"
              />

              {/* Customer Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('sales.customer')}</Text>
                <TextInput
                  style={styles.input}
                  value={customer}
                  onChangeText={setCustomer}
                  placeholder={t('sales.customer')}
                />
              </View>

              {/* Fund Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('sales.paymentMethod')}</Text>
                <View style={styles.fundSelector}>
                  {funds.map((fund) => (
                    <TouchableOpacity
                      key={fund.id}
                      style={[
                        styles.fundOption,
                        selectedFundId === fund.id && styles.selectedFundOption,
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
                          styles.fundOptionText,
                          selectedFundId === fund.id && styles.selectedFundOptionText,
                        ]}
                      >
                        {fund.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Method Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('sales.paymentMethod')}</Text>
                <View style={styles.paymentMethodSelector}>
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodOption,
                      paymentMethod === 'cash' && styles.selectedPaymentMethodOption,
                    ]}
                    onPress={() => setPaymentMethod('cash')}
                  >
                    <Text
                      style={[
                        styles.paymentMethodOptionText,
                        paymentMethod === 'cash' && styles.selectedPaymentMethodOptionText,
                      ]}
                    >
                      {t('sales.cash')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodOption,
                      paymentMethod === 'bank' && styles.selectedPaymentMethodOption,
                    ]}
                    onPress={() => setPaymentMethod('bank')}
                  >
                    <Text
                      style={[
                        styles.paymentMethodOptionText,
                        paymentMethod === 'bank' && styles.selectedPaymentMethodOptionText,
                      ]}
                    >
                      {t('sales.bank')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Is Paid Switch */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('sales.isPaid')}</Text>
                <Switch
                  value={isPaid}
                  onValueChange={setIsPaid}
                  trackColor={{ false: COLORS.LIGHT, true: COLORS.PRIMARY }}
                  thumbColor={isPaid ? COLORS.SECONDARY : COLORS.WHITE}
                />
              </View>

              {/* Items Section */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>{t('sales.items')}</Text>

                {/* Add Item Form */}
                <View style={styles.addItemForm}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('sales.item')}</Text>
                    <View style={styles.itemSelector}>
                      {inventoryItems.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.itemOption,
                            selectedItemId === item.id && styles.selectedItemOption,
                          ]}
                          onPress={() => {
                            setSelectedItemId(item.id);
                            // Pre-fill with selling price if available
                            if (item.sellingPrice) {
                              setPricePerUnit(item.sellingPrice.toString());
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.itemOptionText,
                              selectedItemId === item.id && styles.selectedItemOptionText,
                            ]}
                          >
                            {item.name} ({item.quantity})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.itemDetails}>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>{t('sales.quantity')}</Text>
                      <TextInput
                        style={styles.input}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>{t('sales.pricePerUnit')}</Text>
                      <TextInput
                        style={styles.input}
                        value={pricePerUnit}
                        onChangeText={setPricePerUnit}
                        keyboardType="numeric"
                        placeholder="0.00"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={addItemToSale}
                  >
                    <Text style={styles.addItemButtonText}>{t('sales.addItem')}</Text>
                  </TouchableOpacity>
                </View>

                {/* Items List */}
                {saleItems.length > 0 ? (
                  <View style={styles.itemsList}>
                    {saleItems.map((item) => (
                      <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemCardHeader}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <TouchableOpacity
                            style={styles.removeItemButton}
                            onPress={() => removeItemFromSale(item.id)}
                          >
                            <Ionicons name="close-circle" size={20} color={COLORS.DANGER} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.itemCardDetails}>
                          <Text style={styles.itemDetail}>
                            {t('sales.quantity')}: {item.quantity}
                          </Text>
                          <Text style={styles.itemDetail}>
                            {t('sales.pricePerUnit')}: {item.pricePerUnit.toFixed(2)}
                          </Text>
                          <Text style={styles.itemDetail}>
                            {t('sales.totalPrice')}: {item.totalPrice.toFixed(2)}
                          </Text>
                          <Text style={styles.itemProfit}>
                            {t('sales.profit')}: {item.profit.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noItemsText}>{t('sales.noItems')}</Text>
                )}

                {/* Total Amount */}
                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>{t('sales.totalAmount')}</Text>
                  <Text style={styles.totalValue}>{calculateTotalAmount().toFixed(2)}</Text>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                disabled={saving}
                onPress={saveSale}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.WHITE} />
                ) : (
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    backgroundColor: COLORS.LIGHT,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.GRAY,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: COLORS.DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  salesList: {
    flex: 1,
  },
  saleCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleCustomer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  saleItemsCount: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 8,
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleDate: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  saleActions: {
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
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.GRAY,
    marginTop: 32,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    overflow: 'hidden',
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
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.LIGHT,
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    color: COLORS.DARK,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT,
    borderRadius: 4,
    padding: 10,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.DARK,
  },
  fundSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fundOption: {
    backgroundColor: COLORS.LIGHT,
    borderRadius: 4,
    padding: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFundOption: {
    backgroundColor: COLORS.PRIMARY,
  },
  fundOptionText: {
    color: COLORS.DARK,
  },
  selectedFundOptionText: {
    color: COLORS.WHITE,
  },
  paymentMethodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethodOption: {
    flex: 1,
    backgroundColor: COLORS.LIGHT,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedPaymentMethodOption: {
    backgroundColor: COLORS.PRIMARY,
  },
  paymentMethodOptionText: {
    color: COLORS.DARK,
    fontSize: 16,
  },
  selectedPaymentMethodOptionText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  itemsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 16,
  },
  addItemForm: {
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  itemSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemOption: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.LIGHT,
  },
  selectedItemOption: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  itemOptionText: {
    color: COLORS.DARK,
  },
  selectedItemOptionText: {
    color: COLORS.WHITE,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  addItemButton: {
    backgroundColor: COLORS.SECONDARY,
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addItemButtonText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  itemsList: {
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.LIGHT,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  removeItemButton: {
    padding: 4,
  },
  itemCardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemDetail: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 4,
    width: '48%',
  },
  itemProfit: {
    fontSize: 14,
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
    marginBottom: 4,
    width: '48%',
  },
  noItemsText: {
    textAlign: 'center',
    color: COLORS.GRAY,
    marginBottom: 16,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.PRIMARY + '80', // 50% opacity
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SalesScreen;
