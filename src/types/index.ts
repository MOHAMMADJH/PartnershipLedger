// Partner types
export interface Partner {
  id: string;
  name: string;
  initialCapital: number;
  currentCapital: number;
  cashCapital: number; // Cash component of capital
  bankCapital: number; // Bank component of capital
  profitShare: number; // Percentage (e.g., 50 for 50%)
  personalFundId?: string; // ID of the personal fund associated with this partner
}

// Fund types
export interface Fund {
  id: string;
  name: string; // Cash, Bank, or Partner's personal fund
  balance: number;
  transactions: Transaction[];
  partnerId?: string; // Optional, for partner-specific funds
}

// Transaction types
export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'transfer';
  description: string;
  // For backward compatibility
  fundId?: string;
  // New fields for source and destination funds
  sourceFundId?: string;
  destinationFundId?: string;
  partnerId?: string; // Optional, for partner-specific transactions
  paymentMethod?: 'cash' | 'bank'; // Payment method (cash or bank)
}

// Inventory types
export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  totalPurchaseCost: number;
  totalSaleValue: number;
  minQuantity?: number; // Minimum quantity threshold for low stock alerts
  category?: string; // Optional category for filtering
}

// Purchase types
export interface Purchase {
  id: string;
  date: Date;
  supplier: string;
  items: PurchaseItem[];
  totalAmount: number;
  fundId: string; // Which fund was used for payment
  isPaid: boolean;
  paymentMethod: 'cash' | 'bank'; // Payment method (cash or bank)
}

export interface PurchaseItem {
  id: string;
  inventoryItemId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

// Sale types
export interface Sale {
  id: string;
  date: Date;
  customer: string;
  items: SaleItem[];
  totalAmount: number;
  fundId: string; // Which fund received the payment
  isPaid: boolean;
  paymentMethod: 'cash' | 'bank'; // Payment method (cash or bank)
}

export interface SaleItem {
  id: string;
  inventoryItemId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  profit: number; // Calculated profit for this sale item
}

// Profit types
export interface ProfitDistribution {
  id: string;
  date: Date;
  totalProfit: number;
  distributions: PartnerDistribution[];
}

export interface PartnerDistribution {
  partnerId: string;
  partnerName: string;
  amount: number;
  percentage: number;
}
