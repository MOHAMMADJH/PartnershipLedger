import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Fund, Transaction, Partner } from '../../../types';
import { checkSupabaseConnection } from '../../../services/supabase/client';
import { getFunds as getFundsFromSupabase, addFund as addFundToSupabase, updateFund as updateFundInSupabase, deleteFund as deleteFundFromSupabase } from '../../../services/supabase/funds';
import { getPartners as getPartnersFromSupabase } from '../../../services/supabase/partners';
import { getTransactions as getTransactionsFromSupabase, addTransaction as addTransactionToSupabase } from '../../../services/supabase/transactions';
import { useTranslation } from 'react-i18next';

export const useFundsData = () => {
  const { t } = useTranslation();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(true);
  
  // Data state
  t,
  getFunds,
  getPartners,
  getTransactionsByFund,
  addFund,
  updateFund,
  deleteFund,
  getPartner
}: UseFundsDataProps) => {
  // State for funds list
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'cash' | 'bank'>('all');
  const [showPersonalFunds, setShowPersonalFunds] = useState(true);

  // Fund form state
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [fundName, setFundName] = useState('');
  const [fundBalance, setFundBalance] = useState('0');
  const [fundNameError, setFundNameError] = useState('');
  const [fundBalanceError, setFundBalanceError] = useState('');
  const [fundType, setFundType] = useState<'general' | 'personal'>('general');
  const [fundOwnerId, setFundOwnerId] = useState('');

  // Load funds data
  const loadFundsData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data...');

      // Check Supabase connection first
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        Alert.alert(
          t('common.error'),
          'Could not connect to Supabase. Please check your internet connection and try again.'
        );
        return;
      }

      console.log('Supabase connection verified, fetching data...');

      // Fetch funds
      console.log('Fetching funds...');
      const fundsData = await getFunds();
      setFunds(fundsData);

      // Fetch partners
      console.log('Fetching partners...');
      const partnersData = await getPartners();
      setPartners(partnersData);

      // Select first fund by default if none selected
      if (fundsData.length > 0 && !selectedFund) {
        handleSelectFund(fundsData[0]);
      } else if (selectedFund) {
        // Refresh selected fund data
        const refreshedFund = fundsData.find(f => f.id === selectedFund.id);
        if (refreshedFund) {
          setSelectedFund(refreshedFund);
          loadTransactions(refreshedFund.id);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading funds data:', error);
      Alert.alert(t('common.error'), t('funds.loadError'));
      setLoading(false);
    }
  };

  // Load transactions for a fund
  const loadTransactions = async (fundId: string) => {
    try {
      setLoading(true);
      console.log(`Loading transactions for fund ${fundId}...`);
      const transactionsData = await getTransactionsByFund(fundId);
      setTransactions(transactionsData);
      handleFilterTransactions(transactionsData, paymentMethodFilter);
      setLoading(false);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setLoading(false);
    }
  };

  // Handle selecting a fund
  const handleSelectFund = (fund: Fund) => {
    setSelectedFund(fund);
    loadTransactions(fund.id);
  };

  // Filter transactions by payment method
  const handleFilterTransactions = (transactionsToFilter: Transaction[], filter: 'all' | 'cash' | 'bank') => {
    if (filter === 'all') {
      setFilteredTransactions(transactionsToFilter);
    } else {
      setFilteredTransactions(transactionsToFilter.filter(t => t.paymentMethod === filter));
    }
  };

  // Handle adding a new fund
  const handleAddFund = () => {
    setEditingFund(null);
    setFundName('');
    setFundBalance('0');
    setFundType('general');
    setFundOwnerId('');
    setFundNameError('');
    setFundBalanceError('');
    setModalVisible(true);
  };

  // Handle editing a fund
  const handleEditFund = (fund: Fund) => {
    setEditingFund(fund);
    setFundName(fund.name);
    setFundBalance(fund.balance.toString());
    setFundType(fund.ownerId ? 'personal' : 'general');
    setFundOwnerId(fund.ownerId || '');
    setFundNameError('');
    setFundBalanceError('');
    setModalVisible(true);
  };

  // Handle deleting a fund
  const handleDeleteFund = async (fund: Fund) => {
    Alert.alert(
      t('common.confirm'),
      t('funds.deleteConfirm', { name: fund.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteFund(fund.id);
              
              // Remove from state
              const updatedFunds = funds.filter(f => f.id !== fund.id);
              setFunds(updatedFunds);
              
              // If deleted fund was selected, select another one
              if (selectedFund && selectedFund.id === fund.id) {
                if (updatedFunds.length > 0) {
                  handleSelectFund(updatedFunds[0]);
                } else {
                  setSelectedFund(null);
                  setTransactions([]);
                  setFilteredTransactions([]);
                }
              }
              
              setLoading(false);
              Alert.alert(t('common.success'), t('funds.deleteSuccess'));
            } catch (error) {
              console.error('Error deleting fund:', error);
              setLoading(false);
              Alert.alert(t('common.error'), t('funds.deleteError'));
            }
          }
        }
      ]
    );
  };

  // Validate fund form
  const validateFundForm = (): boolean => {
    let isValid = true;
    
    // Validate name
    if (!fundName.trim()) {
      setFundNameError(t('funds.nameRequired'));
      isValid = false;
    } else {
      setFundNameError('');
    }
    
    // Validate balance
    const balanceValue = parseFloat(fundBalance);
    if (isNaN(balanceValue)) {
      setFundBalanceError(t('funds.invalidBalance'));
      isValid = false;
    } else {
      setFundBalanceError('');
    }
    
    // Validate owner for personal funds
    if (fundType === 'personal' && !fundOwnerId) {
      Alert.alert(t('common.error'), t('funds.ownerRequired'));
      isValid = false;
    }
    
    return isValid;
  };

  // Handle saving a fund
  const handleSaveFund = async () => {
    if (!validateFundForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      const fundData = {
        name: fundName,
        balance: parseFloat(fundBalance),
        ownerId: fundType === 'personal' ? fundOwnerId : undefined,
        transactions: []
      };
      
      if (editingFund) {
        // Update existing fund
        await updateFund(editingFund.id, fundData);
        
        // Update in state
        const updatedFunds = funds.map(f => 
          f.id === editingFund.id ? { ...f, ...fundData } : f
        );
        setFunds(updatedFunds);
        
        // Update selected fund if it was edited
        if (selectedFund && selectedFund.id === editingFund.id) {
          setSelectedFund({ ...selectedFund, ...fundData });
        }
        
        Alert.alert(t('common.success'), t('funds.updateSuccess'));
      } else {
        // Add new fund
        const newFund = await addFund(fundData);
        
        // Add to state
        const updatedFunds = [...funds, newFund];
        setFunds(updatedFunds);
        
        // Select the new fund
        handleSelectFund(newFund);
        
        Alert.alert(t('common.success'), t('funds.addSuccess'));
      }
      
      setModalVisible(false);
      setSaving(false);
    } catch (error) {
      console.error('Error saving fund:', error);
      setSaving(false);
      Alert.alert(t('common.error'), t('funds.saveError'));
    }
  };

  // Handle adding a transaction
  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    // This would be implemented in the AddTransactionModal component
  };

  return {
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
  };
};
