import React from 'react';
import { Batch, Product } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface ReportsProps {
  batches: Batch[];
  products: Product[];
}

const Reports: React.FC<ReportsProps> = ({ batches, products }) => {
  
  // Calculate Waste vs Reduced vs Active
  const stats = batches.reduce((acc, batch) => {
    acc[batch.status] = (acc[batch.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Active', value: stats['active'] || 0, color: '#22c55e' },
    { name: 'Reduced', value: stats['reduced'] || 0, color: '#f97316' },
    { name: 'Wasted', value: stats['wasted'] || 0, color: '#ef4444' },
  ];

  // Calculate Potential Savings (Items marked as reduced vs wasted cost)
  // Simplified: Assuming reduced sells for 50% and wasted is 100% loss
  const wastedBatches = batches.filter(b => b.status === 'wasted');
  const reducedBatches = batches.filter(b => b.status === 'reduced');

  const getProductPrice = (barcode: string) => products.find(p => p.barcode === barcode)?.price || 0;

  const wastedCost = wastedBatches.reduce((acc, b) => acc + (b.quantity * getProductPrice(b.barcode)), 0);
  const recoveredRevenue = reducedBatches.reduce((acc, b) => acc + (b.quantity * (getProductPrice(b.barcode) * 0.5)), 0); // Assume 50% markdown recovery

  const barData = [
    { name: 'Revenue Recovered', value: recoveredRevenue },
    { name: 'Cost of Waste', value: wastedCost },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-slate-800">Performance Reports</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <h3 className="font-bold text-slate-700 mb-4">Batch Status Distribution</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                    data={pieData} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                 >
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                 </Pie>
                 <Tooltip />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Financial Impact */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <h3 className="font-bold text-slate-700 mb-4">Financial Impact (Est.)</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                 <XAxis type="number" prefix="£" />
                 <YAxis dataKey="name" type="category" width={120} />
                 <Tooltip formatter={(value) => `£${Number(value).toFixed(2)}`} />
                 <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-4 text-sm text-slate-500">
             <p>* Assuming 50% price recovery on reduced items.</p>
           </div>
        </div>
      </div>

      {/* Actionable Insight */}
      <div className="bg-blue-900 text-white p-8 rounded-2xl">
        <h3 className="text-xl font-bold mb-2">Weekly Summary</h3>
        <p className="text-blue-100 mb-6">
           You've marked <strong>{reducedBatches.length}</strong> batches as reduced this month, potentially saving <strong>£{recoveredRevenue.toFixed(2)}</strong> in revenue that would have been waste.
        </p>
        <div className="flex gap-4">
             <div className="bg-white/10 px-4 py-2 rounded-lg">
                <span className="block text-2xl font-bold">{wastedBatches.length}</span>
                <span className="text-xs text-blue-200">Wasted Batches</span>
             </div>
             <div className="bg-white/10 px-4 py-2 rounded-lg">
                <span className="block text-2xl font-bold">{reducedBatches.length}</span>
                <span className="text-xs text-blue-200">Reduced Batches</span>
             </div>
        </div>
      </div>

    </div>
  );
};

export default Reports;

