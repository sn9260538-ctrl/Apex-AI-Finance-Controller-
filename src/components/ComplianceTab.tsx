import React from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import StaleWarningBanner from './StaleWarningBanner';

export default function ComplianceTab() {
  const { latestResult, dataMode, lastRunTimestamp, companyProfile, isReconciliationStale } = useFinanceData();

  if (!latestResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-neu-base shadow-neu-extruded rounded-full flex items-center justify-center mb-2">
          <ShieldCheck className="w-8 h-8 text-neu-muted" />
        </div>
        <h2 className="text-2xl font-display font-bold text-neu-primary">No Compliance Data Available</h2>
        <p className="text-neu-muted max-w-md text-sm">
          No completed reconciliation run yet. Load demo data or upload CSV files, then run the local reconciliation engine.
        </p>
      </div>
    );
  }

  const { complianceScreening, settlementTimingSummary } = latestResult;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-neu-primary">Compliance Screening</h2>
          <p className="text-sm text-neu-muted mt-1">Rule-based operational screening from local data.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isReconciliationStale && (
            <span className="px-3 py-1 bg-[#F39C12]/20 text-[#D68910] text-xs font-bold rounded-full border border-[#F39C12]/30">
              Previous reconciliation result — rerun required
            </span>
          )}
          <div className="px-4 py-2 bg-neu-base shadow-neu-extruded-sm rounded-full text-xs font-bold text-neu-primary flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isReconciliationStale ? 'bg-[#F39C12]' : 'bg-neu-accent'} animate-pulse`}></div>
            Results from run on {new Date(lastRunTimestamp!).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        </div>
      </div>

      <StaleWarningBanner />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-extruded relative">
          <div className="absolute top-6 right-6 text-neu-accent">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neu-primary mb-4">GST Screening</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-neu-base shadow-neu-inset rounded-2xl">
              <p className="text-xs font-bold text-neu-muted mb-1">Potential ITC Variance (Books vs Statement)</p>
              <p className="text-2xl font-display font-bold text-neu-primary">
                ₹{(complianceScreening?.potentialItcVariance || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <p className="text-xs text-neu-muted mt-4">Verify amounts against actual GSTR-2B before finalizing claims.</p>
        </div>

        <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-extruded relative">
          <div className="absolute top-6 right-6 text-neu-accent">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neu-primary mb-4">TDS Screening (Professional Fees)</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-neu-base shadow-neu-inset rounded-2xl">
              <p className="text-xs font-bold text-neu-muted mb-1">Potential TDS Shortfall</p>
              <p className="text-2xl font-display font-bold text-[#E74C3C]">
                ₹{(complianceScreening?.potentialTdsShortfall || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <p className="text-xs text-neu-muted mt-4">Screening based on standard configured rate. Check vendor declarations.</p>
        </div>
      </div>

      <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-inset">
        <h3 className="text-lg font-bold text-neu-primary mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#F39C12]" />
          Review Checklist
        </h3>
        <ul className="space-y-4">
          <li className="flex items-center justify-between p-4 bg-neu-base shadow-neu-extruded-sm rounded-2xl">
            <span className="text-sm font-bold text-neu-primary">Settlement Timing Overdue</span>
            <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#E74C3C]">
              {settlementTimingSummary.timingReviewCount} records
            </span>
          </li>
          
          <li className="flex items-center justify-between p-4 bg-neu-base shadow-neu-extruded-sm rounded-2xl">
            <span className="text-sm font-bold text-neu-primary">Bank Credit Timing Overdue</span>
            <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#E74C3C]">
              {settlementTimingSummary.bankCreditTimingReviewCount || 0} records
            </span>
          </li>
          <li className="flex items-center justify-between p-4 bg-neu-base shadow-neu-extruded-sm rounded-2xl">
            <span className="text-sm font-bold text-neu-primary">Duplicate Records</span>
            <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#E74C3C]">
              {latestResult.exceptions.filter(e => e.type === 'Duplicate').length} records
            </span>
          </li>
          <li className="flex items-center justify-between p-4 bg-neu-base shadow-neu-extruded-sm rounded-2xl">
            <span className="text-sm font-bold text-neu-primary">Missing Settlements</span>
            <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#E74C3C]">
              {latestResult.exceptions.filter(e => e.type === 'Missing_in_Settlement').length} records
            </span>
          </li>
          <li className="flex items-center justify-between p-4 bg-neu-base shadow-neu-extruded-sm rounded-2xl">
            <span className="text-sm font-bold text-neu-primary">Missing Bank Credits</span>
            <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#E74C3C]">
              {latestResult.exceptions.filter(e => e.type === 'Missing_in_Bank').length} records
            </span>
          </li>
        </ul>
        <p className="text-xs font-bold text-neu-muted mt-6 text-center">
          Note: This screening does not represent final legal compliance or confirm actual tax liability.
        </p>
      </div>
    
      <div className="mt-8 p-6 bg-neu-base rounded-[32px] shadow-neu-extruded">
        <h4 className="text-sm font-bold text-neu-primary mb-4">Reference Notes</h4>
        <ul className="list-disc pl-5 text-xs text-neu-muted space-y-2">
          <li>Income-tax Act, 2025 applies from 1 April 2026.</li>
          <li>TDS screening reference: sections 392 and 393.</li>
          <li>TCS screening reference: section 394.</li>
          <li>RBI (Regulation of Payment Aggregators) Directions, 2025 — operational screening only.</li>
          <li>This prototype does not verify payment aggregator authorisation, merchant KYC, escrow ownership, or legal compliance.</li>
        </ul>
      </div>

      <div className="mt-8 p-4 rounded-xl bg-neu-base shadow-neu-inset text-xs text-neu-muted text-center italic">
        Prototype finance-operations screening only. This application does not replace official government portals, bank records, payment-gateway settlement terms, qualified accountants, auditors, tax advisers, or legal advisers. Verify all thresholds, rates, eligibility conditions, filings, and settlement obligations before acting.
      </div>
    </div>
  );
}
