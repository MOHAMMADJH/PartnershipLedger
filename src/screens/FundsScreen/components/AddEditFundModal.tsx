import React from 'react';
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
import { Fund, Partner } from '../../../types';
import { COLORS } from '../../../constants';

interface AddEditFundModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  editingFund: Fund | null;
  fundName: string;
  setFundName: (name: string) => void;
  fundBalance: string;
  setFundBalance: (balance: string) => void;
  fundNameError: string;
  fundBalanceError: string;
  fundType: 'general' | 'personal';
  setFundType: (type: 'general' | 'personal') => void;
  fundOwnerId: string;
  setFundOwnerId: (id: string) => void;
  partners: Partner[];
  handleSaveFund: () => void;
  saving: boolean;
  t: (key: string, options?: any) => string;
}

const AddEditFundModal: React.FC<AddEditFundModalProps> = ({
  modalVisible,
  setModalVisible,
  editingFund,
  fundName,
  setFundName,
  fundBalance,
  setFundBalance,
  fundNameError,
  fundBalanceError,
  fundType,
  setFundType,
  fundOwnerId,
  setFundOwnerId,
  partners,
  handleSaveFund,
  saving,
  t
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingFund ? t('funds.editFund') : t('funds.addFund')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.DARK} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Fund Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('funds.name')}</Text>
              <TextInput
                style={[styles.input, fundNameError ? styles.inputError : null]}
                value={fundName}
                onChangeText={setFundName}
                placeholder={t('funds.namePlaceholder')}
                placeholderTextColor={COLORS.GRAY}
              />
              {fundNameError ? (
                <Text style={styles.errorText}>{fundNameError}</Text>
              ) : null}
            </View>

            {/* Fund Balance */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('funds.initialBalance')}</Text>
              <TextInput
                style={[styles.input, fundBalanceError ? styles.inputError : null]}
                value={fundBalance}
                onChangeText={setFundBalance}
                placeholder="0.00"
                placeholderTextColor={COLORS.GRAY}
                keyboardType="numeric"
              />
              {fundBalanceError ? (
                <Text style={styles.errorText}>{fundBalanceError}</Text>
              ) : null}
            </View>

            {/* Fund Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('funds.type')}</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    fundType === 'general' && styles.radioButtonSelected
                  ]}
                  onPress={() => setFundType('general')}
                >
                  <View style={styles.radioButtonInner}>
                    {fundType === 'general' && <View style={styles.radioButtonDot} />}
                  </View>
                  <Text style={styles.radioButtonText}>{t('funds.general')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    fundType === 'personal' && styles.radioButtonSelected
                  ]}
                  onPress={() => setFundType('personal')}
                >
                  <View style={styles.radioButtonInner}>
                    {fundType === 'personal' && <View style={styles.radioButtonDot} />}
                  </View>
                  <Text style={styles.radioButtonText}>{t('funds.personal')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fund Owner (only for personal funds) */}
            {fundType === 'personal' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('funds.owner')}</Text>
                <View style={styles.selectContainer}>
                  {partners.length === 0 ? (
                    <Text style={styles.noPartnersText}>{t('funds.noPartners')}</Text>
                  ) : (
                    partners.map((partner) => (
                      <TouchableOpacity
                        key={partner.id}
                        style={[
                          styles.partnerOption,
                          fundOwnerId === partner.id && styles.partnerOptionSelected
                        ]}
                        onPress={() => setFundOwnerId(partner.id)}
                      >
                        <Text
                          style={[
                            styles.partnerOptionText,
                            fundOwnerId === partner.id && styles.partnerOptionTextSelected
                          ]}
                        >
                          {partner.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveFund}
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
  radioGroup: {
    flexDirection: 'row',
    marginTop: 5,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 8,
  },
  radioButtonSelected: {
    // No additional styling needed for the container
  },
  radioButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioButtonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY,
  },
  radioButtonText: {
    fontSize: 16,
    color: COLORS.DARK,
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

export default AddEditFundModal;
