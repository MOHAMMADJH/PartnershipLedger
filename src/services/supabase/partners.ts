import { supabase } from './client';
import { Partner } from '../../types';

// Partners
export const getPartners = async (): Promise<Partner[]> => {
  console.log('Getting all partners');
  try {
    const { data, error } = await supabase
      .from('partner_summary')
      .select('*');
    
    if (error) throw error;
    
    console.log(`Found ${data.length} partners`);
    return data as Partner[];
  } catch (error) {
    console.error('Error getting partners:', error);
    return [];
  }
};

export const getPartner = async (id: string): Promise<Partner | null> => {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error getting partner:', error);
    return null;
  }
  
  return data as Partner;
};

export const addPartner = async (partner: Omit<Partner, 'id'>): Promise<Partner> => {
  const { data, error } = await supabase
    .from('partners')
    .insert([partner])
    .select()
    .single();
  
  if (error) throw error;
  return data as Partner;
};

export const updatePartner = async (id: string, data: Partial<Partner>): Promise<void> => {
  console.log(`Updating partner ${id} with data:`, data);
  try {
    const { error } = await supabase
      .from('partners')
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
    console.log(`Partner ${id} updated successfully`);
  } catch (error) {
    console.error(`Error updating partner ${id}:`, error);
    throw error;
  }
};

export const deletePartner = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
