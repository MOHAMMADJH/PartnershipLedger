import { supabase } from './client';
import { ProfitDistribution } from '../../types';
import { getNetworkStatus } from '../network/networkService';
import { getData, saveData, STORAGE_KEYS, savePendingOperation } from '../storage/localStorageService';

// Profit Distributions
export const getProfitDistributions = async (): Promise<ProfitDistribution[]> => {
  try {
    // Check if we're online
    const isOnline = await getNetworkStatus();
    
    if (isOnline) {
      // Online: Get data from Supabase
      const { data, error } = await supabase
        .from('profit_distribution_summary')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Save to local storage for offline use
      const formattedData = data.map(item => ({
        ...item,
        date: new Date(item.date),
        distributions: item.distributions
      }));
      
      await saveData(STORAGE_KEYS.PROFIT_DISTRIBUTIONS, formattedData);
      
      return formattedData as ProfitDistribution[];
    } else {
      // Offline: Get data from local storage
      const localData = await getData<ProfitDistribution[]>(STORAGE_KEYS.PROFIT_DISTRIBUTIONS) || [];
      return localData.map(item => ({
        ...item,
        date: new Date(item.date)
      }));
    }
  } catch (error) {
    console.error('Error getting profit distributions:', error);
    
    // Fallback to local storage in case of error
    try {
      const localData = await getData<ProfitDistribution[]>(STORAGE_KEYS.PROFIT_DISTRIBUTIONS) || [];
      return localData.map(item => ({
        ...item,
        date: new Date(item.date)
      }));
    } catch (localError) {
      console.error('Error getting local profit distributions:', localError);
      return [];
    }
  }
};

// Add profit distribution with offline support
export const addProfitDistribution = async (distribution: Omit<ProfitDistribution, 'id'>): Promise<ProfitDistribution> => {
  try {
    // Check if we're online
    const isOnline = await getNetworkStatus();
    
    if (isOnline) {
      // Format distributions for the RPC function
      const formattedDistributions = distribution.distributions.map(item => ({
        partner_id: item.partnerId,
        partner_name: item.partnerName,
        amount: item.amount,
        percentage: item.percentage
      }));
      
      // Call the RPC function
      const { data, error } = await supabase.rpc('add_profit_distribution', {
        p_date: distribution.date instanceof Date 
          ? distribution.date.toISOString() 
          : new Date(distribution.date).toISOString(),
        p_total_profit: distribution.totalProfit,
        p_distributions: formattedDistributions
      });
      
      if (error) throw error;
      
      // Fetch the created distribution
      const { data: distributionData, error: fetchError } = await supabase
        .from('profit_distribution_summary')
        .select('*')
        .eq('id', data)
        .single();
      
      if (fetchError) throw fetchError;
      
      return {
        ...distributionData,
        date: new Date(distributionData.date),
        distributions: distributionData.distributions
      } as ProfitDistribution;
    } else {
      // Offline: Save to pending operations
      const tempId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newDistribution = {
        ...distribution,
        id: tempId,
        date: distribution.date instanceof Date 
          ? distribution.date 
          : new Date(distribution.date)
      } as ProfitDistribution;
      
      // Save to pending operations for later sync
      await savePendingOperation({
        type: 'create',
        entity: 'profitDistributions',
        data: distribution,
        id: tempId
      });
      
      // Get current local data
      const localData = await getData<ProfitDistribution[]>(STORAGE_KEYS.PROFIT_DISTRIBUTIONS) || [];
      
      // Add new item to local data
      const updatedData = [newDistribution, ...localData];
      await saveData(STORAGE_KEYS.PROFIT_DISTRIBUTIONS, updatedData);
      
      return newDistribution;
    }
  } catch (error) {
    console.error('Error adding profit distribution:', error);
    throw error;
  }
};
