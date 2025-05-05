import './src/polyfills'; // Import polyfills first
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/services/supabase/client';
import AppNavigator from './src/navigation';
import AuthNavigator from './src/navigation/AuthNavigator';
import './src/i18n';
import { useTranslation } from 'react-i18next';
import { COLORS } from './src/constants';
import { initNetworkMonitoring } from './src/services/network/networkService';
import { initSyncService } from './src/services/sync/syncService';

export default function App() {
  const { i18n } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [appInitialized, setAppInitialized] = useState(false);

  // Handle RTL for Arabic language
  useEffect(() => {
    if (i18n.language === 'ar') {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
  }, [i18n.language]);

  // Initialize app services
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize network monitoring
        initNetworkMonitoring();
        console.log('Network monitoring initialized');

        // Initialize sync service
        await initSyncService();
        console.log('Sync service initialized');

        setAppInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Continue anyway to allow offline usage
        setAppInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Handle authentication state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  // Show loading indicator while initializing
  if (loading || !appInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.LIGHT }}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <NavigationContainer>
          {session ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
