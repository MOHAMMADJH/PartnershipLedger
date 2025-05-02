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
  Alert,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Easing,
  FlatList
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import CustomDateTimePicker from '../components/CustomDateTimePicker';
import { COLORS } from '../constants';
import {
  getPartners,
  getFunds,
  addTransaction,
  updatePartner,
  updateFund,
  getTransactionsByFund,
  getTransactions
} from '../services/firestore';
import { checkFirebaseConnection } from '../services/firebase';
import { Partner, Fund, Transaction } from '../types';

const CapitalTransactionScreen = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [successAnimation] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [sourceFund, setSourceFund] = useState<Fund | null>(null);
  const [destinationFund, setDestinationFund] = useState<Fund | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal' | 'transfer'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal' | 'transfer'>('all');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [showFilterStartDatePicker, setShowFilterStartDatePicker] = useState(false);
  const [showFilterEndDatePicker, setShowFilterEndDatePicker] = useState(false);

  // Filter state
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  // Update transactions when filters change
  useEffect(() => {
    if (allTransactions.length > 0) {
      const filteredTransactions = filterTransactionsByTypeAndDate(allTransactions);
      setTransactions(filteredTransactions);
    }
  }, [filterType, filterStartDate, filterEndDate, filterMonth, filterYear]);

  // Animation for success message
  useEffect(() => {
    if (showSuccess) {
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }).start();

      // Hide success message after 2 seconds
      const timer = setTimeout(() => {
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }).start(() => {
          setShowSuccess(false);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showSuccess, successAnimation]);

  const fetchData = async () => {
    console.log('Fetching data...');
    try {
      setLoading(true);

      // Get partners data
      console.log('Fetching partners...');
      const partnersData = await getPartners();
      console.log(`Fetched ${partnersData.length} partners`);
      setPartners(partnersData);

      // Get funds data
      console.log('Fetching funds...');
      const fundsData = await getFunds();
      console.log(`Fetched ${fundsData.length} funds`);
      setFunds(fundsData);

      // Get all transactions
      console.log('Fetching all transactions...');
      const allTransactionsData = await getTransactions();
      console.log(`Fetched ${allTransactionsData.length} total transactions`);
      setAllTransactions(allTransactionsData);

      // Apply filters to transactions
      const filteredTransactions = filterTransactionsByTypeAndDate(allTransactionsData);
      setTransactions(filteredTransactions);

      // Get transactions for the first fund
      if (fundsData.length > 0) {
        console.log(`Setting selected fund to ${fundsData[0].name} (${fundsData[0].id})`);
        setSelectedFund(fundsData[0]);
      } else {
        console.log('No funds available');
      }

      // Set selected partner to the first one
      if (partnersData.length > 0) {
        console.log(`Setting selected partner to ${partnersData[0].name}`);
        setSelectedPartner(partnersData[0]);
      } else {
        console.log('No partners available');
      }

      console.log('Data fetching completed successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert(t('common.error'), t('common.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions by type and date
  const filterTransactionsByTypeAndDate = (transactions: Transaction[]) => {
    let filteredTransactions = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filteredTransactions = filteredTransactions.filter(
        transaction => transaction.type === filterType
      );
    }

    // Filter by date range
    if (filterStartDate) {
      filteredTransactions = filteredTransactions.filter(
        transaction => transaction.date >= filterStartDate
      );
    }

    if (filterEndDate) {
      // Add one day to include the end date fully
      const endDate = new Date(filterEndDate);
      endDate.setDate(endDate.getDate() + 1);

      filteredTransactions = filteredTransactions.filter(
        transaction => transaction.date < endDate
      );
    }

    // Filter by month and year if no specific date range is set
    if (!filterStartDate && !filterEndDate) {
      filteredTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = transaction.date;
        return (
          transactionDate.getMonth() === filterMonth &&
          transactionDate.getFullYear() === filterYear
        );
      });
    }

    return filteredTransactions;
  };

  const handleAddTransaction = async () => {
    console.log('handleAddTransaction called');

    if (!selectedPartner) {
      console.log('No partner selected');
      Alert.alert(t('common.error'), t('partners.selectPartner'));
      return;
    }

    // Validate funds based on transaction type
    if (transactionType === 'transfer') {
      if (!sourceFund) {
        console.log('No source fund selected for transfer');
        Alert.alert(t('common.error'), t('funds.selectSourceFund'));
        return;
      }

      if (!destinationFund) {
        console.log('No destination fund selected for transfer');
        Alert.alert(t('common.error'), t('funds.selectDestinationFund'));
        return;
      }

      if (sourceFund.id === destinationFund.id) {
        console.log('Source and destination funds are the same');
        Alert.alert(t('common.error'), t('funds.sourceSameAsDestination'));
        return;
      }
    } else if (transactionType === 'deposit') {
      if (!destinationFund) {
        console.log('No destination fund selected for deposit');
        if (selectedFund) {
          setDestinationFund(selectedFund);
        } else if (funds.length > 0) {
          setDestinationFund(funds[0]);
          setSelectedFund(funds[0]);
        } else {
          Alert.alert(t('common.error'), t('funds.selectDestinationFund'));
          return;
        }
      }
    } else if (transactionType === 'withdrawal') {
      if (!sourceFund) {
        console.log('No source fund selected for withdrawal');
        if (selectedFund) {
          setSourceFund(selectedFund);
        } else if (funds.length > 0) {
          setSourceFund(funds[0]);
          setSelectedFund(funds[0]);
        } else {
          Alert.alert(t('common.error'), t('funds.selectSourceFund'));
          return;
        }
      }
    }

    if (!amount || parseFloat(amount) <= 0) {
      console.log('Invalid amount:', amount);
      Alert.alert(t('common.error'), t('common.invalidAmount'));
      return;
    }

    console.log('Validation passed for transaction type:', transactionType);

    try {
      setLoading(true);
      setSaving(true); // Start showing loading animation

      // Check Firebase connection first
      console.log('Checking Firebase connection...');
      const isConnected = await checkFirebaseConnection();
      if (!isConnected) {
        console.log('Firebase connection failed');
        Alert.alert(
          t('common.error'),
          'Could not connect to Firebase. Please check your internet connection and try again.'
        );
        setLoading(false);
        setSaving(false);
        return;
      }
      console.log('Firebase connection verified');

      const amountValue = parseFloat(amount);
      console.log('Amount value:', amountValue);

      // Create transaction object based on type
      let transactionData: any = {
        date: date,
        amount: amountValue,
        type: transactionType,
        description: description || '',
        partnerId: selectedPartner.id,
        paymentMethod: paymentMethod
      };

      // Set the appropriate fund fields based on transaction type
      if (transactionType === 'transfer') {
        if (!sourceFund || !destinationFund) {
          console.error('Missing source or destination fund for transfer');
          Alert.alert(t('common.error'), t('funds.missingFundsForTransfer'));
          setLoading(false);
          setSaving(false);
          return;
        }

        transactionData.sourceFundId = sourceFund.id;
        transactionData.destinationFundId = destinationFund.id;
        console.log(`Transfer from ${sourceFund.name} to ${destinationFund.name}`);

        // For backward compatibility
        transactionData.fundId = sourceFund.id;
      } else if (transactionType === 'deposit') {
        if (!destinationFund) {
          console.error('Missing destination fund for deposit');
          Alert.alert(t('common.error'), t('funds.selectDestinationFund'));
          setLoading(false);
          setSaving(false);
          return;
        }

        transactionData.destinationFundId = destinationFund.id;
        console.log(`Deposit to ${destinationFund.name}`);

        // For backward compatibility
        transactionData.fundId = destinationFund.id;
        setSelectedFund(destinationFund);
      } else if (transactionType === 'withdrawal') {
        if (!sourceFund) {
          console.error('Missing source fund for withdrawal');
          Alert.alert(t('common.error'), t('funds.selectSourceFund'));
          setLoading(false);
          setSaving(false);
          return;
        }

        transactionData.sourceFundId = sourceFund.id;
        console.log(`Withdrawal from ${sourceFund.name}`);

        // For backward compatibility
        transactionData.fundId = sourceFund.id;
        setSelectedFund(sourceFund);
      }

      console.log('Transaction data:', JSON.stringify(transactionData));

      try {
        // Add transaction to Firestore
        console.log('Adding transaction to Firestore...');
        const newTransaction = await addTransaction(transactionData);
        console.log('Transaction added with ID:', newTransaction.id);

        // Update fund balances based on transaction type
        if (transactionType === 'transfer') {
          // For transfers, we need to update both source and destination funds
          const sourceBalance = sourceFund!.balance - amountValue;
          const destinationBalance = destinationFund!.balance + amountValue;

          console.log(`Updating source fund balance from ${sourceFund!.balance} to ${sourceBalance}`);
          await updateFund(sourceFund!.id, { balance: sourceBalance });

          console.log(`Updating destination fund balance from ${destinationFund!.balance} to ${destinationBalance}`);
          await updateFund(destinationFund!.id, { balance: destinationBalance });

          console.log('Both fund balances updated');
        } else if (transactionType === 'deposit') {
          // For deposits, update the destination fund
          const newBalance = destinationFund!.balance + amountValue;
          console.log(`Updating fund balance from ${destinationFund!.balance} to ${newBalance}`);
          await updateFund(destinationFund!.id, { balance: newBalance });
          console.log('Fund balance updated');
        } else if (transactionType === 'withdrawal') {
          // For withdrawals, update the source fund
          const newBalance = sourceFund!.balance - amountValue;
          console.log(`Updating fund balance from ${sourceFund!.balance} to ${newBalance}`);
          await updateFund(sourceFund!.id, { balance: newBalance });
          console.log('Fund balance updated');
        }

        // Update partner capital
        const newPartnerCapital = transactionType === 'deposit'
          ? selectedPartner.currentCapital + amountValue
          : selectedPartner.currentCapital - amountValue;

        console.log(`Updating partner capital from ${selectedPartner.currentCapital} to ${newPartnerCapital}`);
        await updatePartner(selectedPartner.id, { currentCapital: newPartnerCapital });
        console.log('Partner capital updated');

        // Reset form and close modal
        setAmount('');
        setDescription('');
        setTransactionType('deposit');
        setPaymentMethod('cash');
        setDate(new Date());
        setModalVisible(false);

        // Show success animation instead of alert
        setShowSuccess(true);

        // Refresh data
        console.log('Refreshing data...');
        fetchData();
        console.log('Data refreshed');
      } catch (firebaseError) {
        console.error('Firebase operation error:', firebaseError);
        Alert.alert(
          t('common.error'),
          `Error saving to Firebase: ${firebaseError instanceof Error ? firebaseError.message : 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error in transaction process:', error);
      // Show more detailed error message
      Alert.alert(
        t('common.error'),
        `${t('common.saveError')} ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
      setSaving(false); // Stop loading animation
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Format date using the current language
  const formatDate = (date: Date) => {
    const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      calendar: 'gregory',
    });
  };

  // Get fund name from fund ID
  const getFundName = (fundId?: string): string => {
    if (!fundId) return t('common.unknown');

    const fund = funds.find(f => f.id === fundId);
    return fund ? fund.name : t('common.unknown');
  };

  const filterTransactions = () => {
    return transactions.filter(transaction => {
      const transactionDate = transaction.date;
      return (
        transactionDate.getMonth() === filterMonth &&
        transactionDate.getFullYear() === filterYear
      );
    });
  };

  if (loading && partners.length === 0) {
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
        <Text style={styles.title}>{t('funds.transactions')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // Make sure a fund is selected when opening the modal
            if (funds.length > 0 && !selectedFund) {
              setSelectedFund(funds[0]);
            }
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Fund Selector */}
      <View style={styles.fundSelector}>
        {funds.map(fund => (
          <TouchableOpacity
            key={fund.id}
            style={[
              styles.fundButton,
              selectedFund?.id === fund.id && styles.selectedFundButton
            ]}
            onPress={async () => {
              setSelectedFund(fund);
              const fundTransactions = await getTransactionsByFund(fund.id);
              setTransactions(fundTransactions);
            }}
          >
            <Text
              style={[
                styles.fundButtonText,
                selectedFund?.id === fund.id && styles.selectedFundButtonText
              ]}
            >
              {t(`funds.${fund.name.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>{t('common.filter')}:</Text>

        {/* Transaction Type Filter */}
        <View style={styles.filterTypeContainer}>
          <TouchableOpacity
            style={[
              styles.filterTypeButton,
              filterType === 'all' && styles.activeFilterTypeButton
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[
              styles.filterTypeText,
              filterType === 'all' && styles.activeFilterTypeText
            ]}>
              {t('common.all')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTypeButton,
              filterType === 'deposit' && styles.activeFilterTypeButton
            ]}
            onPress={() => setFilterType('deposit')}
          >
            <Text style={[
              styles.filterTypeText,
              filterType === 'deposit' && styles.activeFilterTypeText
            ]}>
              {t('funds.deposit')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTypeButton,
              filterType === 'withdrawal' && styles.activeFilterTypeButton
            ]}
            onPress={() => setFilterType('withdrawal')}
          >
            <Text style={[
              styles.filterTypeText,
              filterType === 'withdrawal' && styles.activeFilterTypeText
            ]}>
              {t('funds.withdrawal')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTypeButton,
              filterType === 'transfer' && styles.activeFilterTypeButton
            ]}
            onPress={() => setFilterType('transfer')}
          >
            <Text style={[
              styles.filterTypeText,
              filterType === 'transfer' && styles.activeFilterTypeText
            ]}>
              {t('funds.transfer')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Filter */}
        <View style={styles.filterControls}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              const newDate = new Date(filterYear, filterMonth - 1);
              setFilterMonth(newDate.getMonth());
              setFilterYear(newDate.getFullYear());
            }}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.DARK} />
          </TouchableOpacity>

          <Text style={styles.filterText}>
            {new Date(filterYear, filterMonth).toLocaleDateString(
              i18n.language === 'ar' ? 'ar-SA' : 'en-US',
              { month: 'long', year: 'numeric' }
            )}
          </Text>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              const newDate = new Date(filterYear, filterMonth + 1);
              setFilterMonth(newDate.getMonth());
              setFilterYear(newDate.getFullYear());
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={COLORS.DARK} />
          </TouchableOpacity>
        </View>

        {/* Date Range Filter */}
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity
            style={styles.dateRangeButton}
            onPress={() => setShowFilterStartDatePicker(true)}
          >
            <Text style={styles.dateRangeButtonText}>
              {filterStartDate ? formatDate(filterStartDate) : t('funds.startDate')}
            </Text>
            <Ionicons name="calendar-outline" size={16} color={COLORS.PRIMARY} />
          </TouchableOpacity>

          <Text style={styles.dateRangeSeparator}>-</Text>

          <TouchableOpacity
            style={styles.dateRangeButton}
            onPress={() => setShowFilterEndDatePicker(true)}
          >
            <Text style={styles.dateRangeButtonText}>
              {filterEndDate ? formatDate(filterEndDate) : t('funds.endDate')}
            </Text>
            <Ionicons name="calendar-outline" size={16} color={COLORS.PRIMARY} />
          </TouchableOpacity>

          {filterStartDate || filterEndDate ? (
            <TouchableOpacity
              style={styles.clearDateRangeButton}
              onPress={() => {
                setFilterStartDate(null);
                setFilterEndDate(null);
              }}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.DANGER} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Date Pickers */}
        {showFilterStartDatePicker && (
          <DateTimePicker
            value={filterStartDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowFilterStartDatePicker(false);
              if (selectedDate) {
                setFilterStartDate(selectedDate);
              }
            }}
          />
        )}

        {showFilterEndDatePicker && (
          <DateTimePicker
            value={filterEndDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowFilterEndDatePicker(false);
              if (selectedDate) {
                setFilterEndDate(selectedDate);
              }
            }}
          />
        )}
      </View>

      {/* Success Animation */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.successContainer,
            {
              opacity: successAnimation,
              transform: [
                {
                  translateY: successAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ]
            }
          ]}
        >
          <Ionicons name="checkmark-circle" size={24} color={COLORS.WHITE} />
          <Text style={styles.successText}>{t('funds.transactionAdded')}</Text>
        </Animated.View>
      )}

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList}>
        {filterTransactions().length > 0 ? (
          filterTransactions().map((transaction) => {
            const partner = partners.find(p => p.id === transaction.partnerId);

            return (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionPartner}>
                    {partner?.name || t('common.unknown')}
                  </Text>
                  <View style={styles.transactionAmountContainer}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color: transaction.type === 'deposit'
                            ? COLORS.SUCCESS
                            : transaction.type === 'withdrawal'
                              ? COLORS.DANGER
                              : COLORS.PRIMARY
                        },
                      ]}
                    >
                      {transaction.type === 'deposit'
                        ? '+'
                        : transaction.type === 'withdrawal'
                          ? '-'
                          : '↔'}{transaction.amount.toFixed(2)}
                    </Text>
                    {transaction.type === 'transfer' && (
                      <Text style={styles.transactionFundInfo}>
                        {getFundName(transaction.sourceFundId)} → {getFundName(transaction.destinationFundId)}
                      </Text>
                    )}
                  </View>
                </View>

                <Text style={styles.transactionDescription}>
                  {transaction.type === 'transfer' ? (
                    <>
                      {t('funds.transferBetween')} {getFundName(transaction.sourceFundId)} {t('common.and')} {getFundName(transaction.destinationFundId)}
                      {transaction.description ? `: ${transaction.description}` : ''}
                    </>
                  ) : transaction.type === 'deposit' ? (
                    <>
                      {t('funds.depositTo')} {getFundName(transaction.destinationFundId || transaction.fundId)}
                      {transaction.description ? `: ${transaction.description}` : ''}
                    </>
                  ) : (
                    <>
                      {t('funds.withdrawalFrom')} {getFundName(transaction.sourceFundId || transaction.fundId)}
                      {transaction.description ? `: ${transaction.description}` : ''}
                    </>
                  )}
                </Text>

                <View style={styles.transactionFooter}>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.date)}
                  </Text>
                  {transaction.paymentMethod && (
                    <View style={styles.paymentMethodIndicator}>
                      <Text style={[
                        styles.paymentMethodIndicatorText,
                        transaction.paymentMethod === 'cash' ? styles.cashIndicator : styles.bankIndicator
                      ]}>
                        {transaction.paymentMethod === 'cash' ? t('funds.cash') : t('funds.bank')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>{t('funds.noTransactions')}</Text>
        )}
      </ScrollView>

      {/* Add Transaction Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onShow={() => {
          // Make sure a fund is selected when the modal is shown
          if (funds.length > 0 && !selectedFund) {
            console.log('Setting selected fund on modal show');
            setSelectedFund(funds[0]);
          }
        }}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('funds.addTransaction')}</Text>

            {/* Partner Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('partners.title')}</Text>
              <View style={styles.pickerContainer}>
                {partners.map(partner => (
                  <TouchableOpacity
                    key={partner.id}
                    style={[
                      styles.pickerItem,
                      selectedPartner?.id === partner.id && styles.selectedPickerItem
                    ]}
                    onPress={() => setSelectedPartner(partner)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedPartner?.id === partner.id && styles.selectedPickerItemText
                      ]}
                    >
                      {partner.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {transactionType !== 'transfer' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {transactionType === 'deposit'
                    ? t('funds.destinationFund')
                    : t('funds.sourceFund')}
                </Text>
                <View style={styles.pickerContainer}>
                  {funds.map(fund => (
                    <TouchableOpacity
                      key={fund.id}
                      style={[
                        styles.pickerItem,
                        (transactionType === 'deposit'
                          ? destinationFund?.id === fund.id
                          : sourceFund?.id === fund.id) && styles.selectedPickerItem
                      ]}
                      onPress={() => {
                        if (transactionType === 'deposit') {
                          setDestinationFund(fund);
                          setSelectedFund(fund);
                        } else {
                          setSourceFund(fund);
                          setSelectedFund(fund);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          (transactionType === 'deposit'
                            ? destinationFund?.id === fund.id
                            : sourceFund?.id === fund.id) && styles.selectedPickerItemText
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
                {/* Source Fund Selector */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('funds.sourceFund')}</Text>
                  <View style={styles.pickerContainer}>
                    {funds.map(fund => (
                      <TouchableOpacity
                        key={fund.id}
                        style={[
                          styles.pickerItem,
                          sourceFund?.id === fund.id && styles.selectedPickerItem
                        ]}
                        onPress={() => setSourceFund(fund)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            sourceFund?.id === fund.id && styles.selectedPickerItemText
                          ]}
                        >
                          {fund.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Destination Fund Selector */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('funds.destinationFund')}</Text>
                  <View style={styles.pickerContainer}>
                    {funds.map(fund => (
                      <TouchableOpacity
                        key={fund.id}
                        style={[
                          styles.pickerItem,
                          destinationFund?.id === fund.id && styles.selectedPickerItem,
                          // Disable selecting the same fund as source
                          sourceFund?.id === fund.id && styles.disabledPickerItem
                        ]}
                        onPress={() => {
                          // Don't allow selecting the same fund as source
                          if (sourceFund?.id !== fund.id) {
                            setDestinationFund(fund);
                          }
                        }}
                        disabled={sourceFund?.id === fund.id}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            destinationFund?.id === fund.id && styles.selectedPickerItemText,
                            sourceFund?.id === fund.id && styles.disabledPickerItemText
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

            {/* Transaction Type Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('funds.transactionType')}</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    transactionType === 'deposit' && styles.selectedPickerItem
                  ]}
                  onPress={() => {
                    setTransactionType('deposit');
                    // For deposit, we need a destination fund
                    if (selectedFund) {
                      setDestinationFund(selectedFund);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      transactionType === 'deposit' && styles.selectedPickerItemText
                    ]}
                  >
                    {t('funds.deposit')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    transactionType === 'withdrawal' && styles.selectedPickerItem
                  ]}
                  onPress={() => {
                    setTransactionType('withdrawal');
                    // For withdrawal, we need a source fund
                    if (selectedFund) {
                      setSourceFund(selectedFund);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      transactionType === 'withdrawal' && styles.selectedPickerItemText
                    ]}
                  >
                    {t('funds.withdrawal')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    transactionType === 'transfer' && styles.selectedPickerItem
                  ]}
                  onPress={() => {
                    setTransactionType('transfer');
                    // For transfer, we need both source and destination funds
                    if (selectedFund) {
                      setSourceFund(selectedFund);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      transactionType === 'transfer' && styles.selectedPickerItemText
                    ]}
                  >
                    {t('funds.transfer')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('funds.amount')}</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder={t('funds.amount')}
                keyboardType="numeric"
              />
            </View>

            {/* Date Picker */}
            <CustomDateTimePicker
              label={t('funds.date')}
              value={date}
              onChange={(selectedDate) => {
                setDate(selectedDate);
                setShowDatePicker(false);
              }}
              mode="date"
            />

            {/* Payment Method Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('funds.paymentMethod')}</Text>
              <View style={styles.paymentMethodSelector}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodOption,
                    paymentMethod === 'cash' && styles.selectedPaymentMethodOption
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={paymentMethod === 'cash' ? COLORS.WHITE : COLORS.DARK}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                      styles.paymentMethodOptionText,
                      paymentMethod === 'cash' && styles.selectedPaymentMethodOptionText
                    ]}
                  >
                    {t('funds.cash')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodOption,
                    paymentMethod === 'bank' && styles.selectedPaymentMethodOption
                  ]}
                  onPress={() => setPaymentMethod('bank')}
                >
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={paymentMethod === 'bank' ? COLORS.WHITE : COLORS.DARK}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                      styles.paymentMethodOptionText,
                      paymentMethod === 'bank' && styles.selectedPaymentMethodOptionText
                    ]}
                  >
                    {t('funds.bank')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('funds.description')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('funds.description')}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Modal Actions */}
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
                onPress={handleAddTransaction}
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
  fundSelector: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
  },
  fundButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.LIGHT,
  },
  selectedFundButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  fundButtonText: {
    color: COLORS.GRAY,
    fontWeight: 'bold',
  },
  selectedFundButtonText: {
    color: COLORS.WHITE,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
  },
  filterLabel: {
    fontSize: 16,
    color: COLORS.DARK,
    marginRight: 8,
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 4,
  },
  filterText: {
    fontSize: 16,
    color: COLORS.DARK,
    marginHorizontal: 8,
  },
  transactionsList: {
    flex: 1,
    padding: 16,
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionPartner: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    flex: 1,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionFundInfo: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.GRAY,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: COLORS.LIGHT,
  },
  selectedPickerItem: {
    backgroundColor: COLORS.PRIMARY,
  },
  pickerItemText: {
    color: COLORS.GRAY,
  },
  selectedPickerItemText: {
    color: COLORS.WHITE,
  },
  disabledPickerItem: {
    backgroundColor: COLORS.LIGHT,
    opacity: 0.5,
  },
  disabledPickerItemText: {
    color: COLORS.GRAY,
    opacity: 0.5,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT,
    borderRadius: 4,
    padding: 10,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: COLORS.DARK,
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
  // New styles for filters
  filterTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  filterTypeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: COLORS.LIGHT,
  },
  activeFilterTypeButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterTypeText: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  activeFilterTypeText: {
    color: COLORS.WHITE,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.LIGHT,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flex: 1,
    maxWidth: '45%',
  },
  dateRangeButtonText: {
    fontSize: 14,
    color: COLORS.DARK,
    marginRight: 4,
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
    color: COLORS.GRAY,
  },
  clearDateRangeButton: {
    marginLeft: 8,
    padding: 4,
  },
  // Success animation styles
  successContainer: {
    position: 'absolute',
    top: 100,
    left: '50%',
    transform: [{ translateX: -100 }],
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 200,
  },
  successText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
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
  // Transaction payment method indicator styles
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
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

export default CapitalTransactionScreen;
