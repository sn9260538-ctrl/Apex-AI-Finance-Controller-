import React from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
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
  const closingCash = amountSummary.bankCreditedValue;
  const projectedEnding = closingCash + amountSummary.pendingSettlementValue + amountSummary.uncreditedBankValue;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-neu-primary">Cash & Forecast</h2>
          <p className="text-sm text-neu-muted mt-1">Projected liquidity based on latest reconciliation. Forecast includes expected pending settlements of ₹{amountSummary.pendingSettlementValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col">
          <p className="text-sm font-bold text-neu-muted mb-2">Confirmed Bank Cash</p>
          <p className="text-3xl font-display font-extrabold text-neu-primary mb-1">
            ₹{closingCash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-neu-muted">Available liquidity</p>
        </div>

        <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col">
          <p className="text-sm font-bold text-neu-muted mb-2">Pending Settlements</p>
          <p className="text-3xl font-display font-extrabold text-neu-accent mb-1">
            ₹{amountSummary.pendingSettlementValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-neu-muted">Expected inflows</p>
        </div>

        <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
             <TrendingUp className="w-20 h-20" />
          </div>
          <p className="text-sm font-bold text-neu-muted mb-2">Projected Position</p>
          <p className="text-3xl font-display font-extrabold text-neu-primary mb-1">
            ₹{projectedEnding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-neu-muted">7-Day Forecast</p>
        </div>
      </div>

      <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-inset">
        <h3 className="text-lg font-bold text-neu-primary mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-neu-accent" />
          Assumptions & Warnings
        </h3>
        <ul className="space-y-4">
          <li className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-neu-base shadow-neu-extruded-sm flex items-center justify-center shrink-0 mt-0.5">
              <ArrowRight className="w-4 h-4 text-neu-accent" />
            </div>
            <div>
              <p className="text-sm font-bold text-neu-primary">Forecast includes expected pending settlements of ₹{amountSummary.pendingSettlementValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-neu-muted mt-1">These values are unconfirmed and subject to exceptions or delays.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-neu-base shadow-neu-extruded-sm flex items-center justify-center shrink-0 mt-0.5">
              <ArrowRight className="w-4 h-4 text-[#F39C12]" />
            </div>
            <div>
              <p className="text-sm font-bold text-neu-primary">Uncredited Bank Value of ₹{amountSummary.uncreditedBankValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-neu-muted mt-1">Settlements exist in books but have not hit the bank account.</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
