import React, { useState } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { ShieldAlert, ArrowRight, ChevronDown, ChevronRight, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { ControllerActionItem } from '../types';

interface ControllerActionQueueProps {
  onSelectTransaction?: (transactionId: string) => void;
}

export default function ControllerActionQueue({ onSelectTransaction }: ControllerActionQueueProps) {
  const { latestResult } = useFinanceData();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  if (!latestResult || !latestResult.controllerActionQueue || latestResult.controllerActionQueue.length === 0) {
    return null;
  }

  const queue = latestResult.controllerActionQueue;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'escalate':
        return (
          <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#E74C3C] flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#E74C3C] animate-pulse"></span>
            Escalate
          </span>
        );
      case 'manual_review':
        return (
          <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#F39C12] flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#F39C12]"></span>
            Manual Review
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#2E7D32] flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
            Auto Resolve
          </span>
        );
    }
  };

  return (
    <div className="p-6 sm:p-8 bg-neu-base rounded-[32px] shadow-neu-extruded space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-neu-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neu-base shadow-neu-inset flex items-center justify-center text-[#E74C3C]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neu-primary">Controller Action Queue</h3>
            <p className="text-xs text-neu-muted font-medium">
              {queue.length} priority action{queue.length > 1 ? 's' : ''} require attention from the latest reconciliation batch.
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-[11px] font-bold text-neu-muted">
          Materiality: ₹{latestResult.materialityThreshold.toLocaleString('en-IN')}
        </div>
      </div>

      <div className="space-y-3">
        {queue.map((item: ControllerActionItem) => {
          const isExpanded = expandedItemId === item.id;
          return (
            <div 
              key={item.id}
              className="bg-neu-base rounded-2xl shadow-neu-extruded-sm hover:shadow-neu-extruded transition-all p-4"
            >
              <div 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <button className="p-1 text-neu-muted hover:text-neu-primary transition-colors shrink-0 mt-0.5 sm:mt-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-neu-primary font-mono">{item.transactionId}</span>
                      <span className="px-2.5 py-0.5 bg-neu-base shadow-neu-inset rounded-full text-[10px] font-bold text-neu-muted uppercase">
                        {item.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-neu-muted font-medium mt-1 truncate max-w-xl">
                      {item.oneLineReason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-7 sm:pl-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-neu-muted block">Exposure</span>
                    <span className="text-sm font-extrabold text-neu-primary tabular-nums">
                      ₹{item.amountExposed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {getActionBadge(item.recommendedAction)}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-neu-muted/10 text-xs space-y-3 bg-neu-base shadow-neu-inset rounded-xl p-4 animate-fade-in">
                  <div>
                    <span className="font-bold text-neu-muted uppercase tracking-wider text-[10px] block mb-1">Diagnostic Detail</span>
                    <p className="text-neu-primary font-medium">{item.details}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neu-muted/10">
                    <div className="text-neu-muted font-mono text-[11px]">
                      Sources: {(item.sourceRecordIds || []).join(', ')}
                    </div>
                    {onSelectTransaction && (
                      <button
                        onClick={() => onSelectTransaction(item.transactionId)}
                        className="px-3 py-1 bg-neu-base shadow-neu-extruded-sm hover:shadow-neu-inset rounded-lg text-neu-primary font-bold text-xs flex items-center gap-1.5"
                      >
                        Open In Reconciliation
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
