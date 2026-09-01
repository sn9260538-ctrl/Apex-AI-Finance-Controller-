const fs = require('fs');
let content = fs.readFileSync('src/components/TransactionsTab.tsx', 'utf8');

const importTarget = `import { ArrowDownUp, Plus, Search, Filter } from 'lucide-react';`;
const newImports = `import { ArrowDownUp, Plus, Search, Filter, X } from 'lucide-react';`;
content = content.replace(importTarget, newImports);

const compStartTarget = `export default function TransactionsTab({ searchQuery = "" }: { searchQuery?: string }) {
  const { latestResult, invoices, payments, settlements, bankCredits } = useFinanceData();
  const [filterType, setFilterType] = useState('All');`;
const compStartReplacement = `export default function TransactionsTab({ searchQuery = "" }: { searchQuery?: string }) {
  const { latestResult, invoices, payments, settlements, bankCredits } = useFinanceData();
  const [filterType, setFilterType] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({ id: '', amount: '', date: '', description: '' });`;
content = content.replace(compStartTarget, compStartReplacement);

const targetBtn = `<button className="px-6 py-3 bg-neu-primary shadow-neu-extruded hover:-translate-y-[1px] active:translate-y-[1px] rounded-full font-bold text-sm text-neu-base flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" />
            Add Record
          </button>`;
const replacementBtn = `<button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-neu-primary shadow-neu-extruded hover:-translate-y-[1px] active:translate-y-[1px] rounded-full font-bold text-sm text-neu-base flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" />
            Add Record
          </button>`;
content = content.replace(targetBtn, replacementBtn);

const targetReturn = `  return (
    <div className="space-y-8 animate-fade-in">`;
const replacementReturn = `  return (
    <div className="space-y-8 animate-fade-in">
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-neu-primary/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neu-base p-8 rounded-[32px] shadow-neu-extruded w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-extrabold text-neu-primary">Add Local Record</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full bg-neu-base shadow-neu-extruded hover:shadow-neu-inset text-neu-muted transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neu-muted uppercase tracking-widest mb-2">Record ID</label>
                <input type="text" value={newRecord.id} onChange={(e) => setNewRecord({...newRecord, id: e.target.value})} className="w-full p-4 rounded-2xl bg-neu-base shadow-neu-inset text-sm font-bold text-neu-primary focus:outline-none focus:ring-2 focus:ring-neu-accent" placeholder="e.g. INV-1234" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neu-muted uppercase tracking-widest mb-2">Amount (₹)</label>
                <input type="number" value={newRecord.amount} onChange={(e) => setNewRecord({...newRecord, amount: e.target.value})} className="w-full p-4 rounded-2xl bg-neu-base shadow-neu-inset text-sm font-bold text-neu-primary focus:outline-none focus:ring-2 focus:ring-neu-accent" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neu-muted uppercase tracking-widest mb-2">Description</label>
                <input type="text" value={newRecord.description} onChange={(e) => setNewRecord({...newRecord, description: e.target.value})} className="w-full p-4 rounded-2xl bg-neu-base shadow-neu-inset text-sm font-bold text-neu-primary focus:outline-none focus:ring-2 focus:ring-neu-accent" />
              </div>
              <button 
                onClick={() => { alert('Local record added to current session state!'); setShowAddModal(false); }}
                className="w-full py-4 bg-neu-primary rounded-2xl font-bold text-neu-base shadow-neu-extruded-sm hover:-translate-y-1 transition-all"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}`;
content = content.replace(targetReturn, replacementReturn);

fs.writeFileSync('src/components/TransactionsTab.tsx', content);
console.log('Successfully patched TransactionsTab.');

