
import { Batch, Category, Product, AlertSetting, StoreProfile } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { barcode: '5010123456789', name: 'Semi Skimmed Milk 1L', category: Category.Dairy, price: 1.25 },
  { barcode: '5000111222333', name: 'Hovis Best of Both Loaf', category: Category.Bakery, price: 1.85 },
  { barcode: '5020333444555', name: 'Cheddar Cheese Block 350g', category: Category.Dairy, price: 3.50 },
  { barcode: '5449000000996', name: 'Coca Cola 500ml', category: Category.Drinks, price: 1.50 },
  { barcode: '5060001110001', name: 'Chicken Breast Fillets 300g', category: Category.MeatFish, price: 4.50 },
  { barcode: '5050666777888', name: 'Greek Yogurt 500g', category: Category.Dairy, price: 2.10 },
  { barcode: '8000500310427', name: 'Nutella Hazelnut Spread', category: Category.Snacks, price: 3.00 },
  { barcode: '0000000000001', name: 'Test Sandwich BLT', category: Category.Produce, price: 3.25 },
];

// Helper to generate a date relative to today
const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const MOCK_BATCHES: Batch[] = [
  { id: 'b1', barcode: '5010123456789', expiryDate: daysFromNow(1), quantity: 6, status: 'active', addedDate: daysFromNow(-5) }, // Milk, expires tmrw
  { id: 'b2', barcode: '5060001110001', expiryDate: daysFromNow(2), quantity: 4, status: 'active', addedDate: daysFromNow(-4) }, // Chicken, expires in 2 days
  { id: 'b3', barcode: '5000111222333', expiryDate: daysFromNow(4), quantity: 10, status: 'active', addedDate: daysFromNow(-2) }, // Bread, expires in 4 days
  { id: 'b4', barcode: '5020333444555', expiryDate: daysFromNow(15), quantity: 12, status: 'active', addedDate: daysFromNow(-10) }, // Cheese, safe
  { id: 'b5', barcode: '5449000000996', expiryDate: daysFromNow(90), quantity: 24, status: 'active', addedDate: daysFromNow(-20) }, // Coke, very safe
  { id: 'b6', barcode: '5050666777888', expiryDate: daysFromNow(-1), quantity: 2, status: 'active', addedDate: daysFromNow(-10) }, // Yogurt, expired yesterday
];

export const DEFAULT_ALERT_SETTINGS: AlertSetting[] = [
  { category: Category.Dairy, criticalDays: 3, warningDays: 7 },
  { category: Category.MeatFish, criticalDays: 3, warningDays: 5 },
  { category: Category.Produce, criticalDays: 2, warningDays: 4 },
  { category: Category.Bakery, criticalDays: 2, warningDays: 4 },
  { category: Category.Drinks, criticalDays: 30, warningDays: 60 },
  { category: Category.Snacks, criticalDays: 30, warningDays: 60 },
  { category: Category.Canned, criticalDays: 30, warningDays: 90 },
  { category: Category.Household, criticalDays: 0, warningDays: 0 },
  { category: Category.Alcohol, criticalDays: 30, warningDays: 60 },
];

export const DEFAULT_STORE_PROFILE: StoreProfile = {
  storeName: "John's Shop",
  ownerName: "John Doe",
  email: "john@example.com",
  phone: "07700 900900",
  currency: "GBP",
  defaultMarkdownPercent: 50
};

