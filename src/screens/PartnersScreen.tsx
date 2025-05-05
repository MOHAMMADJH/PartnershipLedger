import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Switch, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/index';
import { getPartners, addPartner, updatePartner, deletePartner, getFunds, addTransaction, addFund, updateFund, deleteFund } from '../services/supabase';
import { Partner, Fund } from '../types';

const PartnersScreen = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [name, setName] = useState('');
  const [profitShare, setProfitShare] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [partnersData, fundsData] = await Promise.all([
        getPartners(),
        getFunds()
      ]);
      setPartners(partnersData);
      setFunds(fundsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPartner = () => {
    setEditingPartner(null);
    setName('');
    setProfitShare('');
    setModalVisible(true);
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setName(partner.name);
    setProfitShare(partner.profitShare.toString());
    setModalVisible(true);
  };

  const handleDeletePartner = async (partnerId: string) => {
    try {
      // Find the partner to get their personal fund ID
      const partner = partners.find(p => p.id === partnerId);
      if (!partner) {
        console.error('Partner not found');
        return;
      }

      // Confirm deletion
      Alert.alert(
        t('partners.deletePartner'),
        t('partners.deletePartnerConfirmation', { name: partner.name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                setSaving(true);

                // Delete the partner's personal fund if it exists
                if (partner.personalFundId) {
                  console.log(`Deleting personal fund ${partner.personalFundId} for partner ${partner.name}`);
                  const personalFund = funds.find(f => f.id === partner.personalFundId);
                  if (personalFund) {
                    await deleteFund(partner.personalFundId);
                    console.log(`Personal fund deleted successfully`);
                  }
                }

                // Delete the partner
                await deletePartner(partnerId);
                console.log(`Partner ${partner.name} deleted successfully`);

                // Show success message
                Alert.alert(t('common.success'), t('partners.partnerDeleted'));

                // Refresh data
                fetchData();
              } catch (error) {
                console.error('Error deleting partner:', error);
                Alert.alert(t('common.error'), t('common.deleteError'));
              } finally {
                setSaving(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error preparing to delete partner:', error);
      Alert.alert(t('common.error'), t('common.deleteError'));
    }
  };

  // Function to create a personal fund for a partner
  const createPersonalFund = async (partnerId: string, partnerName: string, initialAmount: number = 0): Promise<Fund> => {
    console.log(`Creating personal fund for partner ${partnerName} (${partnerId})`);
    try {
      // Create a new fund with the partner's name
      const fundName = `${partnerName} ${t('partners.personalFund')}`;
      const newFund = await addFund({
        name: fundName,
        balance: initialAmount,
        transactions: [],
        partnerId: partnerId // Associate this fund with the partner
      });

      console.log(`Created personal fund with ID ${newFund.id} for partner ${partnerName}`);
      return newFund;
    } catch (error) {
      console.error(`Error creating personal fund for partner ${partnerName}:`, error);
      throw error;
    }
  };

  // Function to create automatic deposit transaction
  const createDepositTransaction = async (partnerId: string, fundId: string, amount: number, paymentMethod?: 'cash' | 'bank') => {
    if (amount <= 0 || !fundId) return;

    try {
      const fund = funds.find(f => f.id === fundId);
      if (!fund) {
        console.error('Fund not found');
        return;
      }

      // Determine payment method
      // 1. Use the provided payment method if specified
      // 2. Otherwise, determine based on fund name (for backward compatibility)
      // 3. Default to 'cash' if neither is available
      let methodToUse: 'cash' | 'bank';

      if (paymentMethod) {
        methodToUse = paymentMethod;
      } else if (fund.name.toLowerCase().includes('cash')) {
        methodToUse = 'cash';
      } else if (fund.name.toLowerCase().includes('bank')) {
        methodToUse = 'bank';
      } else {
        // For personal funds, default to cash unless specified
        methodToUse = 'cash';
      }

      console.log(`Creating deposit transaction with payment method: ${methodToUse}`);

      // Create a more descriptive transaction description
      const description = methodToUse === 'cash'
        ? t('partners.initialCashCapitalDeposit')
        : t('partners.initialBankCapitalDeposit');

      // Create transaction data
      const transactionData = {
        date: new Date(),
        amount: amount,
        type: 'deposit' as const,
        description: description,
        partnerId: partnerId,
        destinationFundId: fundId,
        paymentMethod: methodToUse
      };

      // Add transaction
      const newTransaction = await addTransaction(transactionData);
      console.log(`Created transaction with ID: ${newTransaction.id}`);

      // Update fund balance
      const newBalance = fund.balance + amount;
      await updateFund(fundId, { balance: newBalance });

      // Update local funds array to reflect the new balance
      setFunds(prevFunds =>
        prevFunds.map(f =>
          f.id === fundId ? { ...f, balance: newBalance } : f
        )
      );

      console.log(`Created automatic deposit of ${amount} to fund ${fund.name} using ${methodToUse} payment method`);

      // Return the transaction for reference
      return newTransaction;
    } catch (error) {
      console.error('Error creating deposit transaction:', error);
      throw error;
    }
  };

  const handleSavePartner = async () => {
    try {
      setSaving(true); // Start showing loading animation

      const partnerData = {
        name,
        profitShare: parseFloat(profitShare) || 0,
      };

      let partnerId: string;

      if (editingPartner) {
        partnerId = editingPartner.id;
        await updatePartner(partnerId, partnerData);
        // Show success message
        Alert.alert(t('common.success'), `${t('partners.partnerUpdated')} ${name}`);
      } else {
        try {
          // Add new partner first
          const newPartner = await addPartner(partnerData);
          partnerId = newPartner.id;

          // Then create a personal fund for the partner with zero initial balance
          const personalFund = await createPersonalFund(
            partnerId, // Use the actual partner ID
            name,
            0 // Set initial balance to zero
          );

          // Update the partner with the personal fund ID
          await updatePartner(partnerId, {
            ...partnerData,
            personalFundId: personalFund.id
          });

          // Show success message
          Alert.alert(
            t('common.success'),
            `${t('partners.partnerAdded')} ${name} ${t('partners.withPersonalFund')}`
          );
        } catch (fundError) {
          console.error('Error creating personal fund:', fundError);

          // If personal fund creation fails, still try to create the partner
          const newPartner = await addPartner(partnerData);
          partnerId = newPartner.id;

          Alert.alert(
            t('common.warning'),
            `${t('partners.partnerAdded')} ${name}, ${t('partners.personalFundError')}`
          );
        }
      }

      // Close modal first
      setModalVisible(false);

      // Add a small delay before refreshing data to ensure all Firestore operations complete
      setTimeout(() => {
        console.log('Refreshing data after partner creation...');
        fetchData();
      }, 1000);
    } catch (error) {
      console.error('Error saving partner:', error);
      Alert.alert(t('common.error'), `${t('common.saveError')}`);
    } finally {
      setSaving(false); // Stop loading animation
    }
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
        <Text style={styles.title}>{t('partners.title')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPartner}>
          <Ionicons name="add" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.partnersList}>
        {partners.length > 0 ? (
          partners.map((partner) => (
            <View key={partner.id} style={styles.partnerCard}>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerName}>{partner.name}</Text>
                <View style={styles.partnerDetails}>
                  {/* Personal Fund Info */}
                  {partner.personalFundId && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>
                        <Ionicons name="wallet-outline" size={14} color={COLORS.PRIMARY} /> {t('partners.personalFund')}
                      </Text>
                      <TouchableOpacity
                        style={styles.viewFundButton}
                        onPress={() => {
                          // Navigate to Funds screen with this fund pre-selected
                          const fundId = partner.personalFundId;
                          if (fundId) {
                            Alert.alert(
                              t('partners.personalFund'),
                              `${t('partners.viewFundDetails')} ${partner.name}`,
                              [
                                { text: t('common.cancel'), style: 'cancel' },
                                {
                                  text: t('partners.viewFund'),
                                  onPress: () => {
                                    Alert.alert(
                                      t('common.success'),
                                      `${t('partners.navigatingToFund')} ${partner.name}`
                                    );
                                  }
                                }
                              ]
                            );
                          }
                        }}
                      >
                        <Text style={styles.viewFundButtonText}>{t('partners.viewFund')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('partners.profitShare')}</Text>
                    <Text style={styles.detailValue}>{partner.profitShare}%</Text>
                  </View>
                </View>
              </View>
              <View style={styles.partnerActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditPartner(partner)}
                >
                  <Ionicons name="pencil" size={18} color={COLORS.PRIMARY} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeletePartner(partner.id)}
                >
                  <Ionicons name="trash" size={18} color={COLORS.DANGER} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No partners found. Add a partner to get started.</Text>
        )}
      </ScrollView>

      {/* Add/Edit Partner Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingPartner ? t('partners.editPartner') : t('partners.addPartner')}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('partners.name')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('partners.name')}
              />
            </View>



            {/* Personal Fund Info */}
            <View style={styles.personalFundInfoContainer}>
              <Text style={styles.sectionTitle}>{t('partners.personalFundInfo')}</Text>
              <View style={styles.personalFundInfoContent}>
                <Ionicons name="wallet-outline" size={20} color={COLORS.PRIMARY} style={styles.personalFundIcon} />
                <Text style={styles.personalFundInfoText}>
                  {t('partners.personalFundCreationInfo')}
                </Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('partners.profitShare')}</Text>
              <TextInput
                style={styles.input}
                value={profitShare}
                onChangeText={setProfitShare}
                placeholder={t('partners.profitShare')}
                keyboardType="numeric"
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
                style={[styles.modalButton, styles.saveButton, saving && styles.saveButtonDisabled]}
                disabled={saving}
                onPress={handleSavePartner}
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
  capitalBreakdown: {
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.LIGHT,
  },
  detailSubLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cashValue: {
    color: COLORS.SUCCESS,
    fontSize: 13,
  },
  bankValue: {
    color: COLORS.INFO,
    fontSize: 13,
  },
  personalFundContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT,
  },
  viewFundButton: {
    backgroundColor: COLORS.PRIMARY + '20', // 20% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewFundButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: 'bold',
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
  partnersList: {
    flex: 1,
    padding: 16,
  },
  partnerCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 8,
  },
  partnerDetails: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  partnerActions: {
    justifyContent: 'space-around',
    paddingLeft: 16,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 16,
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
  // New styles for capital breakdown
  capitalBreakdownContainer: {
    marginBottom: 16,
    backgroundColor: COLORS.WHITE,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.LIGHT,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 12,
  },
  capitalInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
    marginBottom: 0,
  },
  cashInput: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.SUCCESS,
  },
  bankInput: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.INFO,
  },
  autoDepositContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.DARK,
  },
  fundSelectionContainer: {
    marginTop: 16,
  },
  fundOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  fundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFundOption: {
    backgroundColor: COLORS.PRIMARY,
  },
  fundOptionText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.DARK,
  },
  selectedFundOptionText: {
    color: COLORS.WHITE,
  },
  totalCapitalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT,
  },
  totalCapitalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginRight: 8,
  },
  totalCapitalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  personalFundInfoContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.LIGHT,
  },
  personalFundInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  personalFundIcon: {
    marginRight: 8,
  },
  personalFundInfoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.DARK,
    lineHeight: 20,
  },
});

export default PartnersScreen;
