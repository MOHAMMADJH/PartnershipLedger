import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation';
import './src/i18n';
import { useTranslation } from 'react-i18next';

// Initialize Firebase services
import './src/services/firebase';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Force RTL layout for Arabic
    if (i18n.language === 'ar') {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
  }, [i18n.language]);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}


