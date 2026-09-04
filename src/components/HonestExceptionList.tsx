import React, { useState, useMemo } from 'react';
import { HonestExceptionRecord } from '../types';
import { 
  AlertTriangle, ShieldCheck, Search, Filter, ArrowUpDown, ChevronDown, 
  ChevronRight, CheckCircle2, FileText, AlertCircle, Info, ExternalLink 
} from 'lucide-react';

interface HonestExceptionListProps {
  exceptions: HonestExceptionRecord[];
  autoResolvedCount: number;
  unresolvedTxCount: number;
  unresolvedItemCount: number;
  totalInrExposure: number;
  largestDifference: number;
  materialExceptionsCount: number;
  dataQualityBlockedCount: number;
  onSelectTransaction?: (txId: string) => void;
}

export default function HonestExceptionList({
  exceptions,
  autoResolvedCount,
  unresolvedTxCount,
  unresolvedItemCount,
  totalInrExposure,
  largestDifference,
  materialExceptionsCount,
  dataQualityBlockedCount,
  onSelectTransaction
}: HonestExceptionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredExceptions = useMemo(() => {
    const q = String(searchTerm || '').toLowerCase().trim();
    return (exceptions || []).filter(e => {
      // Search
      const matchesSearch = 
        !q ||
        (e.transactionId && String(e.transactionId).toLowerCase().includes(q)) ||
        (e.exceptionId && String(e.exceptionId).toLowerCase().includes(q)) ||
        (e.type && String(e.type).toLowerCase().includes(q)) ||
        (e.reason && String(e.reason).toLowerCase().includes(q));

      // State Filter
      const matchesState = stateFilter === 'all' || e.resolutionState === stateFilter;

      // Type Filter
      const matchesType = typeFilter === 'all' || e.type === typeFilter;

      return Boolean(matchesSearch && matchesState && matchesType);
    });
  }, [exceptions, searchTerm, stateFilter, typeFilter]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set((exceptions || []).map(e => e?.type).filter(Boolean)));
  }, [exceptions]);

  return (
    <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-extruded space-y-6 animate-fade-in border border-neu-muted/20">
      {/* Header & Honest Statement */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-neu-muted/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-neu-base shadow-neu-inset text-[#E74C3C] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#E74C3C]" />
              Unfiltered Audit Ledger
            </span>
            <span className="text-xs text-neu-muted font-medium">Strict Audit Compliance</span>
          </div>
          <h3 className="text-xl font-display font-bold text-neu-primary">Honest Exception List</h3>
          <p className="text-xs text-neu-muted mt-1 max-w-2xl">
            Complete, untruncated enumeration of every variance, timing discrepancy, missing record, and data quality gap identified across the 4-way financial loop.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-neu-base shadow-neu-inset rounded-2xl text-right">
            <p className="text-[10px] font-bold text-neu-muted uppercase">Exception Items</p>
            <p className="text-sm font-display font-extrabold text-[#E74C3C]">
              {unresolvedItemCount} Unresolved + {autoResolvedCount} Auto-Resolved
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-neu-base rounded-2xl shadow-neu-inset">
          <p className="text-[10px] font-bold text-neu-muted uppercase">Unresolved Tx</p>
          <p className="text-lg font-display font-extrabold text-neu-primary mt-0.5">{unresolvedTxCount}</p>
        </div>
        <div className="p-3.5 bg-neu-base rounded-2xl shadow-neu-inset">
          <p className="text-[10px] font-bold text-neu-muted uppercase">Unresolved Items</p>
          <p className="text-lg font-display font-extrabold text-[#E74C3C] mt-0.5">{unresolvedItemCount}</p>
        </div>
        <div className="p-3.5 bg-neu-base rounded-2xl shadow-neu-inset">
          <p className="text-[10px] font-bold text-neu-muted uppercase">Total INR Exposure</p>
          <p className="text-lg font-display font-extrabold text-neu-primary mt-0.5">
            ₹{totalInrExposure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="p-3.5 bg-neu-base rounded-2xl shadow-neu-inset">
          <p className="text-[10px] font-bold text-neu-muted uppercase">Largest Difference</p>
          <p className="text-lg font-display font-extrabold text-[#E74C3C] mt-0.5">
            ₹{largestDifference.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="p-3.5 bg-neu-base rounded-2xl shadow-neu-inset">
          <p className="text-[10px] font-bold text-neu-muted uppercase">Material Over Limit</p>
          <p className="text-lg font-display font-extrabold text-[#F39C12] mt-0.5">{materialExceptionsCount}</p>
        </div>
        <div className="p-3.5 bg-neu-base rounded-2xl shadow-neu-inset">
          <p className="text-[10px] font-bold text-neu-muted uppercase">Data Quality Gaps</p>
          <p className="text-lg font-display font-extrabold text-neu-primary mt-0.5">{dataQualityBlockedCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neu-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Tx ID, rule, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neu-base shadow-neu-inset rounded-full text-xs text-neu-primary focus:outline-none placeholder:text-neu-muted"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neu-muted">
            <Filter className="w-3.5 h-3.5" />
            <span>State:</span>
          </div>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-2 bg-neu-base shadow-neu-extruded-sm rounded-xl text-xs font-bold text-neu-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All States ({exceptions.length})</option>
            <option value="Unresolved — Escalate">Unresolved — Escalate</option>
            <option value="Unresolved — Manual Review">Unresolved — Manual Review</option>
            <option value="Data Quality Blocked">Data Quality Blocked</option>
            <option value="Auto-resolved">Auto-resolved ({autoResolvedCount})</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-neu-base shadow-neu-extruded-sm rounded-xl text-xs font-bold text-neu-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Complete Exceptions Table */}
      <div className="overflow-x-auto rounded-2xl shadow-neu-inset border border-neu-muted/10 bg-neu-base">
        <table className="w-full text-left text-xs text-neu-primary">
          <thead className="bg-neu-base border-b border-neu-muted/20 text-[11px] font-bold text-neu-muted uppercase tracking-wider sticky top-0">
            <tr>
              <th className="py-3 px-4">Tx ID</th>
              <th className="py-3 px-4">Exception Type</th>
              <th className="py-3 px-4">Amounts (Inv / Pay / Set / Bnk)</th>
              <th className="py-3 px-4">Difference</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Materiality</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Resolution State</th>
              <th className="py-3 px-4 text-center">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neu-muted/10">
            {filteredExceptions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-neu-muted font-medium">
                  No exceptions matching the current search and filter criteria.
                </td>
              </tr>
            ) : (
              filteredExceptions.map((e) => {
                const isExpanded = expandedRow === e.exceptionId;
                const isAutoResolved = e.resolutionState === 'Auto-resolved';
                const isEscalate = e.resolutionState === 'Unresolved — Escalate';
                const isDataQuality = e.resolutionState === 'Data Quality Blocked';

                return (
                  <React.Fragment key={e.exceptionId}>
                    <tr 
                      className={`hover:bg-neu-primary/5 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-neu-primary/5 font-medium' : ''
                      }`}
                      onClick={() => setExpandedRow(isExpanded ? null : e.exceptionId)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-neu-primary">
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            if (onSelectTransaction) onSelectTransaction(e.transactionId);
                          }}
                          className="hover:underline flex items-center gap-1 text-neu-primary"
                          title="Click to highlight in ledger"
                        >
                          {e.transactionId}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{e.type ? String(e.type).replace(/_/g, ' ') : 'General Exception'}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-neu-muted">
                        ₹{Number(e.invoiceAmount || 0).toLocaleString('en-IN')} / ₹{Number(e.paymentAmount || 0).toLocaleString('en-IN')} / ₹{Number(e.settlementAmount || 0).toLocaleString('en-IN')} / ₹{Number(e.bankAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {e.difference !== 0 ? (
                          <span className={Math.abs(e.difference || 0) >= (e.materialityThreshold || 0) ? 'text-[#E74C3C]' : 'text-[#F39C12]'}>
                            {(e.difference || 0) > 0 ? `+${(e.difference || 0).toFixed(2)}` : (e.difference || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-neu-muted">₹0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          e.deterministicMatchConfidence === 'High' ? 'bg-[#9EEB75]/20 text-[#0F2F28]' :
                          e.deterministicMatchConfidence === 'Medium' ? 'bg-[#F39C12]/20 text-[#D68910]' :
                          'bg-[#E74C3C]/20 text-[#E74C3C]'
                        }`}>
                          {e.deterministicMatchConfidence || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {e.thresholdExceeded ? (
                          <span className="text-[#E74C3C] font-bold text-[10px] bg-[#E74C3C]/15 px-2 py-0.5 rounded-full">
                            Exceeded (₹{e.materialityThreshold || 0})
                          </span>
                        ) : (
                          <span className="text-neu-muted text-[10px]">Within (₹{e.materialityThreshold || 0})</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          e.recommendedAction === 'auto_resolve' ? 'bg-[#9EEB75]/30 text-[#0F2F28]' :
                          e.recommendedAction === 'manual_review' ? 'bg-[#F39C12]/25 text-[#D68910]' :
                          'bg-[#E74C3C]/25 text-[#E74C3C]'
                        }`}>
                          {e.recommendedAction ? String(e.recommendedAction).replace(/_/g, ' ') : 'Review'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                          isAutoResolved ? 'bg-[#9EEB75]/20 text-[#0F2F28]' :
                          isEscalate ? 'bg-[#E74C3C]/20 text-[#E74C3C]' :
                          isDataQuality ? 'bg-[#9B59B6]/20 text-[#8E44AD]' :
                          'bg-[#F39C12]/20 text-[#D68910]'
                        }`}>
                          {e.resolutionState || 'Open'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="w-6 h-6 rounded-full bg-neu-base shadow-neu-extruded-sm flex items-center justify-center mx-auto text-neu-muted">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Detail */}
                    {isExpanded && (
                      <tr className="bg-neu-base/60">
                        <td colSpan={9} className="p-4 border-b border-neu-muted/20">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neu-base p-4 rounded-xl shadow-neu-inset text-xs">
                            <div>
                              <p className="font-bold text-neu-primary mb-1">Reason & Context</p>
                              <p className="text-neu-muted leading-relaxed">{e.reason || 'No additional reason provided.'}</p>
                              <p className="mt-2 text-[11px] font-bold text-neu-muted">
                                Rule Applied: <span className="text-neu-primary">{e.ruleApplied || 'Standard Rules'}</span>
                              </p>
                            </div>

                            <div>
                              <p className="font-bold text-neu-primary mb-1">Evidence Trail</p>
                              <div className="space-y-1 text-[11px]">
                                <p className="text-neu-muted">
                                  <strong className="text-neu-primary">Available:</strong> {(e.evidenceAvailable || []).join(', ') || 'None'}
                                </p>
                                <p className="text-[#E74C3C]">
                                  <strong>Missing:</strong> {(e.evidenceMissing || []).join(', ') || 'None identified'}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="font-bold text-neu-primary mb-1">Controller Action Protocol</p>
                              <p className="text-neu-muted text-[11px] leading-relaxed">
                                {e.recommendedAction === 'auto_resolve' 
                                  ? 'Within mathematical tolerance. Auto-cleared in audit log without manual intervention.'
                                  : e.recommendedAction === 'escalate'
                                  ? 'Exceeds materiality threshold. Immediate controller sign-off and merchant inquiry required.'
                                  : 'Above tolerance but non-material. Route to operational review desk.'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-neu-muted pt-2">
        <p>Showing {filteredExceptions.length} of {exceptions.length} total exception records.</p>
        <p className="text-[11px] italic">Audit Rule: Zero exception records are hidden or excluded from this audit table.</p>
      </div>
    </div>
  );
}
