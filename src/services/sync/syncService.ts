import { addNetworkListener, getNetworkStatus, isOnline } from '../network/networkService';
import {
  getPendingOperations,
  removePendingOperation,
  updateLastSyncTime,
  PendingOperation 
} from '../storage/localStorageService';
import { supabase } from '../supabase/client';

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error'
}

let syncState = {
  status: SyncStatus.IDLE,
  lastSyncAttempt: null as Date | null,
  error: null as Error | null
};

export const getSyncState = () => ({ ...syncState });

let isSyncing = false; 

export const syncPendingOperations = async (): Promise<boolean> => {
  if (isSyncing) {
    console.log('Sync already in progress, skipping.');
    return false;
  }
  
  if (!await isOnline()) {
    console.log('Sync skipped: offline.');
    syncState = { ...syncState, status: SyncStatus.IDLE }; 
    return false;
  }

  isSyncing = true;
  syncState = {
    ...syncState,
    status: SyncStatus.SYNCING,
    lastSyncAttempt: new Date(),
    error: null
  };

  try {
    const pendingOperations = await getPendingOperations();
    console.log(`Found ${pendingOperations.length} pending operations.`);

    if (pendingOperations.length === 0) {
      syncState = { ...syncState, status: SyncStatus.SUCCESS };
      await updateLastSyncTime();
      isSyncing = false;
      console.log('No pending operations to sync.');
      return true;
    }

    let allSucceeded = true;
    
    for (const operation of pendingOperations) {
      try {
        console.log(`Processing operation ID: ${operation.id}, Type: ${operation.type}, Entity: ${operation.entity}`);
        await processPendingOperation(operation);
        
        await removePendingOperation(operation.id);
        console.log(`Successfully processed and removed operation ID: ${operation.id}`);
      } catch (error) {
        allSucceeded = false;
        console.error(`Error processing operation ID ${operation.id}:`, error);
        
      }
    }

    syncState = {
      ...syncState,
      status: allSucceeded ? SyncStatus.SUCCESS : SyncStatus.ERROR,
      error: allSucceeded ? null : new Error('One or more sync operations failed. Check logs.')
    };
    await updateLastSyncTime();
    console.log(`Sync finished. Status: ${syncState.status}`);
    isSyncing = false;
    return allSucceeded;

  } catch (error) {
    console.error('Critical sync error:', error);
    syncState = {
      ...syncState,
      status: SyncStatus.ERROR,
      error: error instanceof Error ? error : new Error('Unknown critical sync error')
    };
    isSyncing = false;
    return false;
  }
};

const processPendingOperation = async (operation: PendingOperation): Promise<void> => {
  const { type, entity, payload, id } = operation;
  let error: any;
  let data: any;

  
  console.log(`Executing DB operation: ${type} on ${entity} with ID ${id || 'N/A'}`);

  switch (type) {
    case 'insert':
      ({ data, error } = await supabase
        .from(entity)
        .insert(payload)
        .select()
        .single());
      break;
    case 'update':
      if (!id) throw new Error(`Update operation missing ID for entity ${entity}`);
      ({ error } = await supabase
        .from(entity)
        .update(payload)
        .eq('id', id));
      break;
    case 'delete':
      if (!id) throw new Error(`Delete operation missing ID for entity ${entity}`);
      ({ error } = await supabase
        .from(entity)
        .delete()
        .eq('id', id));
      break;
    default:
      console.warn(`Unsupported operation type: ${type}`);
      throw new Error(`Unsupported operation type: ${type}`);
  }

  if (error) {
    console.error(`Supabase error during ${type} on ${entity} (ID: ${id}):`, error);
    
    throw error;
  }

  console.log(`Supabase operation ${type} on ${entity} (ID: ${id}) successful.`);
  
};

let unsubscribeNetworkListener: (() => void) | null = null;

export const initSyncService = async (): Promise<void> => {
  console.log('Initializing Sync Service...');
  if (unsubscribeNetworkListener) {
    console.log('Sync service listener already initialized.');
    return;
  }
  
 
  if (await isOnline()) {
    console.log('Device is online, attempting initial sync...');
    syncPendingOperations(); 
  }

 
  unsubscribeNetworkListener = addNetworkListener((isConnected) => {
    console.log(`Network status changed: ${isConnected ? 'Online' : 'Offline'}`);
    if (isConnected) {
      console.log('Connection restored, triggering sync...');
      syncPendingOperations(); 
    }
  });
  console.log('Sync Service initialized and network listener attached.');
};

export const stopSyncService = (): void => {
  if (unsubscribeNetworkListener) {
    unsubscribeNetworkListener();
    unsubscribeNetworkListener = null;
    console.log('Sync Service stopped and network listener detached.');
  }
};
