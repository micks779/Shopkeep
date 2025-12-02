
export enum Category {
  Dairy = 'Dairy',
  Bakery = 'Bakery',
  MeatFish = 'Meat & Fish',
  Produce = 'Fresh Produce',
  Drinks = 'Soft Drinks',
  Alcohol = 'Alcohol',
  Canned = 'Canned Goods',
  Snacks = 'Snacks',
  Household = 'Household'
}

export interface Product {
  barcode: string;
  name: string;
  category: Category;
  price: number; // Selling price
}

export interface Batch {
  id: string;
  barcode: string;
  expiryDate: string; // ISO date string YYYY-MM-DD
  quantity: number;
  status: 'active' | 'reduced' | 'wasted' | 'sold';
  addedDate: string;
}

// Combined type for UI display
export interface BatchWithProduct extends Batch {
  productName: string;
  category: Category;
  price: number;
  daysUntilExpiry: number;
}

export type AlertLevel = 'critical' | 'warning' | 'safe' | 'expired';

export interface AlertSetting {
  category: Category;
  criticalDays: number; // e.g., 2 days
  warningDays: number; // e.g., 5 days
}

export interface StoreProfile {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  currency: string;
  defaultMarkdownPercent: number;
}

