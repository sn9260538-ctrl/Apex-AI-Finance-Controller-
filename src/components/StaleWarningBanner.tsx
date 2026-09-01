import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useFinanceData } from '../context/FinanceDataContext';

interface StaleWarningBannerProps {
  onRunRecon?: () => void;
}

export default function StaleWarningBanner({ onRunRecon }: StaleWarningBannerProps) {
  const { isReconciliationStale, staleReason } = useFinanceData();

  if (!isReconciliationStale) return null;

  return (
    <div className="p-4 sm:p-5 bg-neu-base rounded-2xl border-2 border-[#F39C12] shadow-neu-extruded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F39C12]/10 shadow-neu-inset flex items-center justify-center text-[#F39C12] shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F39C12]/20 text-[#D68910]">
              Previous reconciliation result — rerun required
            </span>
          </div>
          <p className="text-sm font-bold text-neu-primary mt-1">
            Reconciliation results may be outdated. {staleReason || 'Input data or rules changed after the last completed run.'}
          </p>
        </div>
      </div>
      {onRunRecon && (
        <button
          onClick={onRunRecon}
          className="px-5 py-2.5 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full text-xs font-bold text-[#D68910] hover:text-[#B7791F] flex items-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4 animate-spin-reverse" />
          Run Reconciliation Batch
        </button>
      )}
    </div>
  );
}
