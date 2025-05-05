import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './src/utils/supabaseClient';

export default function App() {
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    console.log('App initialized');

    // Test the Supabase connection
    const testSupabase = async () => {
      try {
        setStatus('Testing Supabase connection...');
        const { data, error } = await supabase.from('partners').select('*').limit(1);

        if (error) {
          console.error('Supabase error:', error);
          setStatus(`Error: ${error.message}`);
        } else {
          console.log('Supabase data:', data);
          setStatus(`Connected to Supabase! Found ${data.length} partners.`);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setStatus(`Unexpected error: ${error.message}`);
      }
    };

    testSupabase();
  }, []);

  console.log('App rendering');

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Text style={styles.title}>Partnership Ledger</Text>
        <Text style={styles.status}>{status}</Text>
        <Button
          title="Refresh Connection"
          onPress={() => {
            setStatus('Refreshing connection...');
            supabase.from('partners').select('*').limit(1).then(({ data, error }) => {
              if (error) {
                setStatus(`Error: ${error.message}`);
              } else {
                setStatus(`Connected to Supabase! Found ${data.length} partners.`);
              }
            });
          }}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});