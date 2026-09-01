import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { ReconciliationIntegrityCheck } from '../types';

interface IntegrityCheckCardProps {
  checks: ReconciliationIntegrityCheck[];
  overallStatus: "pass" | "warning" | "fail";
}

export default function IntegrityCheckCard({ checks, overallStatus }: IntegrityCheckCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusBadge = () => {
    switch (overallStatus) {
      case 'pass':
        return (
          <span className="px-3 py-1.5 bg-[#9EEB75]/20 text-[#2E7D32] border border-[#9EEB75] rounded-full text-xs font-bold flex items-center gap-1.5 shadow-neu-extruded-sm">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
            Integrity checks passed
          </span>
        );
      case 'warning':
        return (
          <span className="px-3 py-1.5 bg-[#F39C12]/20 text-[#D68910] border border-[#F39C12] rounded-full text-xs font-bold flex items-center gap-1.5 shadow-neu-extruded-sm">
            <AlertTriangle className="w-4 h-4 text-[#D68910]" />
            Completed with warnings. Review data-quality items.
          </span>
        );
      case 'fail':
        return (
          <span className="px-3 py-1.5 bg-[#E74C3C]/20 text-[#C0392B] border border-[#E74C3C] rounded-full text-xs font-bold flex items-center gap-1.5 shadow-neu-extruded-sm">
            <XCircle className="w-4 h-4 text-[#C0392B]" />
            Completed with validation failures. Review diagnostics before relying on results.
          </span>
        );
    }
  };

  return (
    <div className="p-6 bg-neu-base rounded-[28px] shadow-neu-extruded space-y-4">
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neu-base shadow-neu-inset flex items-center justify-center text-[#9EEB75]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-neu-primary">Reconciliation Integrity Checks</h4>
            <p className="text-xs text-neu-muted font-medium">9 deterministic audit & reconciliation control validations</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-center">
          {getStatusBadge()}
          <button className="p-2 rounded-xl bg-neu-base shadow-neu-extruded-sm hover:shadow-neu-inset text-neu-muted">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-neu-muted/20 space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {checks.map((check) => {
              const isPass = check.status === 'pass';
              const isWarn = check.status === 'warning';
              return (
                <div 
                  key={check.id}
                  className="p-3.5 rounded-2xl bg-neu-base shadow-neu-inset flex items-start gap-3 text-xs"
                >
                  <div className="mt-0.5 shrink-0">
                    {isPass && <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />}
                    {isWarn && <AlertTriangle className="w-4 h-4 text-[#D68910]" />}
                    {!isPass && !isWarn && <XCircle className="w-4 h-4 text-[#C0392B]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neu-primary">{check.label}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                        isPass ? 'bg-[#9EEB75]/30 text-[#2E7D32]' : isWarn ? 'bg-[#F39C12]/30 text-[#D68910]' : 'bg-[#E74C3C]/30 text-[#C0392B]'
                      }`}>
                        {check.status}
                      </span>
                    </div>
                    <p className="text-neu-muted mt-1 leading-relaxed text-[11px]">{check.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
