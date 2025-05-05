import { supabase } from './client';
import { Sale } from '../../types';

// Sales
export const getSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sale_summary')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw error;
  
  return data.map(item => ({
    ...item,
    date: new Date(item.date)
  })) as Sale[];
};

export const getSalesByDateRange = async (startDate: Date, endDate: Date): Promise<Sale[]> => {
  try {
    const { data, error } = await supabase
      .from('sale_summary')
      .select('*')
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(item => ({
      ...item,
      date: new Date(item.date)
    })) as Sale[];
  } catch (error) {
    console.error('Error getting sales by date range:', error);
    return [];
  }
};

export const getSale = async (id: string): Promise<Sale | null> => {
  try {
    // Get sale details
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .single();
    
    if (saleError) throw saleError;
    
    // Get sale items
    const { data: itemsData, error: itemsError } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', id);
    
    if (itemsError) throw itemsError;
    
    return {
      ...saleData,
      date: new Date(saleData.date),
      items: itemsData
    } as Sale;
  } catch (error) {
    console.error('Error getting sale:', error);
    return null;
  }
};

export const addSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
  try {
    // Format items for the RPC function
    const formattedItems = sale.items.map(item => ({
      inventory_item_id: item.inventoryItemId,
      name: item.name,
      quantity: item.quantity,
      price_per_unit: item.pricePerUnit,
      total_price: item.totalPrice
    }));
    
    // Call the RPC function
    const { data, error } = await supabase.rpc('add_sale', {
      p_date: sale.date,
      p_customer: sale.customer,
      p_fund_id: sale.fundId,
      p_is_paid: sale.isPaid,
      p_payment_method: sale.paymentMethod,
      p_items: formattedItems
    });
    
    if (error) throw error;
    
    // Fetch the created sale
    return await getSale(data) as Sale;
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
  }
};

export const updateSale = async (id: string, data: Partial<Sale>): Promise<void> => {
  try {
    // Update sale details
    const { error } = await supabase
      .from('sales')
      .update({
        date: data.date,
        customer: data.customer,
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
        .from('sale_items')
        .delete()
        .eq('sale_id', id);
      
      if (deleteError) throw deleteError;
      
      // Insert new items
      const { error: insertError } = await supabase
        .from('sale_items')
        .insert(data.items.map(item => ({
          sale_id: id,
          inventory_item_id: item.inventoryItemId,
          name: item.name,
          quantity: item.quantity,
          price_per_unit: item.pricePerUnit,
          total_price: item.totalPrice,
          profit: item.profit
        })));
      
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error updating sale:', error);
    throw error;
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
