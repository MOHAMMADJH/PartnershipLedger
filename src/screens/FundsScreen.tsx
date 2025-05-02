import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import CustomDateTimePicker from '../components/CustomDateTimePicker';
import { COLORS } from '../constants';
import { getPartners, getFunds, getTransactionsByFund, addFund, updateFund, deleteFund, addTransaction, getPartner } from '../services/firestore';
import { Fund, Transaction, Partner } from '../types';
import { checkFirebaseConnection } from '../services/firebase';

const FundsScreen = () => {
  const { t } = useTranslation();
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

  // Transaction form state
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal' | 'transfer'>('deposit');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sourceFund, setSourceFund] = useState<Fund | null>(null);
  const [destinationFund, setDestinationFund] = useState<Fund | null>(null);
  const [transactionPaymentMethod, setTransactionPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [transactionAmountError, setTransactionAmountError] = useState('');

  // Fetch funds data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch funds, partners, and transactions data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Check Firebase connection first
      console.log('Checking Firebase connection...');
      const isConnected = await checkFirebaseConnection();
      if (!isConnected) {
        Alert.alert(
          t('common.error'),
          'Could not connect to Firebase. Please check your internet connection and try again.'
        );
        setLoading(false);
        return;
      }
      console.log('Firebase connection verified');

      // Fetch both funds and partners data in parallel
      console.log('Fetching funds and partners data...');
      const [fundsData, partnersData] = await Promise.all([
        getFunds(),
        getPartners()
      ]);

      console.log(`Fetched ${fundsData.length} funds`);
      console.log(`Fetched ${partnersData.length} partners`);

      setFunds(fundsData);
      setPartners(partnersData);

      // If funds exist, select the first one and fetch its transactions
      if (fundsData.length > 0) {
        // If there's already a selected fund, keep it selected
        const fundToSelect = selectedFund
          ? fundsData.find(f => f.id === selectedFund.id) || fundsData[0]
          : fundsData[0];

        console.log(`Setting selected fund to ${fundToSelect.name} (${fundToSelect.id})`);
        setSelectedFund(fundToSelect);

        console.log(`Fetching transactions for fund ${fundToSelect.id}...`);
        const fundTransactions = await getTransactionsByFund(fundToSelect.id);
        console.log(`Fetched ${fundTransactions.length} transactions`);
        setTransactions(fundTransactions);
        filterTransactions(fundTransactions, paymentMethodFilter);
      } else {
        // No funds available
        setSelectedFund(null);
        setTransactions([]);
        setFilteredTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert(t('common.error'), `${t('common.fetchError')} ${error instanceof Error ? error.message : ''}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle fund selection
  const handleSelectFund = async (fund: Fund) => {
    setSelectedFund(fund);
    try {
      console.log(`Fetching transactions for fund ${fund.id}...`);
      const fundTransactions = await getTransactionsByFund(fund.id);
      console.log(`Fetched ${fundTransactions.length} transactions:`, fundTransactions);
      setTransactions(fundTransactions);
      filterTransactions(fundTransactions, paymentMethodFilter);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert(t('common.error'), `${t('common.fetchError')} ${error instanceof Error ? error.message : ''}`);
    }
  };

  // Open add fund modal
  const handleAddFund = () => {
    // Reset form state
    setEditingFund(null);
    setFundName('');
    setFundBalance('0');
    setFundNameError('');
    setModalVisible(true);
  };

  // Open edit fund modal
  const handleEditFund = (fund: Fund) => {
    setEditingFund(fund);
    setFundName(fund.name);
    setFundBalance(fund.balance.toString());
    setFundNameError('');
    setModalVisible(true);
  };

  // Handle fund deletion
  const handleDeleteFund = async (fund: Fund) => {
    // Check if fund has transactions
    if (fund.transactions && fund.transactions.length > 0) {
      Alert.alert(
        t('common.error'),
        t('funds.cannotDeleteFundWithTransactions'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    // Confirm deletion
    Alert.alert(
      t('funds.deleteFund'),
      t('funds.deleteFundConfirmation', { name: fund.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteFund(fund.id);

              // Update funds list
              setFunds(funds.filter(f => f.id !== fund.id));

              // If the deleted fund was selected, select another fund
              if (selectedFund?.id === fund.id) {
                const remainingFunds = funds.filter(f => f.id !== fund.id);
                if (remainingFunds.length > 0) {
                  setSelectedFund(remainingFunds[0]);
                  const fundTransactions = await getTransactionsByFund(remainingFunds[0].id);
                  setTransactions(fundTransactions);
                } else {
                  setSelectedFund(null);
                  setTransactions([]);
                }
              }

              Alert.alert(t('common.success'), t('funds.fundDeleted'));
            } catch (error) {
              console.error('Error deleting fund:', error);
              Alert.alert(t('common.error'), `${t('funds.deleteFundError')} ${error instanceof Error ? error.message : ''}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Save fund (add or update)
  const handleSaveFund = async () => {
    // Validate form
    let isValid = true;

    if (!fundName.trim()) {
      setFundNameError(t('funds.nameRequired'));
      isValid = false;
    } else {
      setFundNameError('');
    }

    if (!isValid) return;

    try {
      setSaving(true);

      // Parse balance as number
      const balance = parseFloat(fundBalance) || 0;

      if (editingFund) {
        // Update existing fund
        await updateFund(editingFund.id, { name: fundName, balance });

        // Update funds list
        setFunds(funds.map(f =>
          f.id === editingFund.id
            ? { ...f, name: fundName, balance }
            : f
        ));

        // Update selected fund if it's the one being edited
        if (selectedFund?.id === editingFund.id) {
          setSelectedFund({ ...selectedFund, name: fundName, balance });
        }

        Alert.alert(t('common.success'), t('funds.fundUpdated'));
      } else {
        // Add new fund
        const newFund = await addFund({
          name: fundName,
          balance,
          transactions: []
        });

        // Update funds list
        setFunds([...funds, newFund]);

        // If no fund is selected, select the new one
        if (!selectedFund) {
          setSelectedFund(newFund);
          setTransactions([]);
        }

        Alert.alert(t('common.success'), t('funds.fundAdded'));
      }

      // Close modal
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving fund:', error);
      Alert.alert(t('common.error'), `${t('funds.saveFundError')} ${error instanceof Error ? error.message : ''}`);
    } finally {
      setSaving(false);
    }
  };

  // Filter transactions by payment method
  const filterTransactions = (transactionsToFilter: Transaction[], filter: 'all' | 'cash' | 'bank') => {
    // First, ensure all transactions have a payment method
    const transactionsWithPaymentMethod = transactionsToFilter.map(t => {
      // If transaction doesn't have a payment method, assign a default based on fund name
      if (!t.paymentMethod) {
        console.log(`Transaction ${t.id} has no payment method, assigning default`);
        // Try to determine payment method from fund name if available
        if (selectedFund) {
          const isCashFund = selectedFund.name.toLowerCase().includes('cash');
          const isBankFund = selectedFund.name.toLowerCase().includes('bank');

          if (isCashFund) {
            return { ...t, paymentMethod: 'cash' as const };
          } else if (isBankFund) {
            return { ...t, paymentMethod: 'bank' as const };
          } else {
            // For personal funds or other funds, check transaction type and amount
            // If it's a deposit or withdrawal, check if it matches cash or bank capital
            if (selectedFund.partnerId && t.partnerId === selectedFund.partnerId) {
              // Find the partner
              const partner = partners.find(p => p.id === selectedFund.partnerId);
              if (partner) {
                // If transaction amount matches cash capital, it's likely a cash transaction
                if (Math.abs(t.amount - partner.cashCapital) < 0.01) {
                  return { ...t, paymentMethod: 'cash' as const };
                }
                // If transaction amount matches bank capital, it's likely a bank transaction
                else if (Math.abs(t.amount - partner.bankCapital) < 0.01) {
                  return { ...t, paymentMethod: 'bank' as const };
                }
              }
            }

            // Default to cash for other cases
            return { ...t, paymentMethod: 'cash' as const };
          }
        } else {
          // Default to cash if no fund is selected
          return { ...t, paymentMethod: 'cash' as const };
        }
      }
      return t;
    });

    // Then apply the filter
    if (filter === 'all') {
      setFilteredTransactions(transactionsWithPaymentMethod);
    } else {
      setFilteredTransactions(transactionsWithPaymentMethod.filter(t => t.paymentMethod === filter));
    }

    // Log the filtered transactions for debugging
    console.log(`Filtered transactions (${filter}):`,
      transactionsWithPaymentMethod
        .filter(t => filter === 'all' || t.paymentMethod === filter)
        .map(t => ({ id: t.id, amount: t.amount, type: t.type, paymentMethod: t.paymentMethod }))
    );
  };

  // Get partner name for a fund
  const getPartnerForFund = (fund: Fund): Partner | undefined => {
    if (!fund.partnerId) return undefined;
    return partners.find(p => p.id === fund.partnerId);
  };

  // Check if a fund is a personal fund
  const isPersonalFund = (fund: Fund): boolean => {
    return !!fund.partnerId;
  };

  // Calculate balance for a specific payment method
  const calculatePaymentMethodBalance = (transactionsToCalculate: Transaction[], fundId: string, paymentMethod: 'cash' | 'bank'): number => {
    // Ensure all transactions have a payment method
    const transactionsWithPaymentMethod = transactionsToCalculate.map(t => {
      if (!t.paymentMethod) {
        // If transaction doesn't have a payment method, assign a default based on fund name
        const isCashFund = selectedFund?.name.toLowerCase().includes('cash');
        const isBankFund = selectedFund?.name.toLowerCase().includes('bank');

        if (isCashFund) {
          return { ...t, paymentMethod: 'cash' as const };
        } else if (isBankFund) {
          return { ...t, paymentMethod: 'bank' as const };
        } else {
          // Default to cash for other funds
          return { ...t, paymentMethod: 'cash' as const };
        }
      }
      return t;
    });

    // Filter transactions by payment method and fund ID
    const relevantTransactions = transactionsWithPaymentMethod.filter(t => {
      // First, check if the transaction has the correct payment method
      if (t.paymentMethod !== paymentMethod) {
        return false;
      }

      // Then, check if the transaction is related to this fund
      const isLegacyFund = t.fundId === fundId;
      const isSourceFund = t.sourceFundId === fundId;
      const isDestinationFund = t.destinationFundId === fundId;

      return isLegacyFund || isSourceFund || isDestinationFund;
    });

    // Calculate the balance
    return relevantTransactions.reduce((sum, t) => {
      // For deposits, add to the balance
      if (t.type === 'deposit' && (t.destinationFundId === fundId || t.fundId === fundId)) {
        return sum + t.amount;
      }
      // For withdrawals, subtract from the balance
      else if (t.type === 'withdrawal' && (t.sourceFundId === fundId || t.fundId === fundId)) {
        return sum - t.amount;
      }
      // For transfers, handle based on source/destination
      else if (t.type === 'transfer') {
        if (t.sourceFundId === fundId) {
          return sum - t.amount; // Money leaving this fund
        } else if (t.destinationFundId === fundId) {
          return sum + t.amount; // Money coming into this fund
        }
      }
      return sum;
    }, 0);
  };

  // Handle payment method filter change
  const handlePaymentMethodFilterChange = (filter: 'all' | 'cash' | 'bank') => {
    setPaymentMethodFilter(filter);
    filterTransactions(transactions, filter);
  };

  // Open add transaction modal
  const handleAddTransaction = () => {
    // Reset form state
    setTransactionType('deposit');
    setTransactionAmount('');
    setTransactionDescription('');
    setTransactionDate(new Date());
    setTransactionAmountError('');
    setTransactionPaymentMethod('cash');

    // Set default funds based on transaction type
    if (selectedFund) {
      setDestinationFund(selectedFund);
      setSourceFund(null);
    }

    setAddTransactionModalVisible(true);
  };

  // Handle transaction type change
  const handleTransactionTypeChange = (type: 'deposit' | 'withdrawal' | 'transfer') => {
    setTransactionType(type);

    // Set appropriate funds based on type
    if (type === 'deposit') {
      setDestinationFund(selectedFund);
      setSourceFund(null);
    } else if (type === 'withdrawal') {
      setSourceFund(selectedFund);
      setDestinationFund(null);
    } else if (type === 'transfer') {
      setSourceFund(selectedFund);
      // Set destination to first fund that's not the source
      const otherFund = funds.find(f => f.id !== selectedFund?.id);
      setDestinationFund(otherFund || null);
    }
  };

  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTransactionDate(selectedDate);
    }
  };

  // Save transaction
  const handleSaveTransaction = async () => {
    // Validate form
    let isValid = true;

    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      setTransactionAmountError(t('funds.amountRequired'));
      isValid = false;
    } else {
      setTransactionAmountError('');
    }

    // Validate funds based on transaction type
    if (transactionType === 'deposit' && !destinationFund) {
      Alert.alert(t('common.error'), t('funds.selectDestinationFund'));
      isValid = false;
    } else if (transactionType === 'withdrawal' && !sourceFund) {
      Alert.alert(t('common.error'), t('funds.selectSourceFund'));
      isValid = false;
    } else if (transactionType === 'transfer') {
      if (!sourceFund || !destinationFund) {
        Alert.alert(t('common.error'), t('funds.missingFundsForTransfer'));
        isValid = false;
      } else if (sourceFund.id === destinationFund.id) {
        Alert.alert(t('common.error'), t('funds.sourceSameAsDestination'));
        isValid = false;
      }
    }

    if (!isValid) return;

    try {
      setSaving(true);

      // Parse amount as number
      const amount = parseFloat(transactionAmount);

      // Create transaction object based on type
      let transactionData: Omit<Transaction, 'id'> = {
        date: transactionDate,
        amount,
        type: transactionType,
        description: transactionDescription || '',
        paymentMethod: transactionPaymentMethod,
      };

      // Add fund IDs based on transaction type
      if (transactionType === 'deposit' && destinationFund) {
        transactionData.destinationFundId = destinationFund.id;
      } else if (transactionType === 'withdrawal' && sourceFund) {
        transactionData.sourceFundId = sourceFund.id;
      } else if (transactionType === 'transfer' && sourceFund && destinationFund) {
        transactionData.sourceFundId = sourceFund.id;
        transactionData.destinationFundId = destinationFund.id;
      }

      console.log('Adding transaction:', transactionData);

      // Check Firebase connection first
      console.log('Checking Firebase connection...');
      const isConnected = await checkFirebaseConnection();
      if (!isConnected) {
        Alert.alert(
          t('common.error'),
          'Could not connect to Firebase. Please check your internet connection and try again.'
        );
        return;
      }
      console.log('Firebase connection verified');

      // Add transaction to Firestore
      const newTransaction = await addTransaction(transactionData);
      console.log('Transaction added with ID:', newTransaction.id, 'Data:', JSON.stringify(newTransaction));

      // Update fund balances
      if (transactionType === 'deposit' && destinationFund) {
        // Increase destination fund balance
        const newBalance = destinationFund.balance + amount;
        await updateFund(destinationFund.id, { balance: newBalance });

        // Update funds list
        setFunds(funds.map(f =>
          f.id === destinationFund.id
            ? { ...f, balance: newBalance }
            : f
        ));

        // Update selected fund if it's the one being modified
        if (selectedFund?.id === destinationFund.id) {
          setSelectedFund({ ...selectedFund, balance: newBalance });
        }
      } else if (transactionType === 'withdrawal' && sourceFund) {
        // Decrease source fund balance
        const newBalance = sourceFund.balance - amount;
        await updateFund(sourceFund.id, { balance: newBalance });

        // Update funds list
        setFunds(funds.map(f =>
          f.id === sourceFund.id
            ? { ...f, balance: newBalance }
            : f
        ));

        // Update selected fund if it's the one being modified
        if (selectedFund?.id === sourceFund.id) {
          setSelectedFund({ ...selectedFund, balance: newBalance });
        }
      } else if (transactionType === 'transfer' && sourceFund && destinationFund) {
        // Decrease source fund balance
        const newSourceBalance = sourceFund.balance - amount;
        await updateFund(sourceFund.id, { balance: newSourceBalance });

        // Increase destination fund balance
        const newDestBalance = destinationFund.balance + amount;
        await updateFund(destinationFund.id, { balance: newDestBalance });

        // Update funds list
        setFunds(funds.map(f => {
          if (f.id === sourceFund.id) {
            return { ...f, balance: newSourceBalance };
          } else if (f.id === destinationFund.id) {
            return { ...f, balance: newDestBalance };
          }
          return f;
        }));

        // Update selected fund if it's one of the ones being modified
        if (selectedFund?.id === sourceFund.id) {
          setSelectedFund({ ...selectedFund, balance: newSourceBalance });
        } else if (selectedFund?.id === destinationFund.id) {
          setSelectedFund({ ...selectedFund, balance: newDestBalance });
        }
      }

      // Refresh transactions for the selected fund
      if (selectedFund) {
        console.log(`Refreshing transactions for fund ${selectedFund.id}...`);
        const fundTransactions = await getTransactionsByFund(selectedFund.id);
        console.log(`Fetched ${fundTransactions.length} transactions after adding new one`);

        // Add the new transaction to the list if it's not already there
        if (!fundTransactions.some(t => t.id === newTransaction.id)) {
          console.log(`New transaction ${newTransaction.id} not found in fetched transactions, adding manually`);
          // Create a proper Transaction object with the correct date
          const transactionWithDate = {
            ...newTransaction,
            date: transactionDate // Use the date from the form
          };
          // Add to the beginning of the list (newest first)
          setTransactions([transactionWithDate, ...transactions]);
        } else {
          console.log(`New transaction ${newTransaction.id} found in fetched transactions`);
          setTransactions(fundTransactions);
        }
      }

      // Show success message
      Alert.alert(t('common.success'), t('funds.transactionAdded'));

      // Close modal
      setAddTransactionModalVisible(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert(t('common.error'), `${t('funds.saveTransactionError')} ${error instanceof Error ? error.message : ''}`);
    } finally {
      setSaving(false);
    }
  };

  // Loading indicator
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
        <Text style={styles.title}>{t('funds.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddFund}
        >
          <Ionicons name="add" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Fund Type Toggle */}
      <View style={styles.fundTypeToggle}>
        <TouchableOpacity
          style={[styles.fundTypeButton, !showPersonalFunds && styles.activeFundTypeButton]}
          onPress={() => setShowPersonalFunds(false)}
        >
          <Text style={[styles.fundTypeButtonText, !showPersonalFunds && styles.activeFundTypeButtonText]}>
            {t('funds.mainFunds')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fundTypeButton, showPersonalFunds && styles.activeFundTypeButton]}
          onPress={() => setShowPersonalFunds(true)}
        >
          <Text style={[styles.fundTypeButtonText, showPersonalFunds && styles.activeFundTypeButtonText]}>
            {t('funds.personalFunds')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fund List Section - Compact View */}
      <View style={styles.fundSelectorCompact}>
        {funds
          .filter(fund => showPersonalFunds ? !!fund.partnerId : !fund.partnerId)
          .map(fund => {
            const partner = fund.partnerId ? partners.find(p => p.id === fund.partnerId) : null;
            return (
              <TouchableOpacity
                key={fund.id}
                style={[
                  styles.fundButtonCompact,
                  selectedFund?.id === fund.id && styles.selectedFundButtonCompact,
                  fund.partnerId && styles.personalFundButton
                ]}
                onPress={() => handleSelectFund(fund)}
              >
                <View style={styles.fundButtonContent}>
                  <View style={styles.fundNameContainer}>
                    {fund.partnerId && (
                      <Ionicons name="person" size={14} color={COLORS.PRIMARY} style={styles.fundIcon} />
                    )}
                    <Text
                      style={[
                        styles.fundButtonTextCompact,
                        selectedFund?.id === fund.id && styles.selectedFundButtonTextCompact
                      ]}
                      numberOfLines={1}
                    >
                      {fund.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.fundBalanceTextCompact,
                      selectedFund?.id === fund.id && styles.selectedFundButtonTextCompact
                    ]}
                  >
                    {fund.balance.toFixed(2)}
                  </Text>
                </View>
                {partner && (
                  <Text style={styles.partnerNameText} numberOfLines={1}>
                    {partner.name}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
      </View>

      {/* Fund Details Section */}
      {selectedFund && (
        <View style={styles.fundDetails}>
          <View style={styles.fundDetailCard}>
            <View style={styles.fundDetailHeader}>
              <View style={styles.fundTitleContainer}>
                <Text style={styles.fundDetailTitle}>{selectedFund.name}</Text>
                <View style={styles.fundActions}>
                  <TouchableOpacity
                    style={styles.fundActionButton}
                    onPress={() => handleEditFund(selectedFund)}
                  >
                    <Ionicons name="create-outline" size={20} color={COLORS.PRIMARY} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fundActionButton}
                    onPress={() => handleDeleteFund(selectedFund)}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.DANGER} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fund Balance Summary */}
              <View style={styles.fundBalanceContainer}>
                <Text style={styles.fundBalanceLabel}>{t('funds.balance')}:</Text>
                <Text style={styles.fundDetailBalance}>{selectedFund.balance.toFixed(2)}</Text>
              </View>

              {/* Cash and Bank Balances */}
              <View style={styles.paymentMethodBalances}>
                <View style={styles.paymentMethodBalanceItem}>
                  <Text style={styles.paymentMethodBalanceLabel}>{t('funds.cashBalance')}:</Text>
                  <Text style={styles.paymentMethodBalanceValue}>
                    {calculatePaymentMethodBalance(transactions, selectedFund.id, 'cash').toFixed(2)}
                  </Text>
                </View>
                <View style={styles.paymentMethodBalanceItem}>
                  <Text style={styles.paymentMethodBalanceLabel}>{t('funds.bankBalance')}:</Text>
                  <Text style={styles.paymentMethodBalanceValue}>
                    {calculatePaymentMethodBalance(transactions, selectedFund.id, 'bank').toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>{t('funds.transactions')}</Text>
            <View style={styles.transactionsActions}>
              {/* Payment Method Filter */}
              <View style={styles.paymentMethodFilter}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodFilterOption,
                    paymentMethodFilter === 'all' && styles.selectedPaymentMethodFilterOption
                  ]}
                  onPress={() => handlePaymentMethodFilterChange('all')}
                >
                  <Text
                    style={[
                      styles.paymentMethodFilterText,
                      paymentMethodFilter === 'all' && styles.selectedPaymentMethodFilterText
                    ]}
                  >
                    {t('funds.all')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodFilterOption,
                    paymentMethodFilter === 'cash' && styles.selectedPaymentMethodFilterOption
                  ]}
                  onPress={() => handlePaymentMethodFilterChange('cash')}
                >
                  <Text
                    style={[
                      styles.paymentMethodFilterText,
                      paymentMethodFilter === 'cash' && styles.selectedPaymentMethodFilterText
                    ]}
                  >
                    {t('funds.cash')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodFilterOption,
                    paymentMethodFilter === 'bank' && styles.selectedPaymentMethodFilterOption
                  ]}
                  onPress={() => handlePaymentMethodFilterChange('bank')}
                >
                  <Text
                    style={[
                      styles.paymentMethodFilterText,
                      paymentMethodFilter === 'bank' && styles.selectedPaymentMethodFilterText
                    ]}
                  >
                    {t('funds.bank')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.addTransactionButton}
                onPress={handleAddTransaction}
              >
                <Ionicons name="add-circle-outline" size={24} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Transactions List */}
          <View style={styles.transactionsCard}>
            <ScrollView style={styles.transactionsList}>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(transaction => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionDate}>
                        {transaction.date.toLocaleDateString()}
                      </Text>
                      <Text style={styles.transactionDescription}>
                        {transaction.description || t(`funds.${transaction.type}`)}
                      </Text>
                      {/* Payment Method Indicator */}
                      <View style={styles.paymentMethodIndicator}>
                        <Text style={[
                          styles.paymentMethodIndicatorText,
                          transaction.paymentMethod === 'cash' ? styles.cashIndicator : styles.bankIndicator
                        ]}>
                          {transaction.paymentMethod === 'cash' ? t('funds.cash') : t('funds.bank')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionAmountContainer}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          transaction.type === 'deposit' ? styles.depositAmount :
                          transaction.type === 'withdrawal' ? styles.withdrawalAmount :
                          styles.transferAmount
                        ]}
                      >
                        {transaction.type === 'deposit' ? '+' :
                         transaction.type === 'withdrawal' ? '-' : ''}
                        {transaction.amount.toFixed(2)}
                      </Text>
                      <View style={styles.transactionTypeIndicator}>
                        <Ionicons
                          name={
                            transaction.type === 'deposit' ? 'arrow-down' :
                            transaction.type === 'withdrawal' ? 'arrow-up' :
                            'swap-horizontal'
                          }
                          size={14}
                          color={
                            transaction.type === 'deposit' ? COLORS.SUCCESS :
                            transaction.type === 'withdrawal' ? COLORS.DANGER :
                            COLORS.WARNING
                          }
                        />
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noTransactionsContainer}>
                  <Ionicons name="document-text-outline" size={32} color={COLORS.GRAY} />
                  <Text style={styles.noTransactions}>{t('funds.noTransactions')}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Add/Edit Fund Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('funds.name')}</Text>
              <TextInput
                style={[styles.input, fundNameError ? styles.inputError : null]}
                value={fundName}
                onChangeText={setFundName}
                placeholder={t('funds.name')}
              />
              {fundNameError ? <Text style={styles.errorText}>{fundNameError}</Text> : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('funds.balance')}</Text>
              <TextInput
                style={styles.input}
                value={fundBalance}
                onChangeText={setFundBalance}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
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

      {/* Add Transaction Modal */}
      <Modal
        visible={addTransactionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddTransactionModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('funds.addTransaction')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAddTransactionModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.DARK} />
              </TouchableOpacity>
            </View>

            {/* Transaction Type Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('common.type')}</Text>
              <View style={styles.transactionTypeSelector}>
                <TouchableOpacity
                  style={[
                    styles.transactionTypeOption,
                    transactionType === 'deposit' && styles.selectedTransactionType
                  ]}
                  onPress={() => handleTransactionTypeChange('deposit')}
                >
                  <Text
                    style={[
                      styles.transactionTypeText,
                      transactionType === 'deposit' && styles.selectedTransactionTypeText
                    ]}
                  >
                    {t('funds.deposit')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.transactionTypeOption,
                    transactionType === 'withdrawal' && styles.selectedTransactionType
                  ]}
                  onPress={() => handleTransactionTypeChange('withdrawal')}
                >
                  <Text
                    style={[
                      styles.transactionTypeText,
                      transactionType === 'withdrawal' && styles.selectedTransactionTypeText
                    ]}
                  >
                    {t('funds.withdrawal')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.transactionTypeOption,
                    transactionType === 'transfer' && styles.selectedTransactionType
                  ]}
                  onPress={() => handleTransactionTypeChange('transfer')}
                >
                  <Text
                    style={[
                      styles.transactionTypeText,
                      transactionType === 'transfer' && styles.selectedTransactionTypeText
                    ]}
                  >
                    {t('funds.transfer')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('funds.amount')}</Text>
              <TextInput
                style={[styles.input, transactionAmountError ? styles.inputError : null]}
                value={transactionAmount}
                onChangeText={setTransactionAmount}
                placeholder="0.00"
                keyboardType="numeric"
              />
              {transactionAmountError ? <Text style={styles.errorText}>{transactionAmountError}</Text> : null}
            </View>

            {/* Date Picker */}
            <CustomDateTimePicker
              label={t('funds.date')}
              value={transactionDate}
              onChange={(selectedDate) => {
                setTransactionDate(selectedDate);
                setShowDatePicker(false);
              }}
              mode="date"
            />

            {/* Description Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('funds.description')}</Text>
              <TextInput
                style={styles.input}
                value={transactionDescription}
                onChangeText={setTransactionDescription}
                placeholder={t('funds.description')}
                multiline
              />
            </View>

            {/* Payment Method Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { fontWeight: 'bold' }]}>{t('funds.paymentMethod')}</Text>
              <View style={styles.paymentMethodSelector}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodOption,
                    transactionPaymentMethod === 'cash' && styles.selectedPaymentMethodOption
                  ]}
                  onPress={() => setTransactionPaymentMethod('cash')}
                >
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={transactionPaymentMethod === 'cash' ? COLORS.WHITE : COLORS.DARK}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                      styles.paymentMethodOptionText,
                      transactionPaymentMethod === 'cash' && styles.selectedPaymentMethodOptionText
                    ]}
                  >
                    {t('funds.cash')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodOption,
                    transactionPaymentMethod === 'bank' && styles.selectedPaymentMethodOption
                  ]}
                  onPress={() => setTransactionPaymentMethod('bank')}
                >
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={transactionPaymentMethod === 'bank' ? COLORS.WHITE : COLORS.DARK}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                      styles.paymentMethodOptionText,
                      transactionPaymentMethod === 'bank' && styles.selectedPaymentMethodOptionText
                    ]}
                  >
                    {t('funds.bank')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fund Selectors based on transaction type */}
            {transactionType !== 'transfer' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {transactionType === 'deposit'
                    ? t('funds.destinationFund')
                    : t('funds.sourceFund')}
                </Text>
                <View style={styles.fundSelector}>
                  {funds.map(fund => (
                    <TouchableOpacity
                      key={fund.id}
                      style={[
                        styles.fundOption,
                        (transactionType === 'deposit'
                          ? destinationFund?.id === fund.id
                          : sourceFund?.id === fund.id) && styles.selectedFundOption
                      ]}
                      onPress={() => {
                        if (transactionType === 'deposit') {
                          setDestinationFund(fund);
                        } else {
                          setSourceFund(fund);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.fundOptionText,
                          (transactionType === 'deposit'
                            ? destinationFund?.id === fund.id
                            : sourceFund?.id === fund.id) && styles.selectedFundOptionText
                        ]}
                      >
                        {fund.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* For transfers, show both source and destination fund selectors */}
            {transactionType === 'transfer' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('funds.sourceFund')}</Text>
                  <View style={styles.fundSelector}>
                    {funds.map(fund => (
                      <TouchableOpacity
                        key={fund.id}
                        style={[
                          styles.fundOption,
                          sourceFund?.id === fund.id && styles.selectedFundOption
                        ]}
                        onPress={() => setSourceFund(fund)}
                      >
                        <Text
                          style={[
                            styles.fundOptionText,
                            sourceFund?.id === fund.id && styles.selectedFundOptionText
                          ]}
                        >
                          {fund.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('funds.destinationFund')}</Text>
                  <View style={styles.fundSelector}>
                    {funds.map(fund => (
                      <TouchableOpacity
                        key={fund.id}
                        style={[
                          styles.fundOption,
                          destinationFund?.id === fund.id && styles.selectedFundOption
                        ]}
                        onPress={() => setDestinationFund(fund)}
                      >
                        <Text
                          style={[
                            styles.fundOptionText,
                            destinationFund?.id === fund.id && styles.selectedFundOptionText
                          ]}
                        >
                          {fund.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddTransactionModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSaveTransaction}
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
    backgroundColor: COLORS.LIGHT,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.DARK,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
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
  // Old styles (kept for compatibility)
  fundSelector: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
  },
  fundButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: COLORS.LIGHT,
    minWidth: 120,
    alignItems: 'center',
  },
  selectedFundButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  fundButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  fundBalanceText: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginTop: 4,
  },
  selectedFundButtonText: {
    color: COLORS.WHITE,
  },

  // New compact styles
  fundTypeToggle: {
    flexDirection: 'row',
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: COLORS.LIGHT,
    overflow: 'hidden',
  },
  fundTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  activeFundTypeButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  fundTypeButtonText: {
    fontSize: 14,
    color: COLORS.DARK,
  },
  activeFundTypeButtonText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  fundSelectorCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
  },
  fundButtonCompact: {
    flexDirection: 'row',
    borderRadius: 4,
    margin: 4,
    backgroundColor: COLORS.LIGHT,
    flex: 1,
    minWidth: '45%', // Allow 2 items per row on most screens
    maxWidth: '48%',
  },
  selectedFundButtonCompact: {
    backgroundColor: COLORS.PRIMARY,
  },
  personalFundButton: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  fundButtonContent: {
    flex: 1,
    padding: 10,
  },
  fundNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fundIcon: {
    marginRight: 4,
  },
  partnerNameText: {
    fontSize: 10,
    color: COLORS.PRIMARY,
    marginTop: 4,
    fontStyle: 'italic',
    paddingHorizontal: 10,
    paddingBottom: 4,
  },
  fundButtonTextCompact: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  fundBalanceTextCompact: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginTop: 2,
    textAlign: 'right',
  },
  selectedFundButtonTextCompact: {
    color: COLORS.WHITE,
  },
  fundDetails: {
    flex: 1,
    padding: 8,
    backgroundColor: COLORS.LIGHT,
  },
  fundDetailCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  fundDetailHeader: {
    padding: 12,
  },
  fundTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fundActions: {
    flexDirection: 'row',
  },
  fundActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  fundDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  fundBalanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT,
  },
  fundBalanceLabel: {
    fontSize: 16,
    color: COLORS.GRAY,
  },
  fundDetailBalance: {
    fontSize: 18,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  addTransactionButton: {
    padding: 4,
  },
  transactionsCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  transactionDescription: {
    fontSize: 14,
    color: COLORS.DARK,
    marginTop: 2,
  },
  transactionAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  transactionTypeIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  depositAmount: {
    color: COLORS.SUCCESS,
  },
  withdrawalAmount: {
    color: COLORS.DANGER,
  },
  transferAmount: {
    color: COLORS.WARNING,
  },
  noTransactionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noTransactions: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: COLORS.GRAY,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    margin: 20,
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: COLORS.DARK,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.LIGHT,
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: COLORS.WHITE,
  },
  inputError: {
    borderColor: COLORS.DANGER,
  },
  errorText: {
    color: COLORS.DANGER,
    fontSize: 14,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    color: COLORS.GRAY,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 10,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  // Transaction type selector styles
  transactionTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionTypeOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: COLORS.LIGHT,
    alignItems: 'center',
  },
  selectedTransactionType: {
    backgroundColor: COLORS.PRIMARY,
  },
  transactionTypeText: {
    color: COLORS.DARK,
    fontWeight: 'bold',
  },
  selectedTransactionTypeText: {
    color: COLORS.WHITE,
  },
  // Date picker styles
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
  // Fund option styles
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
  // Payment method selector styles
  paymentMethodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paymentMethodOption: {
    flex: 1,
    backgroundColor: COLORS.LIGHT,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.LIGHT,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedPaymentMethodOption: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  paymentMethodOptionText: {
    color: COLORS.DARK,
    fontSize: 16,
    fontWeight: '500',
  },
  selectedPaymentMethodOptionText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  // Payment method filter styles
  paymentMethodFilter: {
    flexDirection: 'row',
    marginRight: 10,
  },
  paymentMethodFilterOption: {
    backgroundColor: COLORS.LIGHT,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  selectedPaymentMethodFilterOption: {
    backgroundColor: COLORS.PRIMARY,
  },
  paymentMethodFilterText: {
    fontSize: 12,
    color: COLORS.DARK,
  },
  selectedPaymentMethodFilterText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  transactionsActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Payment method balance styles
  paymentMethodBalances: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT,
  },
  paymentMethodBalanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  paymentMethodBalanceLabel: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  paymentMethodBalanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  // Payment method indicator styles
  paymentMethodIndicator: {
    marginTop: 4,
  },
  paymentMethodIndicatorText: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cashIndicator: {
    backgroundColor: COLORS.LIGHT_SUCCESS,
    color: COLORS.SUCCESS,
  },
  bankIndicator: {
    backgroundColor: COLORS.LIGHT_INFO,
    color: COLORS.INFO,
  },
});

export default FundsScreen;
