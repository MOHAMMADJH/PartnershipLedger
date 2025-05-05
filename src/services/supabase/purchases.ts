import { supabase } from './client';
import { Purchase } from '../../types';

// Purchases
export const getPurchases = async (): Promise<Purchase[]> => {
  const { data, error } = await supabase
    .from('purchase_summary')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw error;
  
  return data.map(item => ({
    ...item,
    date: new Date(item.date)
  })) as Purchase[];
};

export const getPurchase = async (id: string): Promise<Purchase | null> => {
  try {
    // Get purchase details
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .single();
    
    if (purchaseError) throw purchaseError;
    
    // Get purchase items
    const { data: itemsData, error: itemsError } = await supabase
      .from('purchase_items')
      .select('*')
      .eq('purchase_id', id);
    
    if (itemsError) throw itemsError;
    
    return {
      ...purchaseData,
      date: new Date(purchaseData.date),
      items: itemsData
    } as Purchase;
  } catch (error) {
    console.error('Error getting purchase:', error);
    return null;
  }
};

export const getPurchasesByDateRange = async (startDate: Date, endDate: Date): Promise<Purchase[]> => {
  try {
    const { data, error } = await supabase
      .from('purchase_summary')
      .select('*')
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(item => ({
      ...item,
      date: new Date(item.date)
    })) as Purchase[];
  } catch (error) {
    console.error('Error getting purchases by date range:', error);
    return [];
  }
};

export const addPurchase = async (purchase: Omit<Purchase, 'id'>): Promise<Purchase> => {
  try {
    // Format items for the RPC function
    const formattedItems = purchase.items.map(item => ({
      inventory_item_id: item.inventoryItemId,
      name: item.name,
      quantity: item.quantity,
      price_per_unit: item.pricePerUnit,
      total_price: item.totalPrice
    }));
    
    // Call the RPC function
    const { data, error } = await supabase.rpc('add_purchase', {
      p_date: purchase.date,
      p_supplier: purchase.supplier,
      p_fund_id: purchase.fundId,
      p_is_paid: purchase.isPaid,
      p_payment_method: purchase.paymentMethod,
      p_items: formattedItems
    });
    
    if (error) throw error;
    
    // Fetch the created purchase
    return await getPurchase(data) as Purchase;
  } catch (error) {
    console.error('Error adding purchase:', error);
    throw error;
  }
};

export const updatePurchase = async (id: string, data: Partial<Purchase>): Promise<void> => {
  try {
    // Update purchase details
    const { error } = await supabase
      .from('purchases')
      .update({
        date: data.date,
        supplier: data.supplier,
        fund_id: data.fundId,
        is_paid: data.isPaid,
        payment_method: data.paymentMethod
      })
      .eq('id', id);
    
    if (error) throw error;
    
    // If items are provided, update them
    if (data.items && data.items.length > 0) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', id);
      
      if (deleteError) throw deleteError;
      
      // Insert new items
      const { error: insertError } = await supabase
        .from('purchase_items')
        .insert(data.items.map(item => ({
          purchase_id: id,
          inventory_item_id: item.inventoryItemId,
          name: item.name,
          quantity: item.quantity,
          price_per_unit: item.pricePerUnit,
          total_price: item.totalPrice
        })));
      
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error updating purchase:', error);
    throw error;
  }
};

export const deletePurchase = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('purchases')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
