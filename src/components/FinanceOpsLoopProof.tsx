import React from 'react';
import { ReconciliationResult } from '../types';
import { Layers, ArrowDown, ArrowRight, ShieldCheck, CheckCircle2, Clock, AlertTriangle, IndianRupee } from 'lucide-react';

interface FinanceOpsLoopProofProps {
  result: ReconciliationResult;
}

export default function FinanceOpsLoopProof({ result }: FinanceOpsLoopProofProps) {
  const { amountSummary, inputRowCounts, fullyMatched, batchSize, exceptions } = result;

  const invoicesLoaded = inputRowCounts.invoices;
  const paymentsLinked = inputRowCounts.payments;
  const settlementsLinked = inputRowCounts.settlements;
  const bankCreditsLinked = inputRowCounts.bankCredits;

  const stageCounts = [
    { label: 'Invoices Loaded', count: invoicesLoaded, desc: 'Primary billing ledgers ingested', color: 'text-neu-primary' },
    { label: 'Payments Linked', count: paymentsLinked, desc: 'Gateway capture records mapped', color: 'text-neu-primary' },
    { label: 'Settlements Linked', count: settlementsLinked, desc: 'Merchant payouts & MDR deducted', color: 'text-neu-primary' },
    { label: 'Bank Credits Linked', count: bankCreditsLinked, desc: 'Destination bank credits confirmed', color: 'text-neu-primary' },
    { label: 'Fully Reconciled', count: fullyMatched, desc: '4-way deterministic parity closed', color: 'text-[#0F2F28] bg-[#9EEB75] text-black font-extrabold' }
  ];

  const valueFlow = [
    { label: 'Invoice Value', value: amountSummary.grossInvoiceValue, sub: 'Gross Billed' },
    { label: 'Payment Value', value: amountSummary.grossPaymentValue, sub: 'Gateway Captured' },
    { label: 'Expected Settlement Value', value: amountSummary.expectedSettlementValue, sub: 'Net of MDR/GST/Refunds' },
    { label: 'Actual Settlement Value', value: amountSummary.actualSettlementValue, sub: 'Gateway Payout Net' },
    { label: 'Confirmed Bank Credit', value: amountSummary.bankCreditedValue, sub: 'Cleared in Bank' }
  ];

  return (
    <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-extruded space-y-8 animate-fade-in border border-neu-muted/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-neu-muted/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-neu-base shadow-neu-inset text-neu-primary rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-neu-accent" />
              Four-Stage Closed Loop
            </span>
          </div>
          <h3 className="text-xl font-display font-bold text-neu-primary">Finance-Ops Loop Proof</h3>
          <p className="text-xs text-neu-muted mt-1">
            Deterministic stage-by-stage audit trail validating the full life cycle from invoice generation to bank credit.
          </p>
        </div>

        <div className="px-4 py-2 bg-neu-base shadow-neu-inset rounded-2xl flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold text-neu-muted uppercase">Closed Loop Efficiency</p>
            <p className="text-base font-display font-extrabold text-neu-primary">
              {batchSize > 0 ? ((fullyMatched / batchSize) * 100).toFixed(1) : 0}% Fully Closed
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#9EEB75] flex items-center justify-center text-[#0F2F28] font-bold shadow-neu-extruded-sm">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 1. Stage Counts Flow */}
      <div>
        <p className="text-xs font-bold text-neu-muted uppercase tracking-wider mb-4">1. Stage Record Transition Counts</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {stageCounts.map((stage, idx) => (
            <div 
              key={stage.label} 
              className={`p-4 rounded-2xl shadow-neu-extruded flex flex-col justify-between transition-all relative ${
                idx === stageCounts.length - 1 ? 'bg-[#9EEB75]/20 border border-[#9EEB75]/50' : 'bg-neu-base'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-neu-muted mb-2">
                  <span>Stage 0{idx + 1}</span>
                  {idx < stageCounts.length - 1 ? (
                    <ArrowRight className="w-3.5 h-3.5 text-neu-muted hidden md:block" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-[#0F2F28]" />
                  )}
                </div>
                <p className="text-xs font-bold text-neu-primary mb-1">{stage.label}</p>
                <p className="text-2xl font-display font-extrabold text-neu-primary">
                  {stage.count} <span className="text-xs font-medium text-neu-muted">records</span>
                </p>
              </div>
              <p className="text-[11px] text-neu-muted mt-2 pt-2 border-t border-neu-muted/10">{stage.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Value Flow Cascade */}
      <div>
        <p className="text-xs font-bold text-neu-muted uppercase tracking-wider mb-4">2. Financial Value Flow Cascade</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {valueFlow.map((flow, i) => (
            <div key={flow.label} className="p-4 bg-neu-base rounded-2xl shadow-neu-inset flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold text-neu-muted uppercase tracking-wider mb-1">{flow.label}</p>
                <p className="text-lg font-display font-extrabold text-neu-primary">
                  ₹{flow.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-neu-muted/10 text-[11px] text-neu-muted">
                <span>{flow.sub}</span>
                {i < valueFlow.length - 1 && <span className="text-neu-accent font-bold">→</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Variance & Exposure Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-neu-muted/15">
        <div className="p-5 bg-neu-base rounded-2xl shadow-neu-extruded flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neu-base shadow-neu-inset flex items-center justify-center shrink-0 text-[#F39C12]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-neu-muted">Pending Settlement Value</p>
            <p className="text-xl font-display font-extrabold text-neu-primary mt-0.5">
              ₹{amountSummary.pendingSettlementValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-neu-muted mt-0.5">Payments in gateway queue awaiting payout</p>
          </div>
        </div>

        <div className="p-5 bg-neu-base rounded-2xl shadow-neu-extruded flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neu-base shadow-neu-inset flex items-center justify-center shrink-0 text-[#E74C3C]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-neu-muted">Uncredited Bank Value</p>
            <p className="text-xl font-display font-extrabold text-neu-primary mt-0.5">
              ₹{amountSummary.uncreditedBankValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-neu-muted mt-0.5">Settlements not yet cleared in bank ledger</p>
          </div>
        </div>

        <div className="p-5 bg-neu-base rounded-2xl shadow-neu-extruded flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neu-base shadow-neu-inset flex items-center justify-center shrink-0 text-neu-accent">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-neu-muted">Total Exception Exposure</p>
            <p className="text-xl font-display font-extrabold text-[#E74C3C] mt-0.5">
              ₹{amountSummary.totalExceptionExposure.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-neu-muted mt-0.5">Monetary sum tied to active exceptions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
