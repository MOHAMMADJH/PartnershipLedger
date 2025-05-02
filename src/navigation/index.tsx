import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ROUTES, COLORS } from '../constants';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import PartnersScreen from '../screens/PartnersScreen';
import FundsScreen from '../screens/FundsScreen';
import CapitalTransactionScreen from '../screens/CapitalTransactionScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ItemManagementScreen from '../screens/ItemManagementScreen';
import PurchasesScreen from '../screens/PurchasesScreen';
import SalesScreen from '../screens/SalesScreen';
import ProfitsScreen from '../screens/ProfitsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === ROUTES.DASHBOARD) iconName = focused ? 'home' : 'home-outline';
          else if (route.name === ROUTES.PURCHASES) iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === ROUTES.SALES) iconName = focused ? 'pricetag' : 'pricetag-outline';
          else if (route.name === ROUTES.ITEM_MANAGEMENT) iconName = focused ? 'list' : 'list-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.GRAY,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name={ROUTES.DASHBOARD}
        component={DashboardScreen}
        options={{ title: t('navigation.dashboard') }}
      />
      <Tab.Screen
        name={ROUTES.PURCHASES}
        component={PurchasesScreen}
        options={{ title: t('navigation.purchases') }}
      />
      <Tab.Screen
        name={ROUTES.SALES}
        component={SalesScreen}
        options={{ title: t('navigation.sales') }}
      />
      <Tab.Screen
        name={ROUTES.ITEM_MANAGEMENT}
        component={ItemManagementScreen}
        options={{ title: t('inventory.title') }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { t } = useTranslation();
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          drawerActiveTintColor: COLORS.PRIMARY,
          drawerInactiveTintColor: COLORS.DARK,
        }}
      >
        <Drawer.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            drawerLabel: t('navigation.dashboard'),
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            )
          }}
        />
        <Drawer.Screen
          name={ROUTES.PARTNERS}
          component={PartnersScreen}
          options={{
            drawerLabel: t('navigation.partners'),
            drawerIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            )
          }}
        />
        <Drawer.Screen
          name={ROUTES.FUNDS}
          component={FundsScreen}
          options={{
            drawerLabel: t('navigation.funds'),
            drawerIcon: ({ color, size }) => (
              <Ionicons name="wallet" size={size} color={color} />
            )
          }}
        />
        <Drawer.Screen
          name={ROUTES.CAPITAL_TRANSACTIONS}
          component={CapitalTransactionScreen}
          options={{
            drawerLabel: t('funds.transactions'),
            drawerIcon: ({ color, size }) => (
              <Ionicons name="swap-horizontal" size={size} color={color} />
            )
          }}
        />
        <Drawer.Screen
          name={ROUTES.INVENTORY}
          component={InventoryScreen}
          options={{
            drawerLabel: t('navigation.inventory'),
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cube" size={size} color={color} />
            )
          }}
        />
        <Drawer.Screen
          name={ROUTES.PROFITS}
          component={ProfitsScreen}
          options={{
            drawerLabel: t('navigation.profits'),
            drawerIcon: ({ color, size }) => (
              <Ionicons name="trending-up" size={size} color={color} />
            )
          }}
        />
        <Drawer.Screen
          name={ROUTES.REPORTS}
          component={ReportsScreen}
          options={{
            drawerLabel: t('navigation.reports'),
            drawerIcon: ({ color, size }) => (
              <Ionicons name="document-text" size={size} color={color} />
            )
          }}
        />
        <Drawer.Screen
          name={ROUTES.SETTINGS}
          component={SettingsScreen}
          options={{
            drawerLabel: t('navigation.settings'),
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            )
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
