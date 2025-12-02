import React, { useState, useMemo } from 'react';
import { BatchWithProduct, Batch, Category, AlertSetting } from '../types';
import { Filter, AlertCircle, Trash2, Tag, CheckCircle, Sparkles, Loader2, X, Store } from 'lucide-react';

interface InventoryListProps {
  batches: BatchWithProduct[];
  onUpdateStatus: (id: string, status: Batch['status']) => void;
  alertSettings: AlertSetting[];
}

type FilterType = 'all' | 'critical' | 'warning' | 'safe' | 'expired';

const InventoryList: React.FC<InventoryListProps> = ({ batches, onUpdateStatus, alertSettings }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [search, setSearch] = useState('');
  
  // AI Markdown State
  const [markdownModalOpen, setMarkdownModalOpen] = useState(false);
  const [selectedBatchForMarkdown, setSelectedBatchForMarkdown] = useState<BatchWithProduct | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{price: number, reason: string} | null>(null);

  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      // 1. Text Search
      if (search && !batch.productName.toLowerCase().includes(search.toLowerCase())) return false;
      
      // 2. Category Filter
      if (selectedCategory !== 'All' && batch.category !== selectedCategory) return false;

      // 3. Urgency Filter
      if (activeFilter === 'all') return true;
      if (activeFilter === 'expired') return batch.daysUntilExpiry < 0;
      
      // Get settings for this batch's category to determine urgency
      const settings = alertSettings.find(s => s.category === batch.category) || alertSettings.find(s => s.category === Category.Household)!;
      
      if (activeFilter === 'critical') return batch.daysUntilExpiry >= 0 && batch.daysUntilExpiry <= settings.criticalDays;
      if (activeFilter === 'warning') return batch.daysUntilExpiry > settings.criticalDays && batch.daysUntilExpiry <= settings.warningDays;
      if (activeFilter === 'safe') return batch.daysUntilExpiry > settings.warningDays;

      return true;
    });
  }, [batches, activeFilter, selectedCategory, search, alertSettings]);

  // Sort: Expired/Critical first
  const sortedBatches = [...filteredBatches].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  const getStatusColor = (days: number) => {
    if (days < 0) return 'bg-slate-800 text-white'; // Expired
    if (days <= 3) return 'bg-red-100 text-red-700 border-red-200'; // Critical
    if (days <= 7) return 'bg-orange-100 text-orange-700 border-orange-200'; // Warning
    return 'bg-green-100 text-green-700 border-green-200'; // Safe
  };

  // --- AI Logic ---
  const openMarkdownModal = async (batch: BatchWithProduct) => {
    setSelectedBatchForMarkdown(batch);
    setMarkdownModalOpen(true);
    setAiLoading(true);
    setAiSuggestion(null);

    try {
      // Call secure API route instead of direct Gemini API
      const response = await fetch('/api/gemini-price-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: batch.productName,
          price: batch.price,
          daysUntilExpiry: batch.daysUntilExpiry,
          category: batch.category
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get price suggestion');
      }

      const result = await response.json();
      setAiSuggestion({
          price: result.suggestedPrice,
          reason: result.reasoning
      });

    } catch (error) {
        console.error(error);
        setAiSuggestion({ price: batch.price * 0.5, reason: "AI unavailable. Defaulting to 50% off." });
    } finally {
        setAiLoading(false);
    }
  };

  const applyMarkdown = () => {
      if (selectedBatchForMarkdown) {
          onUpdateStatus(selectedBatchForMarkdown.id, 'reduced');
          setMarkdownModalOpen(false);
      }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
         <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
            {['all', 'critical', 'warning', 'safe', 'expired'].map(f => (
                <button
                    key={f}
                    onClick={() => setActiveFilter(f as FilterType)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                        activeFilter === f 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    {f}
                </button>
            ))}
         </div>

         <div className="flex gap-3 w-full md:w-auto">
             <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
             >
                <option value="All">All Categories</option>
                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
             </select>
             <input 
                type="text" 
                placeholder="Search product..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 md:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
             />
         </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="p-4">Product</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Quantity</th>
                        <th className="p-4">Expiry</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {sortedBatches.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400">
                                No items match your filters.
                            </td>
                        </tr>
                    ) : (
                        sortedBatches.map(batch => (
                            <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <p className="font-bold text-slate-800">{batch.productName}</p>
                                    <p className="text-xs text-slate-400 font-mono">{batch.barcode}</p>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                        {batch.category}
                                    </span>
                                </td>
                                <td className="p-4 font-medium text-slate-700">
                                    {batch.quantity}
                                </td>
                                <td className="p-4">
                                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${getStatusColor(batch.daysUntilExpiry)}`}>
                                        <span className="font-bold">
                                            {batch.daysUntilExpiry < 0 
                                                ? `Expired ${Math.abs(batch.daysUntilExpiry)}d ago`
                                                : batch.daysUntilExpiry === 0 
                                                    ? 'Today' 
                                                    : `${batch.daysUntilExpiry} days`}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {new Date(batch.expiryDate).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button 
                                        onClick={() => openMarkdownModal(batch)}
                                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                                        title="AI Smart Price"
                                    >
                                        <Sparkles size={16} />
                                        <span className="text-xs font-bold">Reduce</span>
                                    </button>
                                    <button 
                                        onClick={() => onUpdateStatus(batch.id, 'wasted')}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Mark as Wasted"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
         </div>
      </div>

      {/* AI Markdown Modal */}
      {markdownModalOpen && selectedBatchForMarkdown && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold flex items-center gap-2">
                        <Sparkles className="text-blue-500" size={18} />
                        Smart Price Advisor
                    </h3>
                    <button onClick={() => setMarkdownModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="p-6">
                    <div className="flex justify-between mb-6">
                        <div>
                            <p className="text-sm text-slate-500">Item</p>
                            <p className="font-bold text-lg">{selectedBatchForMarkdown.productName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Current</p>
                            <p className="font-bold text-lg text-slate-400 line-through">£{selectedBatchForMarkdown.price.toFixed(2)}</p>
                        </div>
                    </div>

                    {aiLoading ? (
                        <div className="py-8 flex flex-col items-center text-slate-400">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <p className="text-sm">Analyzing market data & expiry...</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-3xl font-bold text-blue-700">£{aiSuggestion?.price.toFixed(2)}</span>
                                    <span className="text-blue-600 font-medium text-sm mb-1.5">Recommended</span>
                                </div>
                                <p className="text-sm text-blue-800 leading-relaxed">{aiSuggestion?.reason}</p>
                            </div>

                            {/* POS Warning */}
                            <div className="mb-6 flex gap-3 items-start bg-orange-50 p-3 rounded-lg border border-orange-100">
                                <Store className="text-orange-500 shrink-0" size={20} />
                                <p className="text-xs text-orange-700 font-medium leading-tight mt-0.5">
                                    Important: This app does not update your till. Please enter the new price of <strong>£{aiSuggestion?.price.toFixed(2)}</strong> in your POS system manually.
                                </p>
                            </div>
                        </>
                    )}

                    <div className="flex gap-3">
                        <button onClick={() => setMarkdownModalOpen(false)} className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl">Cancel</button>
                        <button 
                            onClick={applyMarkdown}
                            disabled={aiLoading}
                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                        >
                            Apply Reduction
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;

