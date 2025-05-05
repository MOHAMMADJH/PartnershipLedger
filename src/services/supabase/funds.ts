import { supabase } from './client';
import { Fund } from '../../types';

// Funds
export const getFunds = async (): Promise<Fund[]> => {
  console.log('Getting all funds');
  try {
    const { data, error } = await supabase
      .from('funds')
      .select('*');
    
    if (error) throw error;
    
    console.log(`Found ${data.length} funds`);
    return data as Fund[];
  } catch (error) {
    console.error('Error getting funds:', error);
    return [];
  }
};

export const getFund = async (id: string): Promise<Fund | null> => {
  const { data, error } = await supabase
    .from('funds')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error getting fund:', error);
    return null;
  }
  
  return data as Fund;
};

export const addFund = async (fund: Omit<Fund, 'id'>): Promise<Fund> => {
  const { data, error } = await supabase
    .from('funds')
    .insert([fund])
    .select()
    .single();
  
  if (error) throw error;
  return data as Fund;
};

export const updateFund = async (id: string, data: Partial<Fund>): Promise<void> => {
  console.log(`Updating fund ${id} with data:`, data);
  try {
    const { error } = await supabase
      .from('funds')
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
    console.log(`Fund ${id} updated successfully`);
  } catch (error) {
    console.error(`Error updating fund ${id}:`, error);
    throw error;
  }
};

export const deleteFund = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('funds')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
