import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/index';
import { Fund, Transaction, Partner } from '../../types';
import { checkSupabaseConnection } from '../../services/supabase/client';
import { getTransactionsByFund } from '../../services/supabase/transactions';
import { useFundsData } from './hooks/useFundsData';
import FundsList from './components/FundsList';
import FundDetails from './components/FundDetails';
import AddEditFundModal from './components/AddEditFundModal';
import AddTransactionModal from './components/AddTransactionModal';
import FilterBar from './components/FilterBar';

// Temporary placeholders for functions that need to be implemented in Supabase services
const getFunds = async (): Promise<Fund[]> => [];
const getPartners = async (): Promise<Partner[]> => [];
const addFund = async (fund: Omit<Fund, 'id'>): Promise<Fund> => ({ id: `temp_${Date.now()}`, name: fund.name, balance: fund.balance, type: fund.type || 'general', createdAt: new Date(), updatedAt: new Date() });
const updateFund = async (fundId: string, data: Partial<Fund>): Promise<void> => {};
const deleteFund = async (fundId: string): Promise<void> => {};
const getPartner = async (partnerId: string): Promise<Partner> => ({ id: partnerId, name: '', capitalBalance: 0, profitBalance: 0, createdAt: new Date(), updatedAt: new Date() });

const FundsScreen = () => {
  const { t } = useTranslation();
  const {
    loading,
    funds,
    partners,
    selectedFund,
    transactions,
    filteredTransactions,
    modalVisible,
    addTransactionModalVisible,
    paymentMethodFilter,
    showPersonalFunds,
    editingFund,
    fundName,
    fundBalance,
    fundNameError,
    fundBalanceError,
    fundType,
    fundOwnerId,
    saving,
    setLoading,
    setFunds,
    setPartners,
    setSelectedFund,
    setTransactions,
    setFilteredTransactions,
    setModalVisible,
    setAddTransactionModalVisible,
    setPaymentMethodFilter,
    setShowPersonalFunds,
    setEditingFund,
    setFundName,
    setFundBalance,
    setFundNameError,
    setFundBalanceError,
    setFundType,
    setFundOwnerId,
    setSaving,
    loadFundsData,
    handleSelectFund,
    handleFilterTransactions,
    handleAddFund,
    handleEditFund,
    handleDeleteFund,
    handleSaveFund,
    handleAddTransaction,
    validateFundForm
  } = useFundsData({ t, getFunds, getPartners, getTransactionsByFund, addFund, updateFund, deleteFund, getPartner });

  const isConnected = checkSupabaseConnection();

  // Load funds data on component mount
  useEffect(() => {
    loadFundsData();
  }, []);

  if (loading && !selectedFund) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        {!isConnected && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>{t('common.offlineMode')}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <FilterBar
        paymentMethodFilter={paymentMethodFilter}
        setPaymentMethodFilter={setPaymentMethodFilter}
        showPersonalFunds={showPersonalFunds}
        setShowPersonalFunds={setShowPersonalFunds}
        t={t}
      />

      {/* Funds List and Details */}
      <View style={styles.content}>
        <FundsList
          funds={funds}
          selectedFund={selectedFund}
          handleSelectFund={handleSelectFund}
          handleAddFund={() => {
            setEditingFund(null);
            setFundName('');
            setFundBalance('0');
            setFundType('general');
            setFundOwnerId('');
            setFundNameError('');
            setFundBalanceError('');
            setModalVisible(true);
          }}
          handleEditFund={handleEditFund}
          handleDeleteFund={handleDeleteFund}
          t={t}
        />

        {selectedFund && (
          <FundDetails
            selectedFund={selectedFund}
            filteredTransactions={filteredTransactions}
            handleAddTransaction={() => setAddTransactionModalVisible(true)}
            loading={loading}
            t={t}
          />
        )}
      </View>

      {/* Add/Edit Fund Modal */}
      <AddEditFundModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        editingFund={editingFund}
        fundName={fundName}
        setFundName={setFundName}
        fundBalance={fundBalance}
        setFundBalance={setFundBalance}
        fundNameError={fundNameError}
        fundBalanceError={fundBalanceError}
        fundType={fundType}
        setFundType={setFundType}
        fundOwnerId={fundOwnerId}
        setFundOwnerId={setFundOwnerId}
        partners={partners}
        handleSaveFund={handleSaveFund}
        saving={saving}
        t={t}
      />

      <AddTransactionModal
        visible={addTransactionModalVisible}
        onClose={() => setAddTransactionModalVisible(false)}
        selectedFund={selectedFund}
        onAddTransaction={handleAddTransaction}
        partners={partners}
        funds={funds}
        t={t}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT,
  },
  offlineBanner: {
    backgroundColor: COLORS.WARNING,
    padding: 10,
    alignItems: 'center',
  },
  offlineText: {
    color: COLORS.WHITE,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  noFundSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    margin: 10,
    borderRadius: 10,
  },
  noFundText: {
    fontSize: 18,
    color: COLORS.GRAY,
    fontStyle: 'italic',
  },
});

export default FundsScreen;
