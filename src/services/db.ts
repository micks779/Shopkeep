
import { Batch, Product, StoreProfile } from '../types';
import { MOCK_BATCHES, MOCK_PRODUCTS, DEFAULT_STORE_PROFILE } from '../constants';
import { supabase } from '../lib/supabase';

// CONFIGURATION
// Set this to true only when you have set up your Supabase project keys
const USE_REAL_BACKEND = true; 

// SIMULATED LATENCY (ms) - Makes the app feel like it has a real server
const LATENCY = 600;

// Helper to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

export const db = {
  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    if (USE_REAL_BACKEND) {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    }
    
    // Simulation
    await new Promise(r => setTimeout(r, LATENCY));
    const local = localStorage.getItem('sk_products');
    return local ? JSON.parse(local) : MOCK_PRODUCTS;
  },

  saveProduct: async (product: Product): Promise<void> => {
    if (USE_REAL_BACKEND) {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('products')
        .upsert({ ...product, user_id: userId });
      if (error) throw error;
      return;
    }

    await new Promise(r => setTimeout(r, LATENCY));
    const products = await db.getProducts();
    const exists = products.find(p => p.barcode === product.barcode);
    if (!exists) {
        const newProducts = [...products, product];
        localStorage.setItem('sk_products', JSON.stringify(newProducts));
    }
  },

  // --- BATCHES (INVENTORY) ---
  getBatches: async (): Promise<Batch[]> => {
    if (USE_REAL_BACKEND) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
          .from('batches')
          .select('*')
          .eq('user_id', userId);
        if (error) throw error;
        if (!data) return [];
        
        // Convert snake_case to camelCase
        return data.map((row: any) => ({
          id: row.id,
          barcode: row.barcode,
          expiryDate: row.expiry_date || row.expiryDate,
          quantity: row.quantity,
          status: row.status,
          addedDate: row.added_date || row.addedDate
        }));
    }

    await new Promise(r => setTimeout(r, LATENCY));
    const local = localStorage.getItem('sk_batches');
    return local ? JSON.parse(local) : MOCK_BATCHES;
  },

  addBatch: async (batch: Batch): Promise<void> => {
    if (USE_REAL_BACKEND) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
        
        // Convert camelCase to snake_case for database
        const dbBatch = {
          id: batch.id,
          barcode: batch.barcode,
          expiry_date: batch.expiryDate,
          quantity: batch.quantity,
          status: batch.status,
          added_date: batch.addedDate,
          user_id: userId
        };
        const { error } = await supabase.from('batches').insert(dbBatch);
        if (error) throw error;
        return;
    }

    await new Promise(r => setTimeout(r, LATENCY));
    const batches = await db.getBatches();
    localStorage.setItem('sk_batches', JSON.stringify([...batches, batch]));
  },

  updateBatchStatus: async (id: string, status: Batch['status']): Promise<void> => {
     if (USE_REAL_BACKEND) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const { error } = await supabase
          .from('batches')
          .update({ status })
          .eq('id', id)
          .eq('user_id', userId); // Ensure user can only update their own batches
        if (error) throw error;
        return;
     }

     await new Promise(r => setTimeout(r, LATENCY / 2)); // Faster update
     const batches = await db.getBatches();
     const updated = batches.map(b => b.id === id ? { ...b, status } : b);
     localStorage.setItem('sk_batches', JSON.stringify(updated));
  },

  // --- PROFILE ---
  getProfile: async (): Promise<StoreProfile> => {
    if (USE_REAL_BACKEND) {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('store_profile')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      if (!data) return DEFAULT_STORE_PROFILE;
      
      // Convert snake_case to camelCase
      return {
        storeName: data.store_name || data.storeName || '',
        ownerName: data.owner_name || data.ownerName || '',
        email: data.email || '',
        phone: data.phone || '',
        currency: data.currency || 'GBP',
        defaultMarkdownPercent: data.default_markdown_percent || data.defaultMarkdownPercent || 50
      };
    }
    
    // Simulation
    await new Promise(r => setTimeout(r, LATENCY));
    const local = localStorage.getItem('sk_profile');
    return local ? JSON.parse(local) : DEFAULT_STORE_PROFILE;
  },

  saveProfile: async (profile: StoreProfile): Promise<void> => {
    if (USE_REAL_BACKEND) {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      // Convert camelCase to snake_case for database
      const dbProfile = {
        id: userId, // Use user_id as the id (one profile per user)
        user_id: userId,
        store_name: profile.storeName,
        owner_name: profile.ownerName,
        email: profile.email,
        phone: profile.phone,
        currency: profile.currency,
        default_markdown_percent: profile.defaultMarkdownPercent
      };
      console.log('💾 Saving to Supabase:', dbProfile);
      const { data, error } = await supabase.from('store_profile').upsert(dbProfile);
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      console.log('✅ Saved successfully! Response:', data);
      return;
    }
    
    await new Promise(r => setTimeout(r, LATENCY));
    localStorage.setItem('sk_profile', JSON.stringify(profile));
  }
};

