import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  useEffect(() => {
    console.log('App initialized');
    // You can add more debug logs here
  }, []);

  console.log('App rendering');
  
  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Text>Open up App.js to start working on your app!</Text>
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
  },
});