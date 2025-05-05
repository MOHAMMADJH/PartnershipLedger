import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Network status listener
let isConnected = false;
let listeners: Array<(status: boolean) => void> = [];

// Initialize network monitoring
export const initNetworkMonitoring = (): void => {
  // Subscribe to network status changes
  NetInfo.addEventListener(handleNetworkChange);
  
  // Get initial network status
  NetInfo.fetch().then(handleNetworkChange);
};

// Handle network status changes
const handleNetworkChange = (state: NetInfoState): void => {
  const previousStatus = isConnected;
  isConnected = state.isConnected === true;
  
  // Notify listeners only if status changed
  if (previousStatus !== isConnected) {
    notifyListeners();
  }
};

// Add network status listener
export const addNetworkListener = (listener: (status: boolean) => void): () => void => {
  listeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

// Notify all listeners of current network status
const notifyListeners = (): void => {
  listeners.forEach(listener => {
    try {
      listener(isConnected);
    } catch (error) {
      console.error('Error in network listener:', error);
    }
  });
};

// Check if device is currently online
export const isOnline = (): boolean => {
  return isConnected;
};

// Get current network status as a promise
export const getNetworkStatus = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
};
