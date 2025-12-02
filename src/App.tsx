
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ScanLine, List, FileBarChart, Menu, X, Bell, Loader2, Settings, LogOut } from 'lucide-react';
import { DEFAULT_ALERT_SETTINGS, DEFAULT_STORE_PROFILE } from './constants';
import { Batch, Product, BatchWithProduct, Category, AlertSetting, StoreProfile as StoreProfileType } from './types';
import { db } from './services/db';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';

import Dashboard from './components/Dashboard';
import StockIntake from './components/StockIntake';
import InventoryList from './components/InventoryList';
import Reports from './components/Reports';
import StoreProfile from './components/StoreProfile';

// --- Helper Functions ---
const getDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  
  // --- ALL HOOKS MUST BE CALLED FIRST (before any conditional returns) ---
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'intake' | 'inventory' | 'reports' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Global loading state
  
  // --- Data State ---
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [storeProfile, setStoreProfile] = useState<StoreProfileType>(DEFAULT_STORE_PROFILE);
  const [alertSettings] = useState<AlertSetting[]>(DEFAULT_ALERT_SETTINGS);

  // --- Initial Data Load (only when user is logged in) ---
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const initData = async () => {
      setIsLoading(true);
      try {
        const [fetchedBatches, fetchedProducts, fetchedProfile] = await Promise.all([
          db.getBatches(),
          db.getProducts(),
          db.getProfile()
        ]);
        setBatches(fetchedBatches);
        setProducts(fetchedProducts);
        setStoreProfile(fetchedProfile);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [user]);

  // --- Computed Data ---
  const enrichedBatches: BatchWithProduct[] = useMemo(() => {
    if (!user) return [];
    return batches.map(batch => {
      const product = products.find(p => p.barcode === batch.barcode);
      return {
        ...batch,
        productName: product ? product.name : 'Unknown Product',
        category: product ? product.category : Category.Household,
        price: product ? product.price : 0,
        daysUntilExpiry: getDaysUntilExpiry(batch.expiryDate),
      };
    }).filter(b => b.status === 'active');
  }, [batches, products, user]);

  // --- NOW we can do conditional returns (after all hooks) ---
  // Show login if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
        <p className="font-medium text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // --- Handlers (Async) ---

  const handleAddBatch = async (newBatch: Batch, newProduct?: Product) => {
    // Optimistic UI Update (Optional, but safe here)
    // For now we will wait for server response to be safe
    try {
        if (newProduct) {
            await db.saveProduct(newProduct);
            setProducts(prev => [...prev, newProduct]);
        }
        await db.addBatch(newBatch);
        setBatches(prev => [...prev, newBatch]);
        setActiveTab('inventory');
    } catch (e) {
        alert("Failed to save stock. Please try again.");
    }
  };

  const handleUpdateBatchStatus = async (id: string, status: Batch['status']) => {
    // Optimistic Update: Update UI immediately, revert if fail
    const previousBatches = [...batches];
    setBatches(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    
    try {
        await db.updateBatchStatus(id, status);
    } catch (e) {
        console.error("Sync failed");
        setBatches(previousBatches); // Revert
        alert("Could not update status. Check connection.");
    }
  };

  const handleUpdateProfile = async (newProfile: StoreProfileType) => {
    try {
      setStoreProfile(newProfile); // Immediate UI update
      await db.saveProfile(newProfile); // Background save
      console.log('✅ Store profile saved to Supabase successfully!', newProfile);
    } catch (error) {
      console.error('❌ Failed to save store profile to Supabase:', error);
      alert('Failed to save store profile. Check console for details.');
      // Optionally revert the UI update on error
    }
  };

  // Helper for initials
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() : 'SK';

  // --- Navigation Config ---
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'intake', label: 'Stock Intake', icon: ScanLine },
    { id: 'inventory', label: 'Inventory', icon: List },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
        <p className="font-medium text-slate-600">Connecting to ShopKeep...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-screen sticky top-0">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">S</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">ShopKeep</h1>
              <p className="text-xs text-slate-400">Expiry Manager</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all ${
              activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-600">
              {getInitials(storeProfile.ownerName)}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-sm font-medium text-slate-200 truncate">{storeProfile.storeName}</p>
              <p className="text-xs truncate">Settings</p>
            </div>
            <Settings size={16} className="hover:text-white" />
          </button>
          <button 
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-red-400"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-auto">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-2">
             <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center font-bold">S</div>
             <span className="font-bold">ShopKeep</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-10 bg-slate-900/95 pt-20 px-6 space-y-4 flex flex-col">
             {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-lg transition-colors ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={24} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <div className="mt-auto pb-8 border-t border-slate-800 pt-4 space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-lg text-slate-300 hover:bg-slate-800"
                >
                  <Settings size={24} />
                  <span className="font-medium">Store Profile</span>
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-lg text-red-400 hover:bg-slate-800"
                >
                  <LogOut size={24} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          
          {/* Top Bar (Desktop) */}
          <div className="hidden md:flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'settings' ? 'Store Profile' : navItems.find(n => n.id === activeTab)?.label}
            </h2>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
                <Bell size={20} />
                {enrichedBatches.some(b => b.daysUntilExpiry <= 2) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('intake')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <ScanLine size={18} />
                <span>Scan New Stock</span>
              </button>
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="animate-in fade-in duration-300">
            {activeTab === 'dashboard' && (
              <Dashboard 
                batches={enrichedBatches} 
                alertSettings={alertSettings} 
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === 'intake' && (
              <StockIntake 
                products={products} 
                onAddBatch={handleAddBatch} 
              />
            )}
            {activeTab === 'inventory' && (
              <InventoryList 
                batches={enrichedBatches} 
                onUpdateStatus={handleUpdateBatchStatus}
                alertSettings={alertSettings}
              />
            )}
            {activeTab === 'reports' && (
              <Reports batches={batches} products={products} />
            )}
            {activeTab === 'settings' && (
              <StoreProfile profile={storeProfile} onSave={handleUpdateProfile} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

