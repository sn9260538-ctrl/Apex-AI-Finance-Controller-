import React, { useState } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, FileWarning, 
  ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Clock, ArrowDownRight
} from 'lucide-react';
import StaleWarningBanner from './StaleWarningBanner';
import ControllerActionQueue from './ControllerActionQueue';

interface OverviewTabProps {
  onNavigateToRecon?: () => void;
}

export default function OverviewTab({ onNavigateToRecon }: OverviewTabProps) {
  const { latestResult, dataMode, lastRunTimestamp, isReconciliationStale } = useFinanceData();
  const [funnelViewMode, setFunnelViewMode] = useState<'bars' | 'flow'>('bars');

  if (!latestResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in space-y-6">
        <div className="w-20 h-20 bg-neu-base shadow-neu-extruded rounded-full flex items-center justify-center">
          <Activity className="w-8 h-8 text-neu-muted" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-display font-bold text-neu-primary">No Completed Run Available</h2>
          <p className="text-neu-muted text-sm">
            No completed reconciliation run yet. Load demo data or upload CSV files, then run the local reconciliation engine.
          </p>
        </div>
        {onNavigateToRecon && (
          <button
            onClick={onNavigateToRecon}
            className="px-6 py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full font-bold text-sm text-neu-primary flex items-center gap-2 transition-all"
          >
            Go to Reconciliation
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  const { amountSummary, exceptions } = latestResult;

  // ==========================================
  // RECONCILIATION STATUS DONUT DATA
  // ==========================================
  const totalBatchCount = latestResult.batchSize || 1;
  const pieData = [
    { 
      name: 'Fully Matched', 
      value: latestResult.fullyMatched, 
      color: '#9EEB75', 
      pct: ((latestResult.fullyMatched / totalBatchCount) * 100).toFixed(1),
      desc: '100% matched across books, gateway & bank'
    },
    { 
      name: 'Partial Match', 
      value: latestResult.partialMatches, 
      color: '#F39C12', 
      pct: ((latestResult.partialMatches / totalBatchCount) * 100).toFixed(1),
      desc: 'Minor amount or timing variances within tolerance'
    },
    { 
      name: 'Unmatched', 
      value: latestResult.unmatched, 
      color: '#E74C3C', 
      pct: ((latestResult.unmatched / totalBatchCount) * 100).toFixed(1),
      desc: 'Missing records, duplicates, or material variances'
    },
  ].filter(d => d.value > 0);

  // Fallback if empty
  const activePieData = pieData.length > 0 ? pieData : [
    { name: 'No Records', value: 1, color: '#CBD5E1', pct: '0', desc: 'No transactions processed' }
  ];

  // ==========================================
  // CASH VALUE FUNNEL DATA
  // ==========================================
  const totalDeductions = (amountSummary.totalMdr || 0) + 
                          (amountSummary.totalGstOnMdr || 0) + 
                          (amountSummary.totalRefunds || 0) + 
                          (amountSummary.totalChargebacks || 0) + 
                          (amountSummary.totalAdjustments || 0);

  const inTransitAmount = (amountSummary.uncreditedBankValue || amountSummary.pendingSettlementValue || 0);
  const grossValue = amountSummary.grossPaymentValue || (amountSummary.bankCreditedValue + totalDeductions + inTransitAmount) || 1;

  const funnelStages = [
    {
      stage: 'Gross Inflow',
      displayName: '1. Gross Captured',
      value: amountSummary.grossPaymentValue,
      pctOfGross: ((amountSummary.grossPaymentValue / grossValue) * 100).toFixed(1),
      fillColor: '#3498DB',
      type: 'inflow',
      detail: 'Total value of captured payments & customer invoices'
    },
    {
      stage: 'Gateway Fees',
      displayName: '2. Less: Fees & MDR',
      value: totalDeductions,
      pctOfGross: ((totalDeductions / grossValue) * 100).toFixed(1),
      fillColor: '#E74C3C',
      type: 'deduction',
      detail: `MDR (₹${(amountSummary.totalMdr || 0).toLocaleString('en-IN')}), GST on MDR (₹${(amountSummary.totalGstOnMdr || 0).toLocaleString('en-IN')}) & adjustments`
    },
    {
      stage: 'Expected Net',
      displayName: '3. Net Expected',
      value: amountSummary.expectedSettlementValue,
      pctOfGross: ((amountSummary.expectedSettlementValue / grossValue) * 100).toFixed(1),
      fillColor: '#2B4C7E',
      type: 'subtotal',
      detail: 'Settlement payable by gateway after fees and deductions'
    },
    {
      stage: 'In-Transit',
      displayName: '4. Less: In-Transit',
      value: inTransitAmount,
      pctOfGross: ((inTransitAmount / grossValue) * 100).toFixed(1),
      fillColor: '#F39C12',
      type: 'pending',
      detail: 'Settled by gateway but pending bank clearance / transit'
    },
    {
      stage: 'Bank Credited',
      displayName: '5. Confirmed Bank',
      value: amountSummary.bankCreditedValue,
      pctOfGross: ((amountSummary.bankCreditedValue / grossValue) * 100).toFixed(1),
      fillColor: '#9EEB75',
      type: 'realized',
      detail: 'Liquid cash confirmed and verified in bank credit statements'
    }
  ];

  // Continuous realization flow data
  const flowRealizationData = [
    { name: 'Gross Captured', amount: amountSummary.grossPaymentValue, label: 'Gross' },
    { name: 'Net Expected', amount: amountSummary.expectedSettlementValue, label: 'Net' },
    { name: 'Bank Realized', amount: amountSummary.bankCreditedValue, label: 'Bank Cash' }
  ];

  const realizationRate = grossValue > 0 
    ? ((amountSummary.bankCreditedValue / grossValue) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-neu-primary">Overview</h2>
          <p className="text-sm text-neu-muted mt-1">Financial control metrics & cash realization performance</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isReconciliationStale && (
            <span className="px-3 py-1 bg-[#F39C12]/20 text-[#D68910] text-xs font-bold rounded-full border border-[#F39C12]/30">
              Previous reconciliation result — rerun required
            </span>
          )}
          <div className="px-4 py-2 bg-neu-base shadow-neu-extruded-sm rounded-full text-xs font-bold text-neu-primary flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isReconciliationStale ? 'bg-[#F39C12]' : 'bg-neu-accent'} animate-pulse`}></div>
            {dataMode} • Last reconciled: {new Date(lastRunTimestamp!).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        </div>
      </div>

      {/* Stale Warning Banner */}
      <StaleWarningBanner onRunRecon={onNavigateToRecon} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-[#9EEB75] rounded-[24px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#8ad166] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.4)] flex items-center justify-center text-neu-primary">
                <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-neu-primary/80">Confirmed Bank Cash</p>
            </div>
            <p className="text-2xl font-display font-extrabold text-neu-primary mb-1">
              ₹{amountSummary.bankCreditedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-xs text-neu-primary/70 mt-3 pt-2 border-t border-neu-primary/10">
            {realizationRate}% of gross payment volume realized
          </p>
        </div>

        <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full shadow-neu-inset flex items-center justify-center text-neu-accent">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-neu-muted">Pending Settlement Value</p>
            </div>
            <p className="text-2xl font-display font-extrabold text-neu-accent mb-1">
              ₹{amountSummary.pendingSettlementValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-xs text-neu-muted mt-3 pt-2 border-t border-neu-muted/10">
            Gateway pipeline & uncredited bank balance
          </p>
        </div>

        <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full shadow-neu-inset flex items-center justify-center text-[#9EEB75]">
                <Activity className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-neu-muted">Reconciliation Match Rate</p>
            </div>
            <p className="text-2xl font-display font-extrabold text-neu-primary mb-1">
              {latestResult.matchRate.toFixed(1)}%
            </p>
          </div>
          <p className="text-xs text-neu-muted mt-3 pt-2 border-t border-neu-muted/10">
            {latestResult.fullyMatched} of {latestResult.batchSize} transactions matched
          </p>
        </div>

        <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full shadow-neu-inset flex items-center justify-center text-[#E74C3C]">
                <FileWarning className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-neu-muted">Exceptions Requiring Action</p>
            </div>
            <p className="text-2xl font-display font-extrabold text-[#E74C3C] mb-1">
              {latestResult.transactionsWithExceptions}
            </p>
          </div>
          <p className="text-xs text-neu-muted mt-3 pt-2 border-t border-neu-muted/10">
            Exposure: ₹{amountSummary.totalExceptionExposure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Operational Health Summary Panel */}
      <div className="p-6 sm:p-8 bg-neu-base rounded-[32px] shadow-neu-extruded space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neu-muted/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neu-base shadow-neu-inset flex items-center justify-center text-neu-accent">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neu-primary">Operational Health Summary</h3>
              <p className="text-xs text-neu-muted">Rule-based operational screening from local data.</p>
            </div>
          </div>
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${
            isReconciliationStale 
              ? 'bg-[#F39C12]/20 text-[#D68910] border-[#F39C12]/30' 
              : 'bg-[#9EEB75]/20 text-[#2E7D32] border-[#9EEB75]/40'
          }`}>
            {isReconciliationStale ? 'Previous result — rerun required' : 'Current'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Reconciliation Health */}
          <div className="p-4 bg-neu-base shadow-neu-inset rounded-2xl flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neu-muted uppercase tracking-wider">Reconciliation Health</span>
              <span className={`text-xs font-extrabold ${latestResult.matchRate === 100 ? 'text-[#2E7D32]' : latestResult.matchRate >= 90 ? 'text-[#9EEB75]' : 'text-[#E74C3C]'}`}>
                {latestResult.matchRate === 100 ? 'Fully Matched' : latestResult.matchRate >= 90 ? 'High Match Rate' : 'Needs Attention'}
              </span>
            </div>
            <div>
              <div className="text-xl font-display font-extrabold text-neu-primary">{latestResult.matchRate.toFixed(1)}%</div>
              <div className="text-[11px] text-neu-muted mt-0.5">{latestResult.fullyMatched} of {latestResult.batchSize} records fully matched</div>
            </div>
          </div>

          {/* 2. Cash Position */}
          <div className="p-4 bg-neu-base shadow-neu-inset rounded-2xl flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neu-muted uppercase tracking-wider">Cash Position</span>
              <span className="text-xs font-bold text-[#2E7D32]">Bank Confirmed</span>
            </div>
            <div>
              <div className="text-xl font-display font-extrabold text-neu-primary">₹{amountSummary.bankCreditedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="text-[11px] text-neu-muted mt-0.5">Buffer: ₹{(amountSummary.pendingSettlementValue + (amountSummary.uncreditedBankValue || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })} in-transit</div>
            </div>
          </div>

          {/* 3. Exception Exposure */}
          <div className="p-4 bg-neu-base shadow-neu-inset rounded-2xl flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neu-muted uppercase tracking-wider">Exception Exposure</span>
              <span className={`text-xs font-bold ${latestResult.transactionsWithExceptions > 0 ? 'text-[#E74C3C]' : 'text-[#2E7D32]'}`}>
                {latestResult.transactionsWithExceptions} Item(s)
              </span>
            </div>
            <div>
              <div className="text-xl font-display font-extrabold text-[#E74C3C]">₹{amountSummary.totalExceptionExposure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="text-[11px] text-neu-muted mt-0.5">Review required</div>
            </div>
          </div>

          {/* 4. Compliance Screening */}
          <div className="p-4 bg-neu-base shadow-neu-inset rounded-2xl flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neu-muted uppercase tracking-wider">Compliance Screening</span>
              <span className={`text-xs font-bold ${(latestResult.settlementTimingSummary?.timingReviewCount || 0) + (latestResult.settlementTimingSummary?.bankCreditTimingReviewCount || 0) + (latestResult.complianceScreening?.potentialItcVariance ? 1 : 0) + (latestResult.complianceScreening?.potentialTdsShortfall ? 1 : 0) > 0 ? 'text-[#F39C12]' : 'text-[#2E7D32]'}`}>
                {((latestResult.settlementTimingSummary?.timingReviewCount || 0) + (latestResult.settlementTimingSummary?.bankCreditTimingReviewCount || 0) + (latestResult.complianceScreening?.potentialItcVariance ? 1 : 0) + (latestResult.complianceScreening?.potentialTdsShortfall ? 1 : 0)) === 0 ? 'Clean' : 'Review Flags'}
              </span>
            </div>
            <div>
              <div className="text-xl font-display font-extrabold text-neu-primary">
                {(latestResult.settlementTimingSummary?.timingReviewCount || 0) + (latestResult.settlementTimingSummary?.bankCreditTimingReviewCount || 0) + (latestResult.complianceScreening?.potentialItcVariance ? 1 : 0) + (latestResult.complianceScreening?.potentialTdsShortfall ? 1 : 0)} Flag(s)
              </div>
              <div className="text-[11px] text-neu-muted mt-0.5">Potential review flags identified</div>
            </div>
          </div>

          {/* 5. Data Freshness */}
          <div className="p-4 bg-neu-base shadow-neu-inset rounded-2xl flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neu-muted uppercase tracking-wider">Data Freshness</span>
              <span className={`text-xs font-bold ${isReconciliationStale ? 'text-[#D68910]' : 'text-[#2E7D32]'}`}>
                {isReconciliationStale ? 'Previous result' : 'Current'}
              </span>
            </div>
            <div>
              <div className="text-xl font-display font-extrabold text-neu-primary">{dataMode}</div>
              <div className="text-[11px] text-neu-muted mt-0.5">Last run: {new Date(lastRunTimestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {/* 6. Integrity Check */}
          <div className="p-4 bg-neu-base shadow-neu-inset rounded-2xl flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neu-muted uppercase tracking-wider">Integrity Check</span>
              <span className={`text-xs font-extrabold ${latestResult.overallIntegrityStatus === 'pass' ? 'text-[#2E7D32]' : latestResult.overallIntegrityStatus === 'warning' ? 'text-[#D68910]' : 'text-[#E74C3C]'}`}>
                {latestResult.overallIntegrityStatus === 'pass' ? 'Passed' : latestResult.overallIntegrityStatus === 'warning' ? 'Warning' : 'Needs Attention'}
              </span>
            </div>
            <div>
              <div className="text-xl font-display font-extrabold text-neu-primary">{String(latestResult.overallIntegrityStatus || 'PASS').toUpperCase()}</div>
              <div className="text-[11px] text-neu-muted mt-0.5">Mathematical hash & balancing verified</div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-neu-muted italic pt-2 border-t border-neu-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>This is an operational summary only. Derived strictly from latest local reconciliation batch.</span>
          <span className="font-mono font-bold text-neu-primary">Batch: {latestResult.batchId}</span>
        </div>
      </div>

      {/* Controller Action Queue */}
      <ControllerActionQueue onSelectTransaction={onNavigateToRecon} />

      {/* ========================================================================= */}
      {/* CASH VALUE FUNNEL & RECONCILIATION STATUS DUAL-CARD GRID                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ======================================================== */}
        {/* 1. CASH VALUE FUNNEL (2 Columns)                         */}
        {/* ======================================================== */}
        <div className="lg:col-span-2 p-6 sm:p-8 bg-neu-base rounded-[32px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-neu-primary flex items-center gap-2">
                  <Layers className="w-5 h-5 text-neu-accent" />
                  Cash Value Funnel
                </h3>
                <p className="text-xs text-neu-muted mt-0.5">
                  Step-down realization cascade from gross captured inflow to confirmed bank cash.
                </p>
              </div>

              {/* View Toggle & Realization Tag */}
              <div className="flex items-center gap-2">
                <div className="p-1 bg-neu-base shadow-neu-inset rounded-full flex text-xs font-bold">
                  <button
                    onClick={() => setFunnelViewMode('bars')}
                    className={`px-3 py-1 rounded-full transition-all ${
                      funnelViewMode === 'bars' 
                        ? 'bg-neu-base shadow-neu-extruded text-neu-primary' 
                        : 'text-neu-muted hover:text-neu-primary'
                    }`}
                  >
                    Cascade Steps
                  </button>
                  <button
                    onClick={() => setFunnelViewMode('flow')}
                    className={`px-3 py-1 rounded-full transition-all ${
                      funnelViewMode === 'flow' 
                        ? 'bg-neu-base shadow-neu-extruded text-neu-primary' 
                        : 'text-neu-muted hover:text-neu-primary'
                    }`}
                  >
                    Realization Curve
                  </button>
                </div>
                <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#9EEB75] hidden sm:inline-block">
                  {realizationRate}% Realized
                </span>
              </div>
            </div>

            {/* CHART DISPLAY AREA */}
            <div className="h-64 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                {funnelViewMode === 'bars' ? (
                  <BarChart data={funnelStages} margin={{ top: 15, right: 10, left: -5, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                    <XAxis 
                      dataKey="displayName" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} 
                      angle={-20}
                      textAnchor="end"
                      height={42}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 10 }} 
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: '#F1F5F9', 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '6px 6px 12px #D9E2EC, -6px -6px 12px #FFFFFF' 
                      }}
                      formatter={(val: any, name: any, item: any) => [
                        `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${item.payload.pctOfGross}% of Gross)`,
                        item.payload.stage
                      ]}
                      labelFormatter={(label, items) => items?.[0]?.payload?.detail || label}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={34}>
                      {funnelStages.map((entry, index) => (
                        <Cell key={`funnel-bar-${index}`} fill={entry.fillColor} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={flowRealizationData} margin={{ top: 15, right: 15, left: -5, bottom: 15 }}>
                    <defs>
                      <linearGradient id="realizationGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9EEB75" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#9EEB75" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 10 }} 
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: '#F1F5F9', 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '6px 6px 12px #D9E2EC, -6px -6px 12px #FFFFFF' 
                      }}
                      formatter={(val: any) => [
                        `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
                        'Realized Cash'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#9EEB75" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#realizationGradient)" 
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* STAGE BREAKDOWN PILLS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-neu-muted/15">
              <div className="p-2.5 bg-neu-base shadow-neu-inset rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-neu-muted block">Gross Captured</span>
                <span className="text-xs font-extrabold text-neu-primary block mt-0.5">
                  ₹{amountSummary.grossPaymentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="p-2.5 bg-neu-base shadow-neu-inset rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-neu-muted block">MDR & Deductions</span>
                <span className="text-xs font-extrabold text-[#E74C3C] block mt-0.5">
                  -₹{totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="p-2.5 bg-neu-base shadow-neu-inset rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-neu-muted block">In-Transit Pipeline</span>
                <span className="text-xs font-extrabold text-[#F39C12] block mt-0.5">
                  ₹{inTransitAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="p-2.5 bg-neu-base shadow-neu-inset rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-neu-muted block">Confirmed Bank Cash</span>
                <span className="text-xs font-extrabold text-[#2E7D32] block mt-0.5">
                  ₹{amountSummary.bankCreditedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neu-muted/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] text-neu-muted font-medium">
            <span>Formula: Net Expected = Gross − MDR − GST on MDR − Refunds − Chargebacks</span>
            <span className="font-mono font-bold text-neu-primary">
              Realization Rate: {realizationRate}%
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. RECONCILIATION STATUS DONUT (1 Column)                 */}
        {/* ======================================================== */}
        <div className="p-6 sm:p-8 bg-neu-base rounded-[32px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-neu-primary flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#9EEB75]" />
                  Reconciliation Status
                </h3>
                <p className="text-xs text-neu-muted mt-0.5">
                  Transaction match outcome distribution.
                </p>
              </div>
              <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-extrabold text-[#9EEB75]">
                {latestResult.matchRate.toFixed(1)}%
              </span>
            </div>

            {/* DONUT CHART CONTAINER */}
            <div className="relative h-56 w-full flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={84}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {activePieData.map((entry, index) => (
                      <Cell key={`status-pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#F1F5F9', 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '6px 6px 12px #D9E2EC, -6px -6px 12px #FFFFFF' 
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} rows (${item.payload.pct}%)`,
                      item.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Match Rate Summary */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-display font-extrabold text-neu-primary tracking-tight">
                  {latestResult.matchRate.toFixed(1)}%
                </span>
                <span className="text-[10px] font-bold text-neu-muted uppercase tracking-wider mt-0.5">
                  Match Rate
                </span>
              </div>
            </div>

            {/* STATUS CARDS LEGEND */}
            <div className="space-y-2 mt-1">
              <div className="p-2.5 bg-neu-base shadow-neu-inset rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9EEB75] flex-shrink-0"></span>
                  <span className="text-xs font-bold text-neu-primary">Fully Matched</span>
                </div>
                <div className="text-right font-mono text-xs font-extrabold text-neu-primary">
                  {latestResult.fullyMatched} <span className="text-[10px] text-neu-muted font-normal">({((latestResult.fullyMatched / totalBatchCount) * 100).toFixed(1)}%)</span>
                </div>
              </div>

              <div className="p-2.5 bg-neu-base shadow-neu-inset rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F39C12] flex-shrink-0"></span>
                  <span className="text-xs font-bold text-neu-primary">Partial Match</span>
                </div>
                <div className="text-right font-mono text-xs font-extrabold text-neu-primary">
                  {latestResult.partialMatches} <span className="text-[10px] text-neu-muted font-normal">({((latestResult.partialMatches / totalBatchCount) * 100).toFixed(1)}%)</span>
                </div>
              </div>

              <div className="p-2.5 bg-neu-base shadow-neu-inset rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E74C3C] flex-shrink-0"></span>
                  <span className="text-xs font-bold text-neu-primary">Unmatched</span>
                </div>
                <div className="text-right font-mono text-xs font-extrabold text-neu-primary">
                  {latestResult.unmatched} <span className="text-[10px] text-neu-muted font-normal">({((latestResult.unmatched / totalBatchCount) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neu-muted/10 flex items-center justify-between text-[11px] text-neu-muted font-medium">
            <span>Denominator: {latestResult.batchSize} batch items</span>
            <span className="font-bold text-neu-primary font-mono">{latestResult.batchId.slice(-6)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

