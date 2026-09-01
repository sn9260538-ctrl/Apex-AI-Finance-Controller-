import React, { useState } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { X } from 'lucide-react';
import { PieChart as PieChartIcon, Plus } from 'lucide-react';

export default function BudgetsTab() {
  const { invoices } = useFinanceData();
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(1000000);
  const [tempBudget, setTempBudget] = useState(budgetLimit.toString());

  // Group invoices by category (expense-type)
  const categoryMap = new Map<string, number>();
  let totalExpense = 0;
  
  invoices.forEach(inv => {
    // Treat all invoices as expenses for the budget view, or just categorise them
    const cat = inv.category || 'Uncategorised';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + (inv.amount || 0));
    totalExpense += (inv.amount || 0);
  });

  const rawData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  rawData.sort((a, b) => b.value - a.value);

  const colors = ['#9EEB75', '#F39C12', '#3498DB', '#9B59B6', '#E74C3C', '#1ABC9C', '#95A5A6'];

  const data = rawData.map((d, i) => ({
    ...d,
    color: colors[i % colors.length]
  }));

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-neu-base shadow-neu-extruded rounded-full flex items-center justify-center mb-6">
          <PieChartIcon className="w-8 h-8 text-neu-muted" />
        </div>
        <h2 className="text-2xl font-display font-bold text-neu-primary mb-2">No Budget Data</h2>
        <p className="text-neu-muted max-w-md">No categorized invoices found in the local transaction data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 bg-neu-primary/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neu-base p-8 rounded-[32px] shadow-neu-extruded w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-extrabold text-neu-primary">Set Budget Limit</h3>
              <button onClick={() => setShowBudgetModal(false)} className="p-2 rounded-full bg-neu-base shadow-neu-extruded hover:shadow-neu-inset text-neu-muted transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neu-muted uppercase tracking-widest mb-2">Total Budget (₹)</label>
                <input 
                  type="number" 
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-neu-base shadow-neu-inset text-sm font-bold text-neu-primary focus:outline-none focus:ring-2 focus:ring-neu-accent"
                />
              </div>
              <button 
                onClick={() => { setBudgetLimit(Number(tempBudget)); setShowBudgetModal(false); }}
                className="w-full py-4 bg-neu-primary rounded-2xl font-bold text-neu-base shadow-neu-extruded-sm hover:-translate-y-1 transition-all"
              >
                Save Limit
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-neu-primary">Budgets & Categories</h2>
          <p className="text-sm text-neu-muted mt-1">Based on local transaction data (invoices).</p>
        </div>
        <button onClick={() => { setTempBudget(budgetLimit.toString()); setShowBudgetModal(true); }} className="px-6 py-3 bg-neu-primary shadow-neu-extruded hover:-translate-y-[1px] active:translate-y-[1px] rounded-full font-bold text-sm text-neu-base flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" />
          Set Budget Limit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-extruded flex flex-col items-center justify-center">
          <div className="w-full h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveSegment(index)}
                  onMouseLeave={() => setActiveSegment(null)}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="transition-all duration-300 outline-none"
                      style={{
                        filter: activeSegment === index || activeSegment === null ? 'none' : 'grayscale(80%) opacity(50%)',
                        transform: activeSegment === index ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#F1F5F9', borderRadius: '16px', border: 'none', boxShadow: '8px 8px 16px #D9E2EC, -8px -8px 16px #FFFFFF', padding: '12px 20px' }}
                  itemStyle={{ color: '#1E293B', fontWeight: 'bold' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Spend']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-neu-muted uppercase tracking-widest font-bold mb-1">Total Spend / Budget</span>
              <span className="text-2xl font-display font-extrabold text-neu-primary">
                ₹{totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0, notation: "compact" })} / {budgetLimit > 0 ? (budgetLimit/1000).toFixed(0) + 'k' : '∞'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => (
            <div 
              key={item.name} 
              className={`p-5 rounded-[24px] transition-all duration-300 cursor-pointer ${
                activeSegment === index || activeSegment === null
                  ? 'bg-neu-base shadow-neu-extruded-sm hover:shadow-neu-inset'
                  : 'bg-neu-base/50 shadow-none opacity-60'
              }`}
              onMouseEnter={() => setActiveSegment(index)}
              onMouseLeave={() => setActiveSegment(null)}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shadow-neu-inset" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-neu-primary">{item.name}</span>
                </div>
                <span className="font-bold text-neu-primary">
                  ₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              
              <div className="w-full h-3 bg-neu-base shadow-neu-inset rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${Math.min((item.value / (budgetLimit || totalExpense)) * 100, 100)}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-bold text-neu-muted">
                  {((item.value / (budgetLimit || totalExpense)) * 100).toFixed(1)}% of budget
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
