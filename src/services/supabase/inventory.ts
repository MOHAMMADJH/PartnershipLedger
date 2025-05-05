import { supabase } from './client';
import { InventoryItem, InventoryItemDb } from '../../types/index';
import { executeOrQueueOperation, OperationResult } from '../sync/supabaseApiService';

// Helper function to convert camelCase keys to snake_case for DB operations
const toDb = (item: Partial<InventoryItem>): Partial<InventoryItemDb> => ({
  ...(item.id && { id: item.id }),
  ...(item.name && { name: item.name }),
  ...(item.description && { description: item.description }),
  ...(item.category && { category: item.category }),
  ...(item.barcode && { barcode: item.barcode }),
  ...(typeof item.quantity === 'number' && { quantity: item.quantity }),
  ...(typeof item.reorderLevel === 'number' && { reorder_level: item.reorderLevel }),
  ...(typeof item.purchasePrice === 'number' && { purchase_price: item.purchasePrice }),
  ...(typeof item.sellingPrice === 'number' && { selling_price: item.sellingPrice }),
  ...(item.supplier && { supplier: item.supplier }),
  // created_at, updated_at are handled by Supabase triggers or defaults
  // created_by is handled by Supabase based on the authenticated user RLS policy
});

// Helper function to convert snake_case keys from DB to camelCase for app usage
const fromDb = (item: InventoryItemDb): InventoryItem => ({
  id: item.id,
  name: item.name,
  description: item.description ?? undefined,
  category: item.category ?? undefined,
  barcode: item.barcode ?? undefined,
  quantity: item.quantity,
  reorderLevel: item.reorder_level ?? undefined,
  purchasePrice: item.purchase_price ?? undefined,
  sellingPrice: item.selling_price ?? undefined,
  supplier: item.supplier ?? undefined,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  createdBy: item.created_by ?? undefined
});

// Inventory
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    console.log('Fetching inventory items...');

    // Use explicit select with proper column names (snake_case in DB)
    const { data, error } = await supabase
      .from('inventory_summary')
      .select('id, name, description, quantity, purchase_price, selling_price, reorder_level, category, barcode, supplier, created_at, updated_at, created_by');

    if (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }

    console.log('Received inventory data:', data);

    // Map snake_case DB column names to camelCase for the application
    const processedData = data.map(item => fromDb(item));

    console.log('Processed inventory data:', processedData);

    return processedData;
  } catch (error) {
    console.error('Error getting inventory items:', error);
    return [];
  }
};

export const getInventoryItem = async (id: string): Promise<InventoryItem | null> => {
  try {
    console.log(`Fetching inventory item with id: ${id}`);

    // Use explicit select with proper column names (snake_case in DB)
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, name, description, quantity, purchase_price, selling_price, reorder_level, category, barcode, supplier, created_at, updated_at, created_by')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting inventory item:', error);
      return null;
    }

    console.log('Received inventory item data:', data);

    // Map snake_case DB column names to camelCase for the application
    const processedItem = fromDb(data);

    console.log('Processed inventory item:', processedItem);

    return processedItem;
  } catch (error) {
    console.error('Error getting inventory item:', error);
    return null;
  }
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<OperationResult> => {
  console.log('Attempting to add inventory item:', item.name);
  const itemDataDb = toDb(item);
  
  // Use the api service to execute or queue
  const result = await executeOrQueueOperation({
    type: 'insert',
    entity: 'inventory_items',
    payload: itemDataDb
    // No need to specify 'id' for insert
  });

  if (result.success) {
    console.log('Item added successfully online.');
    // Potentially return the newly created item's data if executeOrQueueOperation is enhanced to provide it
  } else if (result.queued) {
    console.log('Item add operation queued for offline sync.');
    // The UI should reflect that the operation is pending
  } else {
    console.error('Failed to add item:', result.error);
    // The UI should show an error message
  }

  return result; // Return the result object (success/queued/error)
};

export const updateInventoryItem = async (id: string, itemData: Partial<InventoryItem>): Promise<OperationResult> => {
  console.log(`Attempting to update inventory item: ${id}`);
  // Ensure we don't try to update fields managed by DB (like timestamps, created_by)
  const itemDataDb = toDb(itemData);

  // Prevent updating with an empty object
  if (Object.keys(itemDataDb).length === 0) {
      console.warn('Update attempt with no changes, skipping.');
      return { success: true }; // Or indicate no operation needed
  }

  // Use the api service to execute or queue
  const result = await executeOrQueueOperation({
    type: 'update',
    entity: 'inventory_items',
    payload: itemDataDb,
    id: id // Specify the ID for update
  });

  if (result.success) {
    console.log(`Item ${id} updated successfully online.`);
  } else if (result.queued) {
    console.log(`Item ${id} update operation queued for offline sync.`);
    // The UI should reflect that the operation is pending
  } else {
    console.error(`Failed to update item ${id}:`, result.error);
    // The UI should show an error message
  }

  return result; // Return the result object (success/queued/error)
};

// Delete an item (with offline support)
export const deleteItem = async (id: string): Promise<OperationResult> => {
  console.log(`Attempting to delete inventory item: ${id}`);
  
  // Use the api service to execute or queue
  const result = await executeOrQueueOperation({
    type: 'delete',
    entity: 'inventory_items',
    payload: {}, // Add empty payload to satisfy type
    id: id // Specify the ID for delete
  });

  if (result.success) {
    console.log(`Item ${id} deleted successfully online.`);
  } else if (result.queued) {
    console.log(`Item ${id} delete operation queued for offline sync.`);
    // The UI should reflect that the operation is pending
  } else {
    console.error(`Failed to delete item ${id}:`, result.error);
    // The UI should show an error message
  }

  return result; // Return the result object (success/queued/error)
};
