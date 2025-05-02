// Navigation routes
export const ROUTES = {
  HOME: 'Home',
  DASHBOARD: 'Dashboard',
  PARTNERS: 'Partners',
  FUNDS: 'Funds',
  CAPITAL_TRANSACTIONS: 'CapitalTransactions',
  INVENTORY: 'Inventory',
  ITEM_MANAGEMENT: 'ItemManagement',
  PURCHASES: 'Purchases',
  SALES: 'Sales',
  PROFITS: 'Profits',
  REPORTS: 'Reports',
  SETTINGS: 'Settings',
};

// Initial partners
export const INITIAL_PARTNERS = [
  {
    id: '1',
    name: 'Mohammed',
    initialCapital: 0,
    currentCapital: 0,
    profitShare: 50,
  },
  {
    id: '2',
    name: 'Sujood',
    initialCapital: 0,
    currentCapital: 0,
    profitShare: 50,
  },
];

// Initial funds
export const INITIAL_FUNDS = [
  {
    id: '1',
    name: 'Cash',
    balance: 0,
    transactions: [],
  },
  {
    id: '2',
    name: 'Bank',
    balance: 0,
    transactions: [],
  },
];

// Colors
export const COLORS = {
  PRIMARY: '#1E88E5',
  SECONDARY: '#26A69A',
  SUCCESS: '#66BB6A',
  DANGER: '#EF5350',
  WARNING: '#FFCA28',
  INFO: '#29B6F6',
  LIGHT: '#ECEFF1',
  DARK: '#263238',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY: '#607D8B',
  LIGHT_SUCCESS: '#E8F5E9',
  LIGHT_INFO: '#E1F5FE',
};
