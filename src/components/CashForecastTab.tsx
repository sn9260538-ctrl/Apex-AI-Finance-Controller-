import React from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { TrendingUp, AlertTriangle, ArrowRight, ShieldCheck, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import StaleWarningBanner from './StaleWarningBanner';

export default function CashForecastTab() {
  const { latestResult, dataMode, lastRunTimestamp, isReconciliationStale } = useFinanceData();

  if (!latestResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-neu-base shadow-neu-extruded rounded-full flex items-center justify-center mb-2">
          <TrendingUp className="w-8 h-8 text-neu-muted" />
        </div>
        <h2 className="text-2xl font-display font-bold text-neu-primary">No Forecast Data Available</h2>
        <p className="text-neu-muted max-w-md text-sm">
          No completed reconciliation run yet. Load demo data or upload CSV files, then run the local reconciliation engine.
        </p>
      </div>
    );
  }

  const { amountSummary } = latestResult;
  const confirmedBankCash = amountSummary.bankCreditedValue;
  const pendingSettlement = amountSummary.pendingSettlementValue;
  const uncreditedBankValue = amountSummary.uncreditedBankValue;
  const exceptionExposure = amountSummary.totalExceptionExposure;
  const projected7DayCash = confirmedBankCash + pendingSettlement + uncreditedBankValue;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-neu-primary">Cash Position & 7-Day Forecast</h2>
          <p className="text-sm text-neu-muted mt-1">
            Real-time books reconciliation and cash position modeling derived strictly from verified statement ledgers.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isReconciliationStale && (
            <span className="px-3 py-1 bg-[#F39C12]/20 text-[#D68910] text-xs font-bold rounded-full border border-[#F39C12]/30">
              Previous reconciliation result — rerun required
            </span>
          )}
          <div className="px-4 py-2 bg-neu-base shadow-neu-extruded-sm rounded-full text-xs font-bold text-neu-primary flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isReconciliationStale ? 'bg-[#F39C12]' : 'bg-neu-accent'} animate-pulse`}></div>
            {dataMode} • Reconciled {new Date(lastRunTimestamp!).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        </div>
      </div>

      <StaleWarningBanner />

      {/* 5-Metric Cash & Liquidity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Confirmed Bank Cash */}
        <div className="p-5 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-neu-muted uppercase tracking-wider">1. Confirmed Cash</span>
              <span className="w-2 h-2 rounded-full bg-[#9EEB75]"></span>
            </div>
            <p className="text-2xl font-display font-extrabold text-neu-primary">
              ₹{confirmedBankCash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-[#0F2F28] bg-[#9EEB75]/20 px-2 py-0.5 rounded-full font-bold mt-3 text-center">
            Bank Verified
          </p>
        </div>

        {/* 2. Pending Settlement Value */}
        <div className="p-5 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-neu-muted uppercase tracking-wider">2. Pending Settlement</span>
              <span className="w-2 h-2 rounded-full bg-neu-accent"></span>
            </div>
            <p className="text-2xl font-display font-extrabold text-neu-accent">
              ₹{pendingSettlement.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-neu-muted mt-3 pt-2 border-t border-neu-muted/10">
            Gateway payout queue
          </p>
        </div>

        {/* 3. Uncredited Bank Value */}
        <div className="p-5 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-neu-muted uppercase tracking-wider">3. Uncredited Value</span>
              <span className="w-2 h-2 rounded-full bg-[#F39C12]"></span>
            </div>
            <p className="text-2xl font-display font-extrabold text-[#F39C12]">
              ₹{uncreditedBankValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-neu-muted mt-3 pt-2 border-t border-neu-muted/10">
            Awaiting bank entry
          </p>
        </div>

        {/* 4. Exception Exposure */}
        <div className="p-5 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-neu-muted uppercase tracking-wider">4. Exception Risk</span>
              <span className="w-2 h-2 rounded-full bg-[#E74C3C]"></span>
            </div>
            <p className="text-2xl font-display font-extrabold text-[#E74C3C]">
              ₹{exceptionExposure.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-[#E74C3C] bg-[#E74C3C]/10 px-2 py-0.5 rounded-full font-bold mt-3 text-center">
            Review Required
          </p>
        </div>

        {/* 5. Projected 7-Day Cash */}
        <div className="p-5 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col justify-between relative overflow-hidden border border-neu-accent/30">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-neu-accent uppercase tracking-wider">5. Projected 7-Day</span>
              <TrendingUp className="w-4 h-4 text-neu-accent" />
            </div>
            <p className="text-2xl font-display font-extrabold text-neu-primary">
              ₹{projected7DayCash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-neu-muted mt-3 pt-2 border-t border-neu-muted/10">
            Combined liquidity outlook
          </p>
        </div>
      </div>

      {/* Assumptions & Controller Disclosures */}
      <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-inset space-y-4">
        <h3 className="text-lg font-bold text-neu-primary mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-neu-accent" />
          Treasury Assumptions & Disclosures
        </h3>
        <ul className="space-y-4">
          <li className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-neu-base shadow-neu-extruded-sm flex items-center justify-center shrink-0 mt-0.5">
              <ArrowRight className="w-4 h-4 text-neu-accent" />
            </div>
            <div>
              <p className="text-sm font-bold text-neu-primary">
                Forecast includes expected pending settlements of ₹{pendingSettlement.toLocaleString('en-IN', { maximumFractionDigits: 2 })}.
              </p>
              <p className="text-xs text-neu-muted mt-0.5">
                These values represent captured customer payments currently processing in the gateway pipeline and are not yet credited in bank statements.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-neu-base shadow-neu-extruded-sm flex items-center justify-center shrink-0 mt-0.5">
              <ArrowRight className="w-4 h-4 text-[#F39C12]" />
            </div>
            <div>
              <p className="text-sm font-bold text-neu-primary">
                Forecast includes uncredited settlement value of ₹{uncreditedBankValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} as an assumption.
              </p>
              <p className="text-xs text-neu-muted mt-0.5">
                Settlements have been finalized by the gateway provider but the corresponding UTR statement credit has not yet been reconciled in destination bank accounts.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-neu-base shadow-neu-extruded-sm flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-[#0F2F28]" />
            </div>
            <div>
              <p className="text-sm font-bold text-neu-primary">
                Strict Liquidity Isolation Protocol
              </p>
              <p className="text-xs text-neu-muted mt-0.5">
                Do not treat pending settlements or uncredited settlement value as confirmed cash. Only ₹{confirmedBankCash.toLocaleString('en-IN', { maximumFractionDigits: 2 })} is cleared and available for immediate disbursement.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
