const fs = require('fs');
let content = fs.readFileSync('src/components/BudgetsTab.tsx', 'utf8');

const importTarget = `import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';`;
const newImports = `import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';\nimport { X } from 'lucide-react';`;
content = content.replace(importTarget, newImports);

const compStartTarget = `export default function BudgetsTab() {\n  const { invoices } = useFinanceData();\n  const [activeSegment, setActiveSegment] = useState<number | null>(null);`;
const compStartReplacement = `export default function BudgetsTab() {\n  const { invoices } = useFinanceData();\n  const [activeSegment, setActiveSegment] = useState<number | null>(null);\n  const [showBudgetModal, setShowBudgetModal] = useState(false);\n  const [budgetLimit, setBudgetLimit] = useState(1000000);\n  const [tempBudget, setTempBudget] = useState(budgetLimit.toString());`;
content = content.replace(compStartTarget, compStartReplacement);

// Calculate total budget percentage? It's currently calculating against totalExpense
// Let's modify the total tracking
// Wait, currently it uses `totalExpense`.
const target2 = `  return (
    <div className="space-y-8 animate-fade-in">`;
const replacement2 = `  return (
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
      )}`;
content = content.replace(target2, replacement2);

const targetBtn = `<button className="px-6 py-3 bg-neu-primary shadow-neu-extruded hover:-translate-y-[1px] active:translate-y-[1px] rounded-full font-bold text-sm text-neu-base flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" />
          Set Budget Limit
        </button>`;
const replacementBtn = `<button onClick={() => { setTempBudget(budgetLimit.toString()); setShowBudgetModal(true); }} className="px-6 py-3 bg-neu-primary shadow-neu-extruded hover:-translate-y-[1px] active:translate-y-[1px] rounded-full font-bold text-sm text-neu-base flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" />
          Set Budget Limit
        </button>`;
content = content.replace(targetBtn, replacementBtn);

// Replace budget usage total display
// Let's modify the totalSpend display to also show budget
const targetTotal = `<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-neu-muted uppercase tracking-widest font-bold mb-1">Total Spend</span>
              <span className="text-3xl font-display font-extrabold text-neu-primary">
                ₹{totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0, notation: "compact" })}
              </span>
            </div>`;
const replacementTotal = `<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-neu-muted uppercase tracking-widest font-bold mb-1">Total Spend / Budget</span>
              <span className="text-2xl font-display font-extrabold text-neu-primary">
                ₹{totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0, notation: "compact" })} / {budgetLimit > 0 ? (budgetLimit/1000).toFixed(0) + 'k' : '∞'}
              </span>
            </div>`;
content = content.replace(targetTotal, replacementTotal);

// Also modify the progress bars to be based on the totalExpense instead of totalExpense, wait, right now they're percentage of totalExpense, maybe it's fine. Wait, let's make it percentage of budget if budget > 0.
const targetProgress = `width: \`\${(item.value / totalExpense) * 100}%\`,`;
const replacementProgress = `width: \`\${Math.min((item.value / (budgetLimit || totalExpense)) * 100, 100)}%\`,`;
content = content.replace(targetProgress, replacementProgress);

const targetProgressText = `{((item.value / totalExpense) * 100).toFixed(1)}% of total`;
const replacementProgressText = `{((item.value / (budgetLimit || totalExpense)) * 100).toFixed(1)}% of budget`;
content = content.replace(targetProgressText, replacementProgressText);

fs.writeFileSync('src/components/BudgetsTab.tsx', content);
console.log('Successfully patched BudgetsTab.');

