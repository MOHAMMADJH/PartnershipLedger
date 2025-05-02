import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { getInventoryItems, addInventoryItem, updateInventoryItem } from '../services/firestore';
import { InventoryItem } from '../types';

const ItemManagementScreen = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const itemsData = await getInventoryItems();
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert(t('common.error'), t('common.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setPurchasePrice('');
    setSellingPrice('');
    setMinQuantity('');
    setCategory('');
    setModalVisible(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setPurchasePrice(item.purchasePrice.toString());
    setSellingPrice(item.sellingPrice.toString());
    setMinQuantity(item.minQuantity?.toString() || '');
    setCategory(item.category || '');
    setModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!name || !purchasePrice || !sellingPrice) {
      Alert.alert(t('common.error'), t('common.invalidInput'));
      return;
    }

    try {
      setLoading(true);

      const purchasePriceValue = parseFloat(purchasePrice);
      const sellingPriceValue = parseFloat(sellingPrice);
      const minQuantityValue = minQuantity ? parseInt(minQuantity) : undefined;

      if (editingItem) {
        // Update existing item
        await updateInventoryItem(editingItem.id, {
          name,
          description,
          purchasePrice: purchasePriceValue,
          sellingPrice: sellingPriceValue,
          minQuantity: minQuantityValue,
          category: category || undefined,
        });
      } else {
        // Add new item
        await addInventoryItem({
          name,
          description,
          quantity: 0,
          purchasePrice: purchasePriceValue,
          sellingPrice: sellingPriceValue,
          totalPurchaseCost: 0,
          totalSaleValue: 0,
          minQuantity: minQuantityValue,
          category: category || undefined,
        });
      }

      setModalVisible(false);
      fetchItems();

      Alert.alert(
        t('common.success'),
        editingItem
          ? t('inventory.itemUpdated')
          : t('inventory.itemAdded')
      );
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert(t('common.error'), t('common.saveError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && items.length === 0) {
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
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Ionicons name="add" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.itemsList}>
        {items.length > 0 ? (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => handleEditItem(item)}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>
              </View>

              {item.description ? (
                <Text style={styles.itemDescription}>{item.description}</Text>
              ) : null}

              <View style={styles.priceContainer}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>{t('inventory.purchasePrice')}</Text>
                  <Text style={styles.priceValue}>{item.purchasePrice.toFixed(2)}</Text>
                </View>

                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>{t('inventory.sellingPrice')}</Text>
                  <Text style={styles.priceValue}>{item.sellingPrice.toFixed(2)}</Text>
                </View>

                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>{t('inventory.profit')}</Text>
                  <Text
                    style={[
                      styles.priceValue,
                      { color: COLORS.SUCCESS }
                    ]}
                  >
                    {(item.sellingPrice - item.purchasePrice).toFixed(2)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>{t('inventory.noItems')}</Text>
        )}
      </ScrollView>

      {/* Add/Edit Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? t('inventory.editItem') : t('inventory.addItem')}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('inventory.name')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('inventory.name')}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('inventory.description')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('inventory.description')}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('inventory.purchasePrice')}</Text>
              <TextInput
                style={styles.input}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder={t('inventory.purchasePrice')}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('inventory.sellingPrice')}</Text>
              <TextInput
                style={styles.input}
                value={sellingPrice}
                onChangeText={setSellingPrice}
                placeholder={t('inventory.sellingPrice')}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('inventory.minQuantity')}</Text>
              <TextInput
                style={styles.input}
                value={minQuantity}
                onChangeText={setMinQuantity}
                placeholder={t('inventory.minQuantity')}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('inventory.category')}</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder={t('inventory.category')}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveItem}
              >
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
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
  itemsList: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
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
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    flex: 1,
  },
  quantityBadge: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  quantityText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 12,
  },
  itemDescription: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
});

export default ItemManagementScreen;
