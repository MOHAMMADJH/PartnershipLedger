/**
 * Custom implementation of the Supabase client for React Native
 * This implementation avoids using the Node.js modules that are not available in React Native
 */

import { createClient } from '@supabase/supabase-js';
import { RealtimeClient } from './supabaseRealtimeClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Create a custom Supabase client with our mock Realtime client
const createSupabaseClient = () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      // Use our custom Realtime client implementation
      transport: {
        constructor: RealtimeClient,
      },
    },
  });

  return supabase;
};

// Create and export the Supabase client
export const supabase = createSupabaseClient();
