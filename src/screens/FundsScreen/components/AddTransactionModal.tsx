import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fund, Partner, Transaction } from '../../../types';
import { COLORS } from '../../../constants';
import CustomDateTimePicker from '../../../components/CustomDateTimePicker';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFund: Fund | null;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  partners: Partner[];
  funds: Fund[];
  t: (key: string, options?: any) => string;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  selectedFund,
  onAddTransaction,
  partners,
  funds,
  t
}) => {
  // Transaction form state
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal' | 'transfer'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [partnerId, setPartnerId] = useState('');
  const [destinationFundId, setDestinationFundId] = useState('');
  const [amountError, setAmountError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset form when modal is opened
  React.useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setTransactionType('deposit');
    setAmount('');
    setDescription('');
    setDate(new Date());
    setPaymentMethod('cash');
    setPartnerId('');
    setDestinationFundId('');
    setAmountError('');
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate amount
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setAmountError(t('transactions.invalidAmount'));
      isValid = false;
    } else {
      setAmountError('');
    }

    // Validate destination fund for transfers
    if (transactionType === 'transfer' && !destinationFundId) {
      Alert.alert(t('common.error'), t('transactions.destinationRequired'));
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm() || !selectedFund) return;

    try {
      setSaving(true);

      const transactionData: Omit<Transaction, 'id'> = {
        type: transactionType,
        amount: parseFloat(amount),
        description,
        date,
        paymentMethod,
        sourceFundId: transactionType === 'withdrawal' || transactionType === 'transfer' ? selectedFund.id : undefined,
        destinationFundId: transactionType === 'deposit' ? selectedFund.id : 
                          transactionType === 'transfer' ? destinationFundId : undefined,
        partnerId: partnerId || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await onAddTransaction(transactionData);
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert(t('common.error'), t('transactions.addError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('transactions.add')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.DARK} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Transaction Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('transactions.type')}</Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    transactionType === 'deposit' && styles.segmentButtonSelected,
                    { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
                  ]}
                  onPress={() => setTransactionType('deposit')}
                >
                  <Ionicons
                    name="arrow-down"
                    size={16}
                    color={transactionType === 'deposit' ? COLORS.WHITE : COLORS.DARK}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      transactionType === 'deposit' && styles.segmentButtonTextSelected
                    ]}
                  >
                    {t('transactions.types.deposit')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    transactionType === 'withdrawal' && styles.segmentButtonSelected
                  ]}
                  onPress={() => setTransactionType('withdrawal')}
                >
                  <Ionicons
                    name="arrow-up"
                    size={16}
                    color={transactionType === 'withdrawal' ? COLORS.WHITE : COLORS.DARK}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      transactionType === 'withdrawal' && styles.segmentButtonTextSelected
                    ]}
                  >
                    {t('transactions.types.withdrawal')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    transactionType === 'transfer' && styles.segmentButtonSelected,
                    { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
                  ]}
                  onPress={() => setTransactionType('transfer')}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={16}
                    color={transactionType === 'transfer' ? COLORS.WHITE : COLORS.DARK}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      transactionType === 'transfer' && styles.segmentButtonTextSelected
                    ]}
                  >
                    {t('transactions.types.transfer')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('transactions.amount')}</Text>
              <TextInput
                style={[styles.input, amountError ? styles.inputError : null]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={COLORS.GRAY}
                keyboardType="numeric"
              />
              {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('transactions.description')}</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder={t('transactions.descriptionPlaceholder')}
                placeholderTextColor={COLORS.GRAY}
              />
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('transactions.date')}</Text>
              <CustomDateTimePicker
                value={date}
                onChange={(selectedDate: Date) => {
                  setDate(selectedDate);
                }}
                mode="date"
              />
            </View>

            {/* Payment Method */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('common.paymentMethod')}</Text>
              <View style={styles.paymentMethodContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'cash' && styles.paymentMethodButtonSelected
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={paymentMethod === 'cash' ? COLORS.WHITE : COLORS.DARK}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === 'cash' && styles.paymentMethodTextSelected
                    ]}
                  >
                    {t('common.paymentMethods.cash')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'bank' && styles.paymentMethodButtonSelected
                  ]}
                  onPress={() => setPaymentMethod('bank')}
                >
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={paymentMethod === 'bank' ? COLORS.WHITE : COLORS.DARK}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === 'bank' && styles.paymentMethodTextSelected
                    ]}
                  >
                    {t('common.paymentMethods.bank')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Partner (for deposits and withdrawals) */}
            {(transactionType === 'deposit' || transactionType === 'withdrawal') && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('transactions.partner')}</Text>
                <View style={styles.selectContainer}>
                  <TouchableOpacity
                    style={[
                      styles.partnerOption,
                      !partnerId && styles.partnerOptionSelected
                    ]}
                    onPress={() => setPartnerId('')}
                  >
                    <Text
                      style={[
                        styles.partnerOptionText,
                        !partnerId && styles.partnerOptionTextSelected
                      ]}
                    >
                      {t('transactions.noPartner')}
                    </Text>
                  </TouchableOpacity>
                  {partners.map((partner) => (
                    <TouchableOpacity
                      key={partner.id}
                      style={[
                        styles.partnerOption,
                        partnerId === partner.id && styles.partnerOptionSelected
                      ]}
                      onPress={() => setPartnerId(partner.id)}
                    >
                      <Text
                        style={[
                          styles.partnerOptionText,
                          partnerId === partner.id && styles.partnerOptionTextSelected
                        ]}
                      >
                        {partner.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Destination Fund (for transfers) */}
            {transactionType === 'transfer' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('transactions.destinationFund')}</Text>
                <View style={styles.selectContainer}>
                  {funds
                    .filter((fund) => fund.id !== selectedFund?.id)
                    .map((fund) => (
                      <TouchableOpacity
                        key={fund.id}
                        style={[
                          styles.partnerOption,
                          destinationFundId === fund.id && styles.partnerOptionSelected
                        ]}
                        onPress={() => setDestinationFundId(fund.id)}
                      >
                        <Text
                          style={[
                            styles.partnerOptionText,
                            destinationFundId === fund.id && styles.partnerOptionTextSelected
                          ]}
                        >
                          {fund.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.WHITE} />
              ) : (
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    maxWidth: 500,
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  closeButton: {
    padding: 5,
  },
  formContainer: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: COLORS.DARK,
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.DARK,
    borderWidth: 1,
    borderColor: COLORS.GRAY,
  },
  inputError: {
    borderColor: COLORS.DANGER,
  },
  errorText: {
    color: COLORS.DANGER,
    fontSize: 14,
    marginTop: 5,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.GRAY,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.LIGHT,
  },
  segmentButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  segmentButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: COLORS.DARK,
  },
  segmentButtonTextSelected: {
    color: COLORS.WHITE,
  },
  datePickerButton: {
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: COLORS.DARK,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: COLORS.GRAY,
  },
  paymentMethodButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  paymentMethodText: {
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.DARK,
  },
  paymentMethodTextSelected: {
    color: COLORS.WHITE,
  },
  selectContainer: {
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.GRAY,
    maxHeight: 150,
  },
  partnerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY,
  },
  partnerOptionSelected: {
    backgroundColor: COLORS.LIGHT_SUCCESS,
  },
  partnerOptionText: {
    fontSize: 16,
    color: COLORS.DARK,
  },
  partnerOptionTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  noPartnersText: {
    padding: 12,
    color: COLORS.GRAY,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: COLORS.LIGHT,
  },
  cancelButtonText: {
    color: COLORS.DARK,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY,
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
});

// Import Alert
import { Alert } from 'react-native';

export default AddTransactionModal;
