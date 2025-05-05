// Application Types

// Fund Type
export interface Fund {
  id: string;
  name: string;
  balance: number;
  type: 'general' | 'personal';
  ownerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Partner Type
export interface Partner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  capitalBalance: number;
  profitBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Type
export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description?: string;
  date: Date;
  paymentMethod: 'cash' | 'bank';
  sourceFundId?: string;
  destinationFundId?: string;
  partnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Profit Distribution Type
export interface ProfitDistribution {
  id: string;
  amount: number;
  date: Date;
  description?: string;
  distributions: PartnerDistribution[];
  createdAt: Date;
  updatedAt: Date;
}

// Partner Distribution Type
export interface PartnerDistribution {
  partnerId: string;
  amount: number;
  percentage: number;
}

// Purchase Type
export interface Purchase {
  id: string;
  date: Date;
  supplier: string;
  amount: number;
  description?: string;
  paymentMethod: 'cash' | 'bank';
  fundId: string;
  items: PurchaseItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Purchase Item Type
export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Sale Type
export interface Sale {
  id: string;
  date: Date;
  customer: string;
  amount: number;
  description?: string;
  paymentMethod: 'cash' | 'bank';
  fundId: string;
  items: SaleItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Sale Item Type
export interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchaseItemId?: string;
  profit?: number;
}

// Capital Transaction Type
export interface CapitalTransaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  partnerId: string;
  amount: number;
  date: Date;
  description?: string;
  paymentMethod: 'cash' | 'bank';
  fundId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pending Operation Type
export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'fund' | 'partner' | 'transaction' | 'profitDistribution' | 'purchase' | 'sale' | 'capitalTransaction';
  entityId?: string;
  data: any;
  timestamp: number;
}

// Sync Status Type
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// Network Status Type
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

// Last Sync Time Type
export interface LastSyncTime {
  [key: string]: number; // entityType: timestamp
}
