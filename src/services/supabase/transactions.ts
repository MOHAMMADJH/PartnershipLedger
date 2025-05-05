import { supabase } from './client';
import { Transaction } from '../../types';
import { getNetworkStatus } from '../network/networkService';
import { getData, saveData, STORAGE_KEYS, savePendingOperation } from '../storage/localStorageService';

// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    // Check if we're online
    const isOnline = await getNetworkStatus();
    
    if (isOnline) {
      // Online: Get data from Supabase
      const { data, error } = await supabase
        .from('transaction_summary')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Format data
      const formattedData = data.map(item => ({
        ...item,
        date: new Date(item.date)
      }));
      
      // Save to local storage for offline use
      await saveData(STORAGE_KEYS.TRANSACTIONS, data.map(item => ({
        ...item,
        date: item.date // Store as string in storage
      })));
      
      return formattedData as Transaction[];
    } else {
      // Offline: Get data from local storage
      const localData = await getData<any[]>(STORAGE_KEYS.TRANSACTIONS) || [];
      return localData.map(item => ({
        ...item,
        date: new Date(item.date)
      })) as Transaction[];
    }
  } catch (error) {
    console.error('Error getting transactions:', error);
    
    // Fallback to local storage in case of error
    try {
      const localData = await getData<any[]>(STORAGE_KEYS.TRANSACTIONS) || [];
      return localData.map(item => ({
        ...item,
        date: new Date(item.date)
      })) as Transaction[];
    } catch (localError) {
      console.error('Error getting local transactions:', localError);
      return [];
    }
  }
};

export const getTransactionsByFund = async (fundId: string): Promise<Transaction[]> => {
  console.log(`Getting transactions for fund ID: ${fundId}`);
  try {
    const { data, error } = await supabase
      .rpc('get_transactions_by_fund', { fund_id: fundId });
    
    if (error) {
      console.error('Error calling get_transactions_by_fund RPC:', error);
      throw error;
    }
    
    if (!data || !Array.isArray(data)) {
      console.warn('Unexpected response format from get_transactions_by_fund RPC');
      return [];
    }
    
    const transactions = data.map((item: any) => ({
      ...item,
      date: new Date(item.date)
    })) as Transaction[];
    
    console.log(`Returning ${transactions.length} transactions for fund ${fundId}`);
    return transactions;
  } catch (error) {
    console.error('Error getting transactions by fund:', error);
    return [];
  }
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  console.log('addTransaction function called with data:', JSON.stringify(transaction));

  try {
    // Check if we're online
    const isOnline = await getNetworkStatus();
    
    if (isOnline) {
      // Online: Add to Supabase
      // Ensure date is in ISO format for the RPC call
      const isoDate = transaction.date instanceof Date 
        ? transaction.date.toISOString() 
        : new Date(transaction.date).toISOString();

      const { data, error } = await supabase.rpc('add_transaction', {
        p_date: isoDate,
        p_amount: transaction.amount,
        p_type: transaction.type,
        p_description: transaction.description || '',
        p_source_fund_id: transaction.sourceFundId || null,
        p_destination_fund_id: transaction.destinationFundId || null,
        p_partner_id: transaction.partnerId || null,
        p_payment_method: transaction.paymentMethod || null
      });

      if (error) {
        console.error('Error calling add_transaction RPC:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to get transaction ID from add_transaction RPC');
      }

      // Fetch the created transaction
      const { data: transactionData, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) {
        console.error('Error fetching created transaction:', fetchError);
        throw fetchError;
      }

      if (!transactionData) {
        throw new Error('Failed to retrieve created transaction');
      }
      
      const newTransaction = {
        ...transactionData,
        date: new Date(transactionData.date)
      } as Transaction;
      
      // Update local storage with new transaction
      const localTransactions = await getData<any[]>(STORAGE_KEYS.TRANSACTIONS) || [];
      await saveData(STORAGE_KEYS.TRANSACTIONS, [{
        ...transactionData,
        date: transactionData.date // Store as string in storage
      }, ...localTransactions]);
      
      return newTransaction;
    } else {
      // Offline: Save to pending operations
      const tempId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create local transaction object
      const newTransaction = {
        ...transaction,
        id: tempId,
        date: transaction.date instanceof Date 
          ? transaction.date 
          : new Date(transaction.date),
        status: 'pending' // Add a status to indicate it's pending sync
      } as Transaction;
      
      // Save to pending operations for later sync
      await savePendingOperation({
        type: 'create',
        entity: 'transactions',
        data: transaction,
        id: tempId
      });
      
      // Add to local storage
      const localTransactions = await getData<any[]>(STORAGE_KEYS.TRANSACTIONS) || [];
      await saveData(STORAGE_KEYS.TRANSACTIONS, [{
        ...newTransaction,
        date: newTransaction.date.toISOString() // Store as string in storage
      }, ...localTransactions]);
      
      return newTransaction;
    }
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};
