import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  TRANSACTIONS: 'transactions',
  PROFIT_DISTRIBUTIONS: 'profitDistributions',
  PARTNERS: 'partners',
  FUNDS: 'funds',
  PENDING_OPERATIONS: 'pendingOperations',
  LAST_SYNC_TIME: 'lastSyncTime',
};

// Define the structure for pending operations
export interface PendingOperation {
  id: string; // Unique identifier for the operation (can be local or server ID)
  type: 'insert' | 'update' | 'delete'; // Use Supabase-aligned verbs
  entity: string; // The table name (e.g., 'inventory_items')
  payload: any; // The data to be inserted or updated (snake_case)
  timestamp: string; // ISO string timestamp when the operation was queued
}

// Type for the data passed to savePendingOperation (before adding id/timestamp)
// We use Omit<> to exclude generated fields and make id optional
export type PendingOperationInput = Omit<PendingOperation, 'id' | 'timestamp'> & { id?: string };

// Save data to local storage
export const saveData = async <T>(key: string, data: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    throw error;
  }
};

// Get data from local storage
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error);
    return null;
  }
};

// Remove data from local storage
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
    throw error;
  }
};

// Clear all data from local storage
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

// Save pending operation for later sync
export const savePendingOperation = async (
  operationInput: PendingOperationInput
): Promise<void> => {
  try {
    const pendingOperations = await getPendingOperations();

    const newOperation: PendingOperation = {
      ...operationInput,
      id: operationInput.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    pendingOperations.push(newOperation);
    await saveData(STORAGE_KEYS.PENDING_OPERATIONS, pendingOperations);
    console.log(`Pending operation saved: ${newOperation.type} ${newOperation.entity} (ID: ${newOperation.id})`);
  } catch (error) {
    console.error('Error saving pending operation:', error);
    throw error;
  }
};

// Get all pending operations
export const getPendingOperations = async (): Promise<PendingOperation[]> => {
  const operations = await getData<PendingOperation[]>(STORAGE_KEYS.PENDING_OPERATIONS);
  return operations || [];
};

// Remove a pending operation after successful sync
export const removePendingOperation = async (operationId: string): Promise<void> => {
  try {
    const pendingOperations = await getPendingOperations();
    const updatedOperations = pendingOperations.filter(op =>
      op.id !== operationId
    );
    if (updatedOperations.length !== pendingOperations.length) {
      await saveData(STORAGE_KEYS.PENDING_OPERATIONS, updatedOperations);
      console.log(`Removed pending operation: ${operationId}`);
    } else {
      console.warn(`Attempted to remove non-existent pending operation: ${operationId}`);
    }
  } catch (error) {
    console.error('Error removing pending operation:', error);
    throw error;
  }
};

// Update last sync time
export const updateLastSyncTime = async (): Promise<void> => {
  try {
    await saveData(STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString());
  } catch (error) {
    console.error('Error updating last sync time:', error);
    throw error;
  }
};

// Get last sync time
export const getLastSyncTime = async (): Promise<string | null> => {
  return await getData<string>(STORAGE_KEYS.LAST_SYNC_TIME);
};
