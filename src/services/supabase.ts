import {
  Partner,
  Fund,
  Transaction,
  InventoryItem,
  Purchase,
  Sale,
  ProfitDistribution,
  PurchaseItem,
  SaleItem,
  PartnerDistribution
} from '../types';

// Import Supabase client from the client.ts file
import { supabase } from './supabase/client';

// Function to check Supabase connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Checking Supabase connection...');
    const { data, error } = await supabase.from('partners').select('count');
    if (error) throw error;
    console.log('Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

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

// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transaction_summary')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data.map(item => ({
    ...item,
    date: new Date(item.date)
  })) as Transaction[];
};

export const getTransactionsByFund = async (fundId: string): Promise<Transaction[]> => {
  console.log(`Getting transactions for fund ID: ${fundId}`);
  try {
    const { data, error } = await supabase
      .rpc('get_transactions_by_fund', { fund_id: fundId });

    if (error) throw error;

    const transactions = data.map(item => ({
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
    const { data, error } = await supabase.rpc('add_transaction', {
      p_date: transaction.date,
      p_amount: transaction.amount,
      p_type: transaction.type,
      p_description: transaction.description,
      p_source_fund_id: transaction.sourceFundId,
      p_destination_fund_id: transaction.destinationFundId,
      p_partner_id: transaction.partnerId,
      p_payment_method: transaction.paymentMethod
    });

    if (error) throw error;

    // Fetch the created transaction
    const { data: transactionData, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) throw fetchError;

    return {
      ...transactionData,
      date: new Date(transactionData.date)
    } as Transaction;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Inventory
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory_summary')
    .select('*');

  if (error) throw error;
  return data as InventoryItem[];
};

export const getInventoryItem = async (id: string): Promise<InventoryItem | null> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error getting inventory item:', error);
    return null;
  }

  return data as InventoryItem;
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data as InventoryItem;
};

export const updateInventoryItem = async (id: string, data: Partial<InventoryItem>): Promise<void> => {
  const { error } = await supabase
    .from('inventory_items')
    .update(data)
    .eq('id', id);

  if (error) throw error;
};

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

// Profit Distributions
export const getProfitDistributions = async (): Promise<ProfitDistribution[]> => {
  try {
    const { data, error } = await supabase
      .from('profit_distribution_summary')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      ...item,
      date: new Date(item.date),
      distributions: item.distributions
    })) as ProfitDistribution[];
  } catch (error) {
    console.error('Error getting profit distributions:', error);
    return [];
  }
};

export const addProfitDistribution = async (distribution: Omit<ProfitDistribution, 'id'>): Promise<ProfitDistribution> => {
  try {
    // Format distributions for the RPC function
    const formattedDistributions = distribution.distributions.map(item => ({
      partner_id: item.partnerId,
      partner_name: item.partnerName,
      amount: item.amount,
      percentage: item.percentage
    }));

    // Call the RPC function
    const { data, error } = await supabase.rpc('add_profit_distribution', {
      p_date: distribution.date,
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
  } catch (error) {
    console.error('Error adding profit distribution:', error);
    throw error;
  }
};
