import { initNetworkMonitoring } from './network/networkService';
import { initSyncService } from './sync/syncService';
import { checkSupabaseConnection } from './supabase/client';

/**
 * Initialize application services
 * This function should be called when the app starts
 */
export const initializeApp = async (): Promise<void> => {
  try {
    console.log('Initializing application services...');
    
    // Initialize network monitoring
    initNetworkMonitoring();
    console.log('Network monitoring initialized');
    
    // Check Supabase connection
    const isConnected = await checkSupabaseConnection();
    console.log('Supabase connection status:', isConnected ? 'Connected' : 'Disconnected');
    
    // Initialize sync service (will pull data if online)
    if (isConnected) {
      await initSyncService();
      console.log('Sync service initialized');
    } else {
      console.log('Offline mode: Working with local data');
    }
    
    console.log('Application initialization completed');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
};
