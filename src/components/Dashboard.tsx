import React, { useState } from 'react';
import { BatchWithProduct, AlertSetting, Category } from '../types';
import { 
  AlertTriangle, 
  Calendar, 
  Package, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  ChevronRight,
  Coffee,
  Utensils,
  Milk,
  Wheat,
  Beef,
  Wine,
  Home,
  Search
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface DashboardProps {
  batches: BatchWithProduct[];
  alertSettings: AlertSetting[];
  onNavigate: (tab: 'dashboard' | 'intake' | 'inventory' | 'reports') => void;
}

interface BundleSuggestion {
    title: string;
    tagline: string;
}

const Dashboard: React.FC<DashboardProps> = ({ batches, alertSettings, onNavigate }) => {
  
  // --- Stats Calculation ---
  const expiringWithin3Days = batches.filter(b => b.daysUntilExpiry >= 0 && b.daysUntilExpiry <= 3);
  const expiringWithin7Days = batches.filter(b => b.daysUntilExpiry >= 0 && b.daysUntilExpiry <= 7);
  const alreadyExpired = batches.filter(b => b.daysUntilExpiry < 0);
  const potentialLoss = expiringWithin7Days.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  
  // --- View State ---
  // 'week' = 0-7 days (Immediate Action)
  // 'month' = 8-30 days (Upcoming)
  // 'future' = 31+ days (Long Term / Shelf Stable)
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'future'>('week');

  // --- Filter Data based on View Mode ---
  const currentItems = batches.filter(b => {
    if (b.status !== 'active') return false;
    if (viewMode === 'week') return b.daysUntilExpiry >= 0 && b.daysUntilExpiry <= 7;
    if (viewMode === 'month') return b.daysUntilExpiry > 7 && b.daysUntilExpiry <= 30;
    if (viewMode === 'future') return b.daysUntilExpiry > 30;
    return false;
  }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  // --- AI Suggestion State ---
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleSuggestion, setBundleSuggestion] = useState<BundleSuggestion | null>(null);

  const generateBundleIdea = async () => {
    const uniqueItems = Array.from(new Set(expiringWithin7Days.map(b => b.productName)));
    if (uniqueItems.length === 0) return;

    setBundleLoading(true);
    try {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
        const isBundle = uniqueItems.length > 1;
        const promptItems = uniqueItems.slice(0, 12).join(', ');
        
        const prompt = isBundle 
            ? `I have a convenience store. These items are expiring soon: ${promptItems}. Suggest a creative "Bundle Deal" name and a short 1-sentence marketing hook.`
            : `I have a convenience store. This item is expiring soon: ${promptItems}. Suggest a creative "Flash Sale" name and a short 1-sentence marketing hook.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        tagline: { type: Type.STRING }
                    },
                    required: ["title", "tagline"]
                }
            }
        });
        const result = JSON.parse(response.text);
        setBundleSuggestion({ title: result.title, tagline: result.tagline });
    } catch (e) {
        setBundleSuggestion({ title: "Clearance Sale", tagline: "Grab these items at a discount before they're gone!" });
    } finally {
        setBundleLoading(false);
    }
  };

  // --- Helper: Category Icons ---
  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
        case Category.Dairy: return <Milk size={16} />;
        case Category.Bakery: return <Wheat size={16} />;
        case Category.MeatFish: return <Beef size={16} />;
        case Category.Drinks: return <Coffee size={16} />;
        case Category.Alcohol: return <Wine size={16} />;
        case Category.Produce: return <Utensils size={16} />;
        case Category.Household: return <Home size={16} />;
        default: return <Package size={16} />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. Top Level Stats (Vital Signs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle size={64} className="text-red-600" />
          </div>
          <p className="text-slate-500 font-medium text-xs uppercase tracking-wider">Critical (72hrs)</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{expiringWithin3Days.length}</p>
          <p className="text-xs text-red-500 font-medium mt-1">Action needed immediately</p>
        </div>

        {/* Expired */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock size={64} className="text-slate-600" />
          </div>
          <p className="text-slate-500 font-medium text-xs uppercase tracking-wider">Expired</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{alreadyExpired.length}</p>
           <button 
             onClick={() => onNavigate('inventory')}
             className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1">
             Remove <ArrowRight size={10} />
          </button>
        </div>

        {/* Revenue Risk */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 font-medium text-xs uppercase tracking-wider">Value at Risk</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">£{potentialLoss.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">Next 7 days expiry value</p>
        </div>

        {/* AI Action Button (Quick Access) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-5 text-white flex flex-col justify-center items-start relative overflow-hidden">
            <Sparkles className="absolute top-[-10px] right-[-10px] opacity-20" size={80} />
            <h3 className="font-bold text-lg z-10">Waste Rescue</h3>
            <p className="text-blue-100 text-xs mb-3 z-10">Generate bundle ideas to clear stock.</p>
            <button 
                onClick={generateBundleIdea}
                className="bg-white text-blue-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors z-10 shadow-sm"
            >
                {bundleLoading ? 'Thinking...' : 'Suggest Deal'}
            </button>
        </div>
      </div>

      {/* 2. AI Suggestion Result (Conditional) */}
      {bundleSuggestion && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={16} className="text-indigo-600" />
                    <span className="text-indigo-600 font-bold text-sm uppercase tracking-wide">AI Suggestion</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{bundleSuggestion.title}</h3>
                <p className="text-slate-600 italic">"{bundleSuggestion.tagline}"</p>
            </div>
            <button onClick={() => setBundleSuggestion(null)} className="text-slate-400 hover:text-slate-600">
                Close
            </button>
        </div>
      )}

      {/* 3. Main Horizon View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        
        {/* Tabs Header */}
        <div className="border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between p-2 gap-4 sm:gap-0">
            <div className="flex bg-slate-50 p-1 rounded-xl mx-2 sm:mx-0 self-start sm:self-auto">
                <button 
                    onClick={() => setViewMode('week')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'week' 
                        ? 'bg-white text-red-600 shadow-sm ring-1 ring-slate-200' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    🔥 This Week
                </button>
                <button 
                    onClick={() => setViewMode('month')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'month' 
                        ? 'bg-white text-orange-600 shadow-sm ring-1 ring-slate-200' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    ⚠️ Next 4 Weeks
                </button>
                <button 
                    onClick={() => setViewMode('future')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'future' 
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    📅 Months Ahead
                </button>
            </div>
            
            {/* Context Hint */}
            <div className="px-4 text-xs text-slate-400 hidden sm:block">
                {viewMode === 'week' && "Focus: Fresh Food & Daily Perishables"}
                {viewMode === 'month' && "Focus: Yogurt, Bacon, Bread & Rotation"}
                {viewMode === 'future' && "Focus: Cans, Drinks & Dry Goods"}
            </div>
        </div>

        {/* Content List */}
        <div className="divide-y divide-slate-50">
            {currentItems.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center h-64">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        viewMode === 'week' ? 'bg-green-50 text-green-500' : 'bg-slate-50 text-slate-300'
                    }`}>
                        {viewMode === 'week' ? <Sparkles size={32} /> : <Search size={32} />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No items found</h3>
                    <p className="text-slate-400 max-w-xs mx-auto mt-1">
                        {viewMode === 'week' 
                        ? "Nothing expiring in the next 7 days. Your stock is healthy!" 
                        : viewMode === 'month' 
                            ? "Nothing expiring between 7 and 30 days." 
                            : "No long-term stock tracked."}
                    </p>
                    <button 
                        onClick={() => onNavigate('intake')}
                        className="mt-6 text-blue-600 font-medium text-sm hover:underline"
                    >
                        Add new stock
                    </button>
                </div>
            ) : (
                currentItems.map(batch => (
                    <div key={batch.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-4">
                            {/* Icon Box */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                viewMode === 'week' 
                                    ? batch.daysUntilExpiry <= 2 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                    : viewMode === 'month'
                                        ? 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                                {getCategoryIcon(batch.category)}
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800">{batch.productName}</h4>
                                <div className="flex items-center gap-2 text-xs mt-1">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                                        {batch.category}
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-500">{batch.quantity} units</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-1 ${
                                batch.daysUntilExpiry <= 3 
                                    ? 'bg-red-500 text-white shadow-red-200 shadow-sm'
                                    : batch.daysUntilExpiry <= 7
                                        ? 'bg-orange-500 text-white shadow-orange-200 shadow-sm'
                                        : viewMode === 'month'
                                            ? 'bg-slate-800 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600'
                            }`}>
                                <Clock size={12} />
                                {batch.daysUntilExpiry === 0 
                                    ? 'Today' 
                                    : batch.daysUntilExpiry === 1 
                                        ? 'Tomorrow' 
                                        : `${batch.daysUntilExpiry} days`}
                            </div>
                            <p className="text-xs text-slate-400">
                                {new Date(batch.expiryDate).toLocaleDateString('en-UK', { day: 'numeric', month: 'short', year: 'numeric'})}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer Action */}
        {currentItems.length > 0 && (
            <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                <button 
                    onClick={() => onNavigate('inventory')}
                    className="text-sm text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-1"
                >
                    View Full Inventory <ChevronRight size={14} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

