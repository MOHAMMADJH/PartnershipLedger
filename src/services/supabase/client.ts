import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = 'https://pzrinmnxnejwmadmneup.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cmlubW54bmVqd21hZG1uZXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNTg4NTksImV4cCI6MjA2MTgzNDg1OX0.hevole73Hr3XW-yg8QFrhSlQcpDDb8Li6b4dBgoMeoQ';

// Initialize Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Supabase Auth Helpers
export const signInWithEmail = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUpWithEmail = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};


// Function to check Supabase connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Checking Supabase connection...');
    // Use a simple query that anon role can perform (assuming RLS allows authenticated read on 'partners')
    const { error } = await supabase.from('partners').select('id', { count: 'exact', head: true });
    if (error) {
        // If error is specifically RLS related for anon trying to read partners, connection is likely okay
        // but access is denied. For a general connection check, this might need adjustment
        // depending on your public table access policies.
        // For now, let's assume an error means a potential connection issue or config problem.
        console.warn('Supabase connection check failed or access denied:', error.message);
        // Depending on policy, anon might not be able to read 'partners'. Consider a public table or function if needed.
        // Let's refine the check: if we get a response (even with error), the endpoint is reachable.
        const { data, error: fetchError } = await supabase.rpc('get_status'); // Example: assumes a public function 'get_status'
        if(fetchError) throw fetchError; // Throw if the RPC call itself fails
         console.log('Supabase endpoint reachable.');
         return true;
        // Original check logic kept for context:
        // throw error;
    }
    console.log('Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};
