
import React, { useState, useEffect } from 'react';
import { StoreProfile as StoreProfileType } from '../types';
import { Store, User, Mail, Phone, Save, Percent, Database, Server, ShieldCheck, CloudLightning } from 'lucide-react';

interface StoreProfileProps {
  profile: StoreProfileType;
  onSave: (profile: StoreProfileType) => void;
}

const StoreProfile: React.FC<StoreProfileProps> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState<StoreProfileType>(profile);
  const [isSaved, setIsSaved] = useState(false);

  // Update local state if props change (e.g. after fetch)
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (field: keyof StoreProfileType, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); 
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'SK';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-200">
          {getInitials(formData.storeName || "S K")}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{formData.storeName || "Store Name"}</h2>
          <p className="text-slate-500 flex items-center gap-2">
            <User size={16} /> {formData.ownerName || "Owner Name"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Details Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Store size={20} className="text-slate-400" />
            Store Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Store Name</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Owner / Manager Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Percent size={20} className="text-slate-400" />
            Operational Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Default Markdown %</label>
              <div className="relative">
                 <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.defaultMarkdownPercent}
                  onChange={(e) => handleChange('defaultMarkdownPercent', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</div>
              </div>
              <p className="text-xs text-slate-400 mt-1">AI will still suggest prices, but this is your fallback.</p>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                 <select 
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed"
                 >
                    <option>GBP (£) - United Kingdom</option>
                 </select>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
           <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">System Architecture</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                 <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Database size={16} />
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 font-medium">Database Layer</p>
                    <p className="text-sm font-bold text-slate-700">Service Adapter</p>
                 </div>
              </div>
               <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                 <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                    <CloudLightning size={16} />
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 font-medium">Connection</p>
                    <p className="text-sm font-bold text-slate-700">Simulated (Mock)</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                 <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck size={16} />
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 font-medium">Version</p>
                    <p className="text-sm font-bold text-slate-700">v1.0.0 (Async)</p>
                 </div>
              </div>
           </div>
           <p className="text-xs text-slate-400 mt-4 leading-relaxed">
             <strong>Backend Status:</strong> The application is now using a robust Data Service Layer. 
             Currently, it is running in "Simulated Mode" (persisting to local storage with fake network delay) to mimic a real production environment. 
             To go live, update <code>services/db.ts</code> to switch the <code>USE_REAL_BACKEND</code> flag.
           </p>
        </div>

        <div className="flex items-center justify-end gap-4">
           {isSaved && (
             <span className="text-green-600 font-medium text-sm animate-in fade-in slide-in-from-right-4">
               Profile Saved Successfully!
             </span>
           )}
           <button
            type="submit"
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
           >
             <Save size={18} />
             Save Changes
           </button>
        </div>

      </form>
    </div>
  );
};

export default StoreProfile;

