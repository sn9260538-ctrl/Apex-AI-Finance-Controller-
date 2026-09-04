import React, { useRef, useState } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";
import Papa from "papaparse";
import { 
  Download, FileText, ArrowRight, ShieldCheck, AlertTriangle, 
  FileSpreadsheet, Image as ImageIcon, CheckCircle2, History, TrendingUp, DollarSign, Clock, Layers,
  Activity, Trophy
} from 'lucide-react';
import StaleWarningBanner from './StaleWarningBanner';
import Track04EvaluationSection from './Track04EvaluationSection';
import { ExceptionType } from '../types';

interface ReportsTabProps {
  onNavigateToRecon?: () => void;
}

type ReportSubTab = 'track04_eval' | 'finance_ops' | 'cash_liquidity' | 'audit_exports';

export default function ReportsTab({ onNavigateToRecon }: ReportsTabProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>('finance_ops');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  const { 
    latestResult, dataMode, lastRunTimestamp, isReconciliationStale, 
    staleReason, companyProfile, runHistory, rules, notes 
  } = useFinanceData();

  // Export PDF
  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);
    try {
      const scale = 2;
      const dataUrl = await domtoimage.toPng(reportRef.current, {
        quality: 1,
        height: reportRef.current.offsetHeight * scale,
        width: reportRef.current.offsetWidth * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${reportRef.current.offsetWidth}px`,
          height: `${reportRef.current.offsetHeight}px`
        }
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [reportRef.current.offsetWidth, reportRef.current.offsetHeight]
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, reportRef.current.offsetWidth, reportRef.current.offsetHeight);
      pdf.save(`reconciliation-report-${latestResult?.batchId || 'summary'}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Image (PNG)
  const handleExportPng = async () => {
    if (!reportRef.current) return;
    setIsExportingPng(true);
    try {
      const scale = 2;
      const dataUrl = await domtoimage.toPng(reportRef.current, {
        quality: 1,
        height: reportRef.current.offsetHeight * scale,
        width: reportRef.current.offsetWidth * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${reportRef.current.offsetWidth}px`,
          height: `${reportRef.current.offsetHeight}px`
        }
      });
      const link = document.createElement('a');
      link.download = `reconciliation-report-${latestResult?.batchId || 'summary'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Image export failed', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  // Export JSON Report
  const handleExportJson = () => {
    if (!latestResult) return;
    const exportData = {
      reportType: "Finance Operations Report",
      appVersion: "1.0.0",
      rulesVersion: "1.0.0",
      processedTimestamp: latestResult.processedAt,
      processingMode: latestResult.processingMode,
      isReconciliationStale,
      staleReason: staleReason || null,
      companyProfile,
      rulesConfiguration: rules,
      reconciliationMetrics: {
        batchId: latestResult.batchId,
        batchSize: latestResult.batchSize,
        matchRate: latestResult.matchRate,
        exceptionRate: latestResult.exceptionRate,
        fullyMatched: latestResult.fullyMatched,
        partialMatches: latestResult.partialMatches,
        unmatched: latestResult.unmatched,
        transactionsWithExceptions: latestResult.transactionsWithExceptions,
        totalExceptionItems: latestResult.totalExceptionItems,
        materialityThreshold: latestResult.materialityThreshold,
        overallIntegrityStatus: latestResult.overallIntegrityStatus
      },
      settlementBridge: latestResult.amountSummary,
      timingDistribution: latestResult.settlementTimingSummary,
      paymentMethodPerformance: latestResult.paymentMethodSummary,
      complianceScreening: latestResult.complianceScreening,
      exceptions: latestResult.exceptions,
      disclaimer: "Prototype finance-operations screening only. This application does not replace official government portals, bank records, payment-gateway settlement terms, qualified accountants, auditors, tax advisers, or legal advisers. Verify all thresholds, rates, eligibility conditions, filings, and settlement obligations before acting."
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${latestResult.batchId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Exceptions CSV
  const handleExportCsv = () => {
    if (!latestResult) return;
    const exportItems = latestResult.exceptions.map(e => ({
      'Exception ID': e.id,
      'Transaction ID': e.transactionId,
      'Source Record IDs': (e.sourceRecordIds || []).join('; '),
      'Exception Type': e.type,
      'Books Amount': e.booksAmount,
      'Payment Amount': e.paymentAmount,
      'Settlement Amount': e.settlementAmount,
      'Bank Amount': e.bankAmount,
      'Difference (₹)': e.difference,
      'Materiality Threshold (₹)': e.materialityThreshold,
      'Threshold Exceeded': e.thresholdExceeded ? 'Yes' : 'No',
      'Action Reason': e.actionReason,
      'Payment Date': e.paymentDate,
      'Settlement Date': e.settlementDate,
      'Bank Credit Date': e.bankCreditDate || '',
      'Settlement Timing (Days)': e.daysDifference,
      'Bank-Credit Timing (Days)': e.bankCreditTimingDays || 0,
      'Rule Applied': e.ruleApplied,
      'Deterministic Confidence': e.deterministicMatchConfidence,
      'Action': e.recommendedAction,
      'Freshness': isReconciliationStale ? 'Stale / Outdated' : 'Fresh',
      'Internal Notes': notes[e.id] || e.internalNote || ''
    }));
    
    const csv = Papa.unparse(exportItems);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exceptions-report-${latestResult.batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Comprehensive Audit Bundle (JSON)
  const handleExportAuditBundle = () => {
    if (!latestResult) return;
    const auditBundle = {
      exportType: 'Apex Financial Controller Audit Bundle',
      generatedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      reconciliationResult: latestResult,
      integrityHash: {
        batchId: latestResult.batchId,
        rulesFingerprint: latestResult.rulesFingerprint || 'std-rules-v1',
        datasetFingerprint: latestResult.datasetFingerprint || 'std-dataset-v1',
        materialityThreshold: latestResult.materialityThreshold,
        overallIntegrityStatus: latestResult.overallIntegrityStatus
      },
      auditDenominator: {
        definition: latestResult.denominatorDefinition,
        batchSize: latestResult.batchSize,
        matchRate: latestResult.matchRate,
        exceptionCount: latestResult.transactionsWithExceptions
      },
      balanceSheetTrace: {
        grossInflow: latestResult.amountSummary.grossPaymentValue,
        mdrDeductions: latestResult.amountSummary.totalMdr,
        gstDeductions: latestResult.amountSummary.totalGstOnMdr,
        refunds: latestResult.amountSummary.totalRefunds,
        chargebacks: latestResult.amountSummary.totalChargebacks,
        adjustments: latestResult.amountSummary.totalAdjustments,
        expectedNet: latestResult.amountSummary.expectedSettlementValue,
        bankDeposited: latestResult.amountSummary.bankCreditedValue,
        uncreditedInTransit: latestResult.amountSummary.uncreditedBankValue,
        totalExceptionExposure: latestResult.amountSummary.totalExceptionExposure
      },
      disclaimer: "Prototype finance-operations screening only. This application does not replace official government portals, bank records, payment-gateway settlement terms, qualified accountants, auditors, tax advisers, or legal advisers. Verify all thresholds, rates, eligibility conditions, filings, and settlement obligations before acting."
    };

    const blob = new Blob([JSON.stringify(auditBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-bundle-${latestResult.batchId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Honest Empty State if no latestResult
  if (!latestResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fade-in">
        <div className="w-24 h-24 bg-neu-base shadow-neu-extruded rounded-[32px] flex items-center justify-center">
          <FileText className="w-10 h-10 text-neu-muted" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-display font-bold text-neu-primary">No completed reconciliation run yet.</h2>
          <p className="text-neu-muted text-sm leading-relaxed">
            Load synthetic demo data or upload Invoices, Payments, Settlements, and Bank Credits, then run the local reconciliation engine to generate reports.
          </p>
        </div>
        {onNavigateToRecon && (
          <button
            onClick={onNavigateToRecon}
            className="px-8 py-3.5 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full font-bold text-sm text-neu-primary flex items-center gap-2 transition-all"
          >
            Go to Reconciliation
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  const { amountSummary, exceptions, settlementTimingSummary, paymentMethodSummary } = latestResult;

  // ==========================================
  // CHART 1: RECONCILIATION HEALTH (DONUT)
  // ==========================================
  const healthSegments = [
    { name: 'Fully Matched', value: latestResult.fullyMatched, color: '#9EEB75', status: 'Fully Matched' },
    { name: 'Partial Match', value: latestResult.partialMatches, color: '#F39C12', status: 'Partial Match' },
    { name: 'Unmatched', value: latestResult.unmatched, color: '#E74C3C', status: 'Unmatched' },
  ].filter(d => d.value > 0);

  // ==========================================
  // CHART 2: GROSS-TO-NET SETTLEMENT BRIDGE
  // ==========================================
  // Formula: Expected Net Settlement = Gross Payment - MDR - GST on MDR - Refunds - Chargebacks - Adjustments
  const bridgeData = [
    {
      step: 'Gross Payments',
      displayName: 'Gross Inflow',
      value: amountSummary.grossPaymentValue,
      type: 'positive',
      fillColor: '#3498DB',
      isDeduction: false,
      detail: 'Total value of captured payments'
    },
    {
      step: 'MDR Fees',
      displayName: 'Less: MDR',
      value: amountSummary.totalMdr,
      type: 'deduction',
      fillColor: '#E74C3C',
      isDeduction: true,
      detail: 'Merchant discount rate / Gateway charges'
    },
    {
      step: 'GST on MDR',
      displayName: 'Less: GST on MDR',
      value: amountSummary.totalGstOnMdr,
      type: 'deduction',
      fillColor: '#E74C3C',
      isDeduction: true,
      detail: '18% GST applicable on gateway fee'
    },
    {
      step: 'Refunds',
      displayName: 'Less: Refunds',
      value: amountSummary.totalRefunds,
      type: 'deduction',
      fillColor: '#F39C12',
      isDeduction: true,
      detail: 'Customer reversed transactions'
    },
    {
      step: 'Chargebacks',
      displayName: 'Less: Chargebacks',
      value: amountSummary.totalChargebacks,
      type: 'deduction',
      fillColor: '#E74C3C',
      isDeduction: true,
      detail: 'Bank dispute clawbacks'
    },
    {
      step: 'Adjustments',
      displayName: 'Less: Adjustments',
      value: amountSummary.totalAdjustments,
      type: 'deduction',
      fillColor: '#94A3B8',
      isDeduction: true,
      detail: 'Manual settlement corrections'
    },
    {
      step: 'Expected Net',
      displayName: 'Net Expected',
      value: amountSummary.expectedSettlementValue,
      type: 'subtotal',
      fillColor: '#2B4C7E',
      isDeduction: false,
      detail: 'Gross payments minus all deductions'
    },
    {
      step: 'Uncredited Bank',
      displayName: 'Less: In-Transit',
      value: amountSummary.uncreditedBankValue,
      type: 'deduction',
      fillColor: '#F39C12',
      isDeduction: true,
      detail: 'Settled by gateway but pending bank credit'
    },
    {
      step: 'Bank Credited',
      displayName: 'Bank Cash',
      value: amountSummary.bankCreditedValue,
      type: 'final',
      fillColor: '#9EEB75',
      isDeduction: false,
      detail: 'Confirmed liquidity deposited in bank account'
    }
  ];

  // ==========================================
  // CHART 3: EXCEPTION EXPOSURE BY TYPE
  // ==========================================
  const allExceptionCategories: ExceptionType[] = [
    'Amount_Mismatch',
    'Missing_in_Payment',
    'Missing_in_Settlement',
    'Missing_in_Bank',
    'Duplicate',
    'Timing_Difference',
    'Bank_Credit_Timing_Difference',
    'Partial_Match',
    'Data_Quality_Issue',
    'Potential_GST_ITC_Variance',
    'Potential_TDS_Shortfall'
  ];

  const typeCountMap = new Map<ExceptionType, number>();
  const typeExposureMap = new Map<ExceptionType, number>();

  allExceptionCategories.forEach(type => {
    typeCountMap.set(type, 0);
    typeExposureMap.set(type, 0);
  });

  exceptions.forEach(e => {
    const currentCount = typeCountMap.get(e.type) || 0;
    typeCountMap.set(e.type, currentCount + 1);

    // Calculate exposure strictly from verified fields
    let itemExposure = 0;
    if (e.difference && Math.abs(e.difference) > 0) {
      itemExposure = Math.abs(e.difference);
    } else if (e.type === 'Missing_in_Settlement' || e.type === 'Missing_in_Bank') {
      itemExposure = Math.abs(e.settlementAmount || e.paymentAmount || e.booksAmount || e.bankAmount || 0);
    } else if (e.type === 'Duplicate') {
      itemExposure = Math.abs(e.paymentAmount || e.booksAmount || 0);
    } else if (e.type === 'Missing_in_Payment') {
      itemExposure = Math.abs(e.booksAmount || 0);
    } else if (e.type === 'Partial_Match') {
      itemExposure = Math.abs(e.difference || 0);
    } else {
      // For timing differences or data quality issues without direct INR variance, do not invent amount
      itemExposure = 0;
    }

    const currentExposure = typeExposureMap.get(e.type) || 0;
    typeExposureMap.set(e.type, currentExposure + itemExposure);
  });

  const exceptionExposureData = allExceptionCategories
    .map(type => ({
      rawType: type,
      name: String(type || '').replace(/_/g, ' '),
      exposure: typeExposureMap.get(type) || 0,
      count: typeCountMap.get(type) || 0
    }))
    .filter(item => item.count > 0 || item.exposure > 0)
    .sort((a, b) => b.exposure - a.exposure || b.count - a.count);

  // ==========================================
  // CHART 4: SETTLEMENT & BANK CREDIT TIMING DISTRIBUTION
  // ==========================================
  const timingDistributionData = [
    { name: 'Same Day', count: settlementTimingSummary?.sameDay || 0, color: '#9EEB75', target: 'Fastest' },
    { name: 'T+1 Day', count: settlementTimingSummary?.tPlus1 || 0, color: '#3498DB', target: 'Standard' },
    { name: 'T+2 Days', count: settlementTimingSummary?.tPlus2 || 0, color: '#F39C12', target: 'Standard' },
    { name: 'T+3+ Days', count: settlementTimingSummary?.tPlus3OrMore || 0, color: '#E74C3C', target: 'Extended' }
  ];

  // ==========================================
  // CHART 5: PAYMENT METHOD PERFORMANCE & MATCH RATES
  // ==========================================
  const methodPerformanceData = (paymentMethodSummary || []).map(m => ({
    name: m.paymentMethod,
    matchRate: parseFloat((m.matchRate || 0).toFixed(1)),
    settlementValue: Math.round(m.settlementValue || 0),
    transactions: m.transactionCount || 0,
    fullyMatched: m.fullyMatched || 0,
    exceptions: m.exceptionCount || 0
  }));

  // ==========================================
  // CHART 6: MULTI-BATCH HISTORICAL TRENDS
  // ==========================================
  const historyTrendData = runHistory && runHistory.length > 0
    ? [...runHistory].reverse().map((run, idx) => ({
        batchName: `Run ${idx + 1} (${String(run.batchId || '').slice(-4)})`,
        batchId: run.batchId,
        matchRate: parseFloat((run.matchRate || 0).toFixed(1)),
        exposure: Math.round(run.totalExceptionExposure || 0),
        confirmedCash: Math.round(run.confirmedBankCash || 0),
        batchSize: run.batchSize || 0,
        exceptions: run.transactionsWithExceptions || 0,
        date: run.processedAt ? new Date(run.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'
      }))
    : [{
        batchName: `Current (${String(latestResult?.batchId || '').slice(-4)})`,
        batchId: latestResult?.batchId || 'BATCH-001',
        matchRate: parseFloat((latestResult?.matchRate || 0).toFixed(1)),
        exposure: Math.round(amountSummary?.totalExceptionExposure || 0),
        confirmedCash: Math.round(amountSummary?.bankCreditedValue || 0),
        batchSize: latestResult?.batchSize || 0,
        exceptions: latestResult?.transactionsWithExceptions || 0,
        date: latestResult?.processedAt ? new Date(latestResult.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Current'
      }];

  const subTabs = [
    { id: 'track04_eval' as ReportSubTab, label: 'Controller Evaluation', icon: Trophy },
    { id: 'finance_ops' as ReportSubTab, label: 'Finance Operations', icon: Activity },
    { id: 'cash_liquidity' as ReportSubTab, label: 'Cash & Liquidity', icon: DollarSign },
    { id: 'audit_exports' as ReportSubTab, label: 'Audit Exports', icon: Download },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* REPORTS PAGE HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-neu-primary">Finance Reports & Analytics</h2>
          <p className="text-sm text-neu-muted mt-1 max-w-2xl">
            Reconciliation performance, liquidity realization, and deterministic audit exports.
          </p>
        </div>

        {/* Metadata Badges & Export Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-neu-primary font-mono">
              Batch: {latestResult.batchId}
            </span>
            <span className="px-3 py-1.5 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-neu-primary">
              {dataMode}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              isReconciliationStale 
                ? 'bg-[#F39C12]/20 text-[#D68910] border border-[#F39C12]/40' 
                : 'bg-[#9EEB75]/20 text-[#2E7D32] border border-[#9EEB75]/40'
            }`}>
              {isReconciliationStale ? 'Previous result — rerun required' : 'Current'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={handleExportPdf} 
              disabled={isExportingPdf} 
              className="px-4 py-2.5 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full font-bold text-xs text-neu-primary flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Export complete report as high-resolution PDF"
            >
              <Download className="w-3.5 h-3.5" />
              {isExportingPdf ? 'Saving PDF...' : 'Export PDF'}
            </button>
            <button 
              onClick={handleExportPng} 
              disabled={isExportingPng} 
              className="px-4 py-2.5 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full font-bold text-xs text-neu-primary flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Export report dashboard image"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              {isExportingPng ? 'Saving Image...' : 'Export Image'}
            </button>
            <button 
              onClick={handleExportJson} 
              className="px-4 py-2.5 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full font-bold text-xs text-neu-primary flex items-center gap-1.5 transition-all"
              title="Download structured JSON report"
            >
              <FileText className="w-3.5 h-3.5" />
              JSON
            </button>
            <button 
              onClick={handleExportCsv} 
              className="px-4 py-2.5 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full font-bold text-xs text-neu-primary flex items-center gap-1.5 transition-all"
              title="Download exception items in CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-neu-base shadow-neu-inset text-neu-accent font-extrabold'
                  : 'bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover text-neu-muted hover:text-neu-primary'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-neu-accent' : 'text-neu-muted'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Stale Warning Banner */}
      <StaleWarningBanner onRunRecon={onNavigateToRecon} />

      {/* SUB-VIEW 0: CONTROLLER EVALUATION */}
      {activeSubTab === 'track04_eval' && (
        <div className="animate-fade-in">
          <Track04EvaluationSection onSelectTransaction={onNavigateToRecon} />
        </div>
      )}

      {/* SUB-VIEW 1: FINANCE OPERATIONS */}
      {activeSubTab === 'finance_ops' && (
        <div ref={reportRef} className="space-y-8 bg-neu-base p-6 sm:p-10 rounded-[36px] shadow-neu-inset animate-fade-in">
          {/* Document Header */}
          <div className="p-6 bg-neu-base rounded-2xl shadow-neu-extruded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neu-muted/20">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-display font-extrabold text-neu-primary">{companyProfile.companyName}</h3>
                {isReconciliationStale && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#F39C12]/20 text-[#D68910]">
                    Previous reconciliation result — rerun required
                  </span>
                )}
              </div>
              <p className="text-xs text-neu-muted mt-1 font-medium">
                Batch: <span className="font-mono font-bold text-neu-primary">{latestResult.batchId}</span> • 
                Mode: <span className="font-bold text-neu-primary">{latestResult.processingMode}</span> • 
                Reconciled: <span className="font-bold text-neu-primary">{new Date(lastRunTimestamp!).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-neu-primary flex-wrap">
              <div className="p-2.5 bg-neu-base shadow-neu-inset rounded-xl">
                <span className="text-[10px] text-neu-muted block uppercase tracking-wider">Materiality</span>
                ₹{latestResult.materialityThreshold.toLocaleString('en-IN')}
              </div>
              <div className="p-2.5 bg-neu-base shadow-neu-inset rounded-xl">
                <span className="text-[10px] text-neu-muted block uppercase tracking-wider">Integrity</span>
                <span className={latestResult.overallIntegrityStatus === 'pass' ? 'text-[#2E7D32]' : 'text-[#D68910]'}>
                  {String(latestResult.overallIntegrityStatus || 'PASS').toUpperCase()}
                </span>
              </div>
              <div className="p-2.5 bg-neu-base shadow-neu-inset rounded-xl">
                <span className="text-[10px] text-neu-muted block uppercase tracking-wider">Batch Size</span>
                {latestResult.batchSize} Rows
              </div>
            </div>
          </div>

          {/* 4 Finance Operations Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CHART 1: RECONCILIATION HEALTH */}
            <div className="p-6 sm:p-8 bg-neu-base rounded-[32px] shadow-neu-extruded flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-neu-primary">Reconciliation Health</h3>
                    <p className="text-xs text-neu-muted">Final status across the complete batch.</p>
                  </div>
                  <span className={`px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-extrabold ${
                    latestResult.matchRate.toFixed(1) === '100.0' ? 'text-[#9EEB75]' : 
                    latestResult.matchRate.toFixed(1) === '0.0' ? 'text-[#E74C3C]' : 
                    'text-[#F39C12]'
                  }`}>
                    {latestResult.matchRate.toFixed(1)}% Matched
                  </span>
                </div>

                {latestResult.batchSize > 0 ? (
                  <div className="relative h-64 flex items-center justify-center my-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={healthSegments}
                          cx="50%"
                          cy="50%"
                          innerRadius={68}
                          outerRadius={92}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {healthSegments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#F1F5F9', borderRadius: '16px', border: 'none', boxShadow: '6px 6px 12px #D9E2EC' }}
                          formatter={(val: any, name: any, item: any) => [
                            `${val} (${((Number(val) / latestResult.batchSize) * 100).toFixed(1)}%)`,
                            item.payload.status
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Centered Match Rate Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-display font-extrabold text-neu-primary tracking-tight">
                        {latestResult.matchRate.toFixed(1)}%
                      </span>
                      <span className="text-[11px] font-bold text-neu-muted mt-0.5">
                        {latestResult.fullyMatched} of {latestResult.batchSize} fully matched
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-neu-muted font-bold text-sm">
                    No batch transactions recorded.
                  </div>
                )}

                {/* Status Breakdown Legend */}
                <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-neu-muted/15 text-center">
                  <div className="p-2 bg-neu-base shadow-neu-inset rounded-xl">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-neu-primary">
                      <span className="w-2 h-2 rounded-full bg-[#9EEB75]"></span>
                      Matched
                    </div>
                    <span className="text-xs font-extrabold text-neu-primary mt-1 block">
                      {latestResult.fullyMatched} ({((latestResult.fullyMatched / (latestResult.batchSize || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="p-2 bg-neu-base shadow-neu-inset rounded-xl">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-neu-primary">
                      <span className="w-2 h-2 rounded-full bg-[#F39C12]"></span>
                      Partial
                    </div>
                    <span className="text-xs font-extrabold text-neu-primary mt-1 block">
                      {latestResult.partialMatches} ({((latestResult.partialMatches / (latestResult.batchSize || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="p-2 bg-neu-base shadow-neu-inset rounded-xl">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-neu-primary">
                      <span className="w-2 h-2 rounded-full bg-[#E74C3C]"></span>
                      Unmatched
                    </div>
                    <span className="text-xs font-extrabold text-neu-primary mt-1 block">
                      {latestResult.unmatched} ({((latestResult.unmatched / (latestResult.batchSize || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neu-muted/10 space-y-1">
                <p className="text-[11px] text-neu-muted font-semibold">
                  Match Rate = Fully Matched ÷ Batch Size × 100.
                </p>
                <p className="text-[10px] text-neu-muted italic">
                  Complete-batch result — not a selected sample.
                </p>
              </div>
            </div>

            {/* CHART 2: GROSS-TO-NET SETTLEMENT BRIDGE */}
            <div className="p-6 sm:p-8 bg-neu-base rounded-[32px] shadow-neu-extruded flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-neu-primary">Gross-to-Net Settlement Bridge</h3>
                    <p className="text-xs text-neu-muted">Deduction cascade from gross payments to net bank credits.</p>
                  </div>
                  <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-neu-accent">
                    ₹{amountSummary.grossPaymentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Gross
                  </span>
                </div>

                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bridgeData} margin={{ top: 15, right: 10, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis 
                        dataKey="displayName" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748B', fontSize: 9, fontWeight: 'bold' }} 
                        angle={-25}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 9 }} 
                        tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} 
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#F1F5F9', borderRadius: '14px', border: 'none', boxShadow: '6px 6px 12px #D9E2EC' }}
                        formatter={(val: any, name: any, item: any) => [
                          `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${item.payload.isDeduction ? 'Deduction' : 'Value'})`,
                          item.payload.step
                        ]}
                        labelFormatter={(label, items) => items?.[0]?.payload?.detail || label}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {bridgeData.map((entry, index) => (
                          <Cell key={`bridge-cell-${index}`} fill={entry.fillColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-neu-muted/15 text-center">
                  <div className="p-2 bg-neu-base shadow-neu-inset rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-neu-muted block">Gross Payments</span>
                    <span className="text-xs font-extrabold text-neu-primary block mt-0.5">
                      ₹{amountSummary.grossPaymentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="p-2 bg-neu-base shadow-neu-inset rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-neu-muted block">Total Deductions</span>
                    <span className="text-xs font-extrabold text-[#E74C3C] block mt-0.5">
                      -₹{(amountSummary.totalMdr + amountSummary.totalGstOnMdr + amountSummary.totalRefunds + amountSummary.totalChargebacks + amountSummary.totalAdjustments).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="p-2 bg-neu-base shadow-neu-inset rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-neu-muted block">Bank Credited</span>
                    <span className="text-xs font-extrabold text-[#9EEB75] block mt-0.5">
                      ₹{amountSummary.bankCreditedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neu-muted/10 space-y-1">
                <p className="text-[10px] text-neu-muted font-mono font-medium leading-tight">
                  Expected Net Settlement = Gross − MDR − GST on MDR − Refunds − Chargebacks − Adjustments
                </p>
                <p className="text-[10px] text-neu-muted italic">
                  Expected settlement is calculated from supplied deduction evidence.
                </p>
              </div>
            </div>

            {/* CHART 3: EXCEPTION EXPOSURE BY TYPE */}
            <div className="p-6 sm:p-8 bg-neu-base rounded-[32px] shadow-neu-extruded flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-neu-primary">Exception Exposure by Type</h3>
                    <p className="text-xs text-neu-muted">Total INR value requiring review, grouped by exception type.</p>
                  </div>
                  <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-extrabold text-[#E74C3C]">
                    ₹{amountSummary.totalExceptionExposure.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Total Exp.
                  </span>
                </div>

                <div className="h-64 mt-4">
                  {exceptionExposureData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={exceptionExposureData} layout="vertical" margin={{ top: 5, right: 20, left: 15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" opacity={0.5} />
                        <XAxis 
                          type="number" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94A3B8', fontSize: 9 }} 
                          tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} 
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#475569', fontSize: 9, fontWeight: 'bold' }} 
                          width={110} 
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#F1F5F9', borderRadius: '14px', border: 'none', boxShadow: '6px 6px 12px #D9E2EC' }}
                          formatter={(val: any, name: any, item: any) => [
                            `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${item.payload.count} items)`,
                            'Exception Exposure'
                          ]}
                        />
                        <Bar dataKey="exposure" fill="#E74C3C" radius={[0, 4, 4, 0]} barSize={16}>
                          {exceptionExposureData.map((entry, idx) => (
                            <Cell key={`exc-cell-${idx}`} fill={entry.exposure > 0 ? '#E74C3C' : '#94A3B8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neu-muted font-bold text-sm">
                      <CheckCircle2 className="w-8 h-8 text-[#9EEB75] mb-2" />
                      No exceptions recorded in this batch.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neu-muted/10 flex items-center justify-between text-[11px] text-neu-muted font-medium">
                <span>{latestResult.transactionsWithExceptions} transaction(s) with unresolved differences</span>
                <span>Materiality: ₹{latestResult.materialityThreshold.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* CHART 6: MULTI-BATCH HISTORICAL TRENDS */}
            <div className="p-6 sm:p-8 bg-neu-base rounded-[32px] shadow-neu-extruded flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-neu-primary">Multi-Batch Reconciliation Trend</h3>
                    <p className="text-xs text-neu-muted">Historical match rate consistency and exception exposure over past runs.</p>
                  </div>
                  <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-neu-primary">
                    {historyTrendData.length} Batches Tracked
                  </span>
                </div>

                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={historyTrendData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis 
                        dataKey="batchName" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748B', fontSize: 9, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        yAxisId="left" 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 9 }} 
                        tickFormatter={(v) => `${v}%`} 
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 9 }} 
                        tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} 
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#F1F5F9', borderRadius: '14px', border: 'none', boxShadow: '6px 6px 12px #D9E2EC' }}
                        formatter={(val: any, name: any) => [
                          name === 'matchRate' ? `${val}%` : `₹${Number(val).toLocaleString('en-IN')}`,
                          name === 'matchRate' ? 'Match Rate' : 'Exception Exposure'
                        ]}
                      />
                      <Bar yAxisId="right" dataKey="exposure" fill="#E74C3C" radius={[4, 4, 0, 0]} barSize={24} name="Exception Exposure" />
                      <Line yAxisId="left" type="monotone" dataKey="matchRate" stroke="#9EEB75" strokeWidth={3} dot={{ r: 4, fill: '#9EEB75' }} name="Match Rate" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neu-muted/10 flex items-center justify-between text-[11px] text-neu-muted font-medium">
                <span>Benchmark Target: 100.0% Match Rate • ₹0 Exception Exposure</span>
                <span className="text-[#9EEB75] font-bold">Target: 100%</span>
              </div>
            </div>
          </div>

          {/* Audit Denominator Footer */}
          <div className="p-5 rounded-2xl bg-neu-base shadow-neu-extruded-sm text-xs text-neu-muted space-y-2 border-t border-neu-muted/15">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-bold text-neu-primary">
              <span>
                Audit Denominator: {latestResult.denominatorDefinition} ({latestResult.batchSize} rows) • Match Rate: {latestResult.matchRate.toFixed(1)}% • Exceptions: {latestResult.transactionsWithExceptions}
              </span>
              <span className="text-[11px] text-neu-muted">
                Rules Fingerprint: {latestResult.rulesFingerprint?.slice(0, 8) || 'std'} • Dataset: {latestResult.datasetFingerprint?.slice(0, 8) || 'std'}
              </span>
            </div>
            <p className="italic text-[11px] text-neu-muted leading-relaxed">
              Prototype finance-operations screening only. This application does not replace official government portals, bank records, payment-gateway settlement terms, qualified accountants, auditors, tax advisers, or legal advisers. Verify all thresholds, rates, eligibility conditions, filings, and settlement obligations before acting.
            </p>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: CASH & LIQUIDITY */}
      {activeSubTab === 'cash_liquidity' && (
        <div className="space-y-8 animate-fade-in">
          {/* Liquidity High-Level Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-[#9EEB75] rounded-[28px] shadow-neu-extruded flex flex-col justify-between">
              <span className="text-xs font-bold text-neu-primary/80 uppercase">Confirmed Bank Cash</span>
              <div className="text-2xl font-display font-extrabold text-neu-primary my-2">
                ₹{amountSummary.bankCreditedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-neu-primary/70">Deposited and verified in bank feed</span>
            </div>

            <div className="p-6 bg-neu-base rounded-[28px] shadow-neu-extruded flex flex-col justify-between">
              <span className="text-xs font-bold text-neu-muted uppercase">Pending Pipeline</span>
              <div className="text-2xl font-display font-extrabold text-neu-accent my-2">
                ₹{amountSummary.pendingSettlementValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-neu-muted">Gateway capture awaiting settlement</span>
            </div>

            <div className="p-6 bg-neu-base rounded-[28px] shadow-neu-extruded flex flex-col justify-between">
              <span className="text-xs font-bold text-neu-muted uppercase">In-Transit / Uncredited</span>
              <div className="text-2xl font-display font-extrabold text-[#F39C12] my-2">
                ₹{amountSummary.uncreditedBankValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-neu-muted">Settled by gateway, pending bank credit</span>
            </div>

            <div className="p-6 bg-neu-base rounded-[28px] shadow-neu-extruded flex flex-col justify-between">
              <span className="text-xs font-bold text-neu-muted uppercase">Total Deductions</span>
              <div className="text-2xl font-display font-extrabold text-[#E74C3C] my-2">
                ₹{(amountSummary.totalMdr + amountSummary.totalGstOnMdr + amountSummary.totalRefunds + amountSummary.totalChargebacks + amountSummary.totalAdjustments).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-neu-muted">MDR, GST, refunds & adjustments</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CHART 4: SETTLEMENT & BANK CREDIT TIMING DISTRIBUTION */}
            <div className="p-6 sm:p-8 bg-neu-base rounded-[32px] shadow-neu-extruded flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-neu-primary">Settlement & Credit Latency</h3>
                    <p className="text-xs text-neu-muted">Turnaround time from payment capture to bank credit realization.</p>
                  </div>
                  <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-neu-primary">
                    {settlementTimingSummary.sameDay + settlementTimingSummary.tPlus1 + settlementTimingSummary.tPlus2 + settlementTimingSummary.tPlus3OrMore} Batched
                  </span>
                </div>

                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timingDistributionData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 9 }} 
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#F1F5F9', borderRadius: '14px', border: 'none', boxShadow: '6px 6px 12px #D9E2EC' }}
                        formatter={(val: any, name: any, item: any) => [
                          `${val} transactions (${item.payload.target})`,
                          'Timing Volume'
                        ]}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                        {timingDistributionData.map((entry, index) => (
                          <Cell key={`timing-cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neu-muted/10 grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-neu-base shadow-neu-inset rounded-xl">
                  <span className="text-[10px] text-neu-muted uppercase font-bold block">Settlement Overdue</span>
                  <span className={`text-xs font-extrabold block mt-0.5 ${settlementTimingSummary.timingReviewCount > 0 ? 'text-[#E74C3C]' : 'text-[#2E7D32]'}`}>
                    {settlementTimingSummary.timingReviewCount} records ({rules.timingThreshold}d+ threshold)
                  </span>
                </div>
                <div className="p-2 bg-neu-base shadow-neu-inset rounded-xl">
                  <span className="text-[10px] text-neu-muted uppercase font-bold block">Bank Credit Overdue</span>
                  <span className={`text-xs font-extrabold block mt-0.5 ${(settlementTimingSummary.bankCreditTimingReviewCount || 0) > 0 ? 'text-[#F39C12]' : 'text-[#2E7D32]'}`}>
                    {settlementTimingSummary.bankCreditTimingReviewCount || 0} records
                  </span>
                </div>
              </div>
            </div>

            {/* CHART 5: PAYMENT METHOD PERFORMANCE & MATCH RATES */}
            <div className="p-6 sm:p-8 bg-neu-base rounded-[32px] shadow-neu-extruded flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-neu-primary">Payment Rail Performance</h3>
                    <p className="text-xs text-neu-muted">Channel volume and reconciliation match rates by rail.</p>
                  </div>
                  <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-neu-primary">
                    {methodPerformanceData.length} Rails
                  </span>
                </div>

                <div className="h-64 mt-4">
                  {methodPerformanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={methodPerformanceData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <YAxis 
                          yAxisId="left" 
                          domain={[0, 100]} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94A3B8', fontSize: 9 }} 
                          tickFormatter={(v) => `${v}%`} 
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94A3B8', fontSize: 9 }} 
                          tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} 
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#F1F5F9', borderRadius: '14px', border: 'none', boxShadow: '6px 6px 12px #D9E2EC' }}
                          formatter={(val: any, name: any) => [
                            name === 'matchRate' ? `${val}%` : `₹${Number(val).toLocaleString('en-IN')}`,
                            name === 'matchRate' ? 'Match Rate' : 'Settlement Value'
                          ]}
                        />
                        <Bar yAxisId="right" dataKey="settlementValue" fill="#CBD5E1" radius={[4, 4, 0, 0]} barSize={24} name="Settlement Value" />
                        <Line yAxisId="left" type="monotone" dataKey="matchRate" stroke="#9EEB75" strokeWidth={3} dot={{ r: 4, fill: '#9EEB75' }} name="Match Rate" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neu-muted font-bold text-sm">
                      No payment rail records found.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neu-muted/10 flex items-center justify-between text-[11px] text-neu-muted font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#CBD5E1]"></span> Bar: Volume (₹)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#9EEB75]"></span> Line: Match Rate (%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: AUDIT EXPORTS */}
      {activeSubTab === 'audit_exports' && (
        <div className="space-y-8 animate-fade-in">
          <div className="p-6 sm:p-8 bg-neu-base rounded-[32px] shadow-neu-extruded space-y-6">
            <div>
              <h3 className="text-xl font-display font-extrabold text-neu-primary">Audit & Regulatory Exports</h3>
              <p className="text-sm text-neu-muted mt-1">
                Deterministic export bundles for auditors, management reporting, and compliance verification.
              </p>
            </div>

            {/* Export Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* PDF Export Card */}
              <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-inset flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-neu-base shadow-neu-extruded flex items-center justify-center text-neu-accent mb-3">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-neu-primary">Executive PDF Report</h4>
                  <p className="text-xs text-neu-muted mt-1">High-resolution visual summary for board reviews and controller sign-offs.</p>
                </div>
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="w-full py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-2xl font-bold text-xs text-neu-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isExportingPdf ? 'Generating PDF...' : 'Download PDF'}
                </button>
              </div>

              {/* PNG Image Snapshot Card */}
              <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-inset flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-neu-base shadow-neu-extruded flex items-center justify-center text-[#9EEB75] mb-3">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-neu-primary">Report Dashboard Image</h4>
                  <p className="text-xs text-neu-muted mt-1">Export high-DPI dashboard PNG image snapshot for presentations.</p>
                </div>
                <button
                  onClick={handleExportPng}
                  disabled={isExportingPng}
                  className="w-full py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-2xl font-bold text-xs text-neu-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4" />
                  {isExportingPng ? 'Saving Image...' : 'Download Image'}
                </button>
              </div>

              {/* Structured JSON Report */}
              <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-inset flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-neu-base shadow-neu-extruded flex items-center justify-center text-[#3498DB] mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-neu-primary">Structured JSON Report</h4>
                  <p className="text-xs text-neu-muted mt-1">Machine-readable metrics, denominators, and rule parameters.</p>
                </div>
                <button
                  onClick={handleExportJson}
                  className="w-full py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-2xl font-bold text-xs text-neu-primary flex items-center justify-center gap-2 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Download JSON
                </button>
              </div>

              {/* Exceptions CSV Card */}
              <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-inset flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-neu-base shadow-neu-extruded flex items-center justify-center text-[#E74C3C] mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-neu-primary">Exceptions Audit CSV</h4>
                  <p className="text-xs text-neu-muted mt-1">Detailed list of unresolved differences, order IDs, and recommended actions.</p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="w-full py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-2xl font-bold text-xs text-neu-primary flex items-center justify-center gap-2 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Exceptions CSV
                </button>
              </div>

              {/* Controller Evaluation Export Card */}
              <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-inset flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-neu-base shadow-neu-extruded flex items-center justify-center text-neu-accent mb-3">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-neu-primary">Controller Evaluation Report</h4>
                  <p className="text-xs text-neu-muted mt-1">Full evaluation scorecard against synthetic ground truth, accuracy metrics, and honest exception ledger.</p>
                </div>
                <button
                  onClick={() => setActiveSubTab('track04_eval')}
                  className="w-full py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-2xl font-bold text-xs text-neu-primary flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-neu-accent" />
                  View & Download Evaluation Report
                </button>
              </div>

              {/* Cryptographic Audit Bundle */}
              <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-inset flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-neu-base shadow-neu-extruded flex items-center justify-center text-[#9B59B6] mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-neu-primary">Full Audit Trail Bundle</h4>
                  <p className="text-xs text-neu-muted mt-1">
                    Complete cryptographic bundle with batch ID, rules fingerprint, dataset hash, and balance sheet trace.
                  </p>
                </div>
                <button
                  onClick={handleExportAuditBundle}
                  className="w-full py-3 bg-neu-primary text-neu-base rounded-2xl font-bold text-xs shadow-neu-extruded hover:-translate-y-[1px] active:translate-y-[1px] flex items-center justify-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-[#9EEB75]" />
                  Download Complete Audit Bundle (JSON)
                </button>
              </div>
            </div>

            {/* Run Fingerprint Verification Table */}
            <div className="p-6 bg-neu-base rounded-2xl shadow-neu-extruded space-y-4">
              <h4 className="text-sm font-bold text-neu-primary uppercase tracking-wider">Run Verification Fingerprints</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-neu-base shadow-neu-inset rounded-xl">
                  <span className="text-[10px] text-neu-muted block uppercase font-bold">Batch ID</span>
                  <span className="font-mono font-bold text-neu-primary">{latestResult.batchId}</span>
                </div>
                <div className="p-3 bg-neu-base shadow-neu-inset rounded-xl">
                  <span className="text-[10px] text-neu-muted block uppercase font-bold">Rules Fingerprint</span>
                  <span className="font-mono font-bold text-neu-primary">{latestResult.rulesFingerprint || 'std-rules-v1'}</span>
                </div>
                <div className="p-3 bg-neu-base shadow-neu-inset rounded-xl">
                  <span className="text-[10px] text-neu-muted block uppercase font-bold">Dataset Fingerprint</span>
                  <span className="font-mono font-bold text-neu-primary">{latestResult.datasetFingerprint || 'std-dataset-v1'}</span>
                </div>
                <div className="p-3 bg-neu-base shadow-neu-inset rounded-xl">
                  <span className="text-[10px] text-neu-muted block uppercase font-bold">Materiality Threshold</span>
                  <span className="font-bold text-neu-primary">₹{latestResult.materialityThreshold.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 bg-neu-base shadow-neu-inset rounded-xl">
                  <span className="text-[10px] text-neu-muted block uppercase font-bold">Engine Algorithm</span>
                  <span className="font-bold text-neu-primary">Deterministic 4-Way Match v1.0</span>
                </div>
                <div className="p-3 bg-neu-base shadow-neu-inset rounded-xl">
                  <span className="text-[10px] text-neu-muted block uppercase font-bold">Reconciled At</span>
                  <span className="font-bold text-neu-primary">{new Date(latestResult.processedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
