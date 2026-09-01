import React, { useState } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { Search, Filter, Plus, ArrowDownUp, FileWarning } from 'lucide-react';

import { X } from "lucide-react";
export default function TransactionsTab({ searchQuery = "" }: { searchQuery?: string }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({ id: "", amount: "", date: "", description: "" });
  const { invoices, payments, settlements, bankCredits, latestResult } = useFinanceData();
  const [filterType, setFilterType] = useState('All');

  // Unified list
  let unified = [
    ...invoices.map(i => ({ ...i, source: 'Invoice', date: (i as any)?.invoiceDate || (i as any)?.date || '', id: (i as any)?.id || (i as any)?.invoiceId || '' })),
    ...payments.map(p => ({ ...p, source: 'Payment', date: (p as any)?.paymentDate || (p as any)?.date || '', id: (p as any)?.id || (p as any)?.paymentId || '' })),
    ...settlements.map(s => ({ ...s, source: 'Settlement', date: (s as any)?.settlementDate || (s as any)?.date || '', id: (s as any)?.id || (s as any)?.settlementId || '' })),
    ...bankCredits.map(b => ({ ...b, source: 'Bank Credit', date: (b as any)?.creditDate || (b as any)?.date || '', id: (b as any)?.id || (b as any)?.bankCreditId || '' }))
  ];

  if (filterType !== 'All') {
    unified = unified.filter(u => u.source === filterType);
  }

  if (searchQuery) {
    const query = String(searchQuery || '').toLowerCase().trim();
    if (query) {
      unified = unified.filter(u => {
        // Common fields
        if (u.source && String(u.source).toLowerCase().includes(query)) return true;
        if (u.id && String(u.id).toLowerCase().includes(query)) return true;
        if (u.date && String(u.date).toLowerCase().includes(query)) return true;
        const itemAmt = (u as any).amount ?? (u as any).netAmount ?? (u as any).grossAmount;
        if (itemAmt !== undefined && itemAmt !== null && String(itemAmt).toLowerCase().includes(query)) return true;
        
        // Source specific fields
        if (u.source === 'Invoice') {
          const inv = u as any;
          if (inv.customerName && String(inv.customerName).toLowerCase().includes(query)) return true;
          if (inv.category && String(inv.category).toLowerCase().includes(query)) return true;
        }
        if (u.source === 'Payment') {
          const pay = u as any;
          if (pay.invoiceId && String(pay.invoiceId).toLowerCase().includes(query)) return true;
          if (pay.paymentMethod && String(pay.paymentMethod).toLowerCase().includes(query)) return true;
          if (pay.status && String(pay.status).toLowerCase().includes(query)) return true;
        }
        if (u.source === 'Settlement') {
          const set = u as any;
          if (set.paymentId && String(set.paymentId).toLowerCase().includes(query)) return true;
          if (set.status && String(set.status).toLowerCase().includes(query)) return true;
        }
        if (u.source === 'Bank Credit') {
          const bc = u as any;
          if (bc.settlementId && String(bc.settlementId).toLowerCase().includes(query)) return true;
          if (bc.narration && String(bc.narration).toLowerCase().includes(query)) return true;
        }
        return false;
      });
    }
  }

  // sort by date desc
  unified.sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA;
  });

  const getStatus = (item: any) => {
    if (!latestResult) return { label: 'Not Reconciled', color: 'text-neu-muted' };
    
    // Check if it's involved in any exception
    const hasException = (latestResult.exceptions || []).some(e => 
      Array.isArray(e.sourceRecordIds) && item.id && e.sourceRecordIds.includes(item.id)
    );
    if (hasException) return { label: 'Exception', color: 'text-[#E74C3C]' };
    
    // Status mapping based on invoice
    if (item.source === 'Invoice') {
      const st = latestResult.statusesByTransactionId?.[item.id];
      if (st === 'Fully_Matched') return { label: 'Fully Matched', color: 'text-[#9EEB75]' };
      if (st === 'Partial_Match') return { label: 'Partial Match', color: 'text-[#F39C12]' };
      if (st === 'Unmatched') return { label: 'Unmatched', color: 'text-[#E74C3C]' };
    }
    
    return { label: 'Reconciled', color: 'text-[#579CEB]' }; // Assumed reconciled if part of a batch with no exceptions
  };

  return (
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
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-neu-primary">Ledger & Transactions</h2>
          <p className="text-sm text-neu-muted mt-1">Unified view of local records.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full font-bold text-sm text-neu-primary flex items-center gap-2 transition-all">
            <ArrowDownUp className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-neu-primary shadow-neu-extruded hover:-translate-y-[1px] active:translate-y-[1px] rounded-full font-bold text-sm text-neu-base flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      <div className="p-6 bg-neu-base rounded-[32px] shadow-neu-extruded">
        <div className="flex gap-2 overflow-x-auto pb-4 smooth-scroll">
          {['All', 'Invoice', 'Payment', 'Settlement', 'Bank Credit'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                filterType === type 
                ? "bg-neu-base shadow-neu-inset text-neu-accent"
                : "bg-neu-base shadow-neu-extruded-sm text-neu-muted hover:text-neu-primary"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-neu-muted/20">
                <th className="text-left py-4 px-4 font-bold text-xs uppercase tracking-widest text-neu-muted">Date</th>
                <th className="text-left py-4 px-4 font-bold text-xs uppercase tracking-widest text-neu-muted">Source</th>
                <th className="text-left py-4 px-4 font-bold text-xs uppercase tracking-widest text-neu-muted">Record ID</th>
                <th className="text-left py-4 px-4 font-bold text-xs uppercase tracking-widest text-neu-muted">Amount</th>
                <th className="text-left py-4 px-4 font-bold text-xs uppercase tracking-widest text-neu-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neu-muted/10">
              {unified.slice(0, 100).map((item, i) => {
                const status = getStatus(item);
                const amt = item.source === 'Settlement' ? (item as any).netAmount : ((item as any).amount ?? 0);
                return (
                  <tr key={`${item.id}-${i}`} className="hover:bg-neu-base hover:shadow-neu-inset transition-all cursor-pointer group">
                    <td className="py-4 px-4 text-sm font-bold text-neu-primary">{item.date}</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-neu-base shadow-neu-extruded-sm rounded-full text-xs font-bold text-neu-muted">
                        {item.source}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-neu-muted group-hover:text-neu-primary transition-colors">{item.id}</td>
                    <td className="py-4 px-4 text-sm font-bold text-neu-primary">
                      ₹{amt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {status.label === 'Exception' && <FileWarning className="w-4 h-4 text-[#E74C3C]" />}
                        <span className={`text-sm font-bold ${status.color}`}>{status.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {unified.length > 100 && (
            <p className="text-center text-xs text-neu-muted mt-4">Showing first 100 records. Use search to find specific items.</p>
          )}
          {unified.length === 0 && (
            <p className="text-center text-sm text-neu-muted my-10 font-bold">No records found matching filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}
