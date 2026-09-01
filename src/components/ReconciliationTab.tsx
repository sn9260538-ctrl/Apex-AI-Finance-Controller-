import React, { useState, useRef } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { 
  FileSearch, UploadCloud, PlayCircle, CheckCircle2, AlertTriangle, 
  Download, FileText, ChevronDown, ChevronRight, Save, Database, Trash2,
  ShieldCheck, ArrowRight, Activity, X, RefreshCw
} from 'lucide-react';
import Papa from 'papaparse';
import { Invoice, Payment, Settlement, BankCredit } from '../types';
import StaleWarningBanner from './StaleWarningBanner';
import IntegrityCheckCard from './IntegrityCheckCard';
import ControllerActionQueue from './ControllerActionQueue';

interface ReconciliationTabProps {
  searchQuery?: string;
  onViewOverview?: () => void;
}

export default function ReconciliationTab({ searchQuery = "", onViewOverview }: ReconciliationTabProps) {
  const { 
    invoices, payments, settlements, bankCredits, fileNames,
    latestResult, runReconciliationWithData, updateDataset, removeDataset,
    resetDemoData, clearLocalData, dataMode, lastRunTimestamp, saveNote, 
    notes, rules, companyProfile, isReconciliationStale, staleReason, markStale
  } = useFinanceData();

  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const reportRef = useRef<HTMLDivElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const paymentInputRef = useRef<HTMLInputElement>(null);
  const settlementInputRef = useRef<HTMLInputElement>(null);
  const bankCreditInputRef = useRef<HTMLInputElement>(null);

  const resetFileInputs = () => {
    if (invoiceInputRef.current) invoiceInputRef.current.value = '';
    if (paymentInputRef.current) paymentInputRef.current.value = '';
    if (settlementInputRef.current) settlementInputRef.current.value = '';
    if (bankCreditInputRef.current) bankCreditInputRef.current.value = '';
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    type: 'invoices' | 'payments' | 'settlements' | 'bankCredits'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          updateDataset(type, results.data as any[], file.name);
          setStatusMessage(`Uploaded ${file.name} (${results.data.length} records).`);
          setTimeout(() => setStatusMessage(null), 4000);
        },
        error: (err) => {
          console.error("CSV parse error:", err);
          setStatusMessage(`Failed to parse CSV: ${err.message}`);
          setTimeout(() => setStatusMessage(null), 4000);
        }
      });
    }
  };

  const handleRemoveSingleFile = (type: 'invoices' | 'payments' | 'settlements' | 'bankCredits') => {
    removeDataset(type);
    if (type === 'invoices' && invoiceInputRef.current) invoiceInputRef.current.value = '';
    if (type === 'payments' && paymentInputRef.current) paymentInputRef.current.value = '';
    if (type === 'settlements' && settlementInputRef.current) settlementInputRef.current.value = '';
    if (type === 'bankCredits' && bankCreditInputRef.current) bankCreditInputRef.current.value = '';
    setStatusMessage(`Cleared ${type} file and data.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleClearAllData = () => {
    clearLocalData();
    resetFileInputs();
    setStatusMessage("All dataset records and uploaded files have been cleared.");
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleLoadDemo = () => {
    resetDemoData();
    resetFileInputs();
    setStatusMessage("Demo dataset loaded (25 Invoices, 25 Payments, 25 Settlements, 25 Bank Credits).");
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleRun = () => {
    if (invoices.length === 0 && payments.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      runReconciliationWithData(
        invoices, 
        payments, 
        settlements, 
        bankCredits, 
        dataMode === "Synthetic Demo Data" ? "Synthetic Demo Data" : "Local CSV Data"
      );
      setIsProcessing(false);
      setProgress(0);
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }, 5000);
  };

  const exportJSON = () => {
    if (!latestResult) return;
    const exportData = {
      reportType: "Financial Reconciliation Report",
      appVersion: "1.0.0",
      rulesVersion: "1.0.0",
      processedTimestamp: latestResult.processedAt,
      processingMode: latestResult.processingMode,
      isReconciliationStale,
      staleReason: staleReason || null,
      materialityThreshold: latestResult.materialityThreshold,
      overallIntegrityStatus: latestResult.overallIntegrityStatus,
      integrityChecks: latestResult.integrityChecks,
      auditMetadata: latestResult.auditMetadata,
      companyProfile,
      rulesConfiguration: rules,
      kpiResults: {
        matchRate: latestResult.matchRate,
        exceptionRate: latestResult.exceptionRate,
        fullyMatched: latestResult.fullyMatched,
        partialMatches: latestResult.partialMatches,
        unmatched: latestResult.unmatched,
        transactionsWithExceptions: latestResult.transactionsWithExceptions,
        totalExceptionItems: latestResult.totalExceptionItems
      },
      cashPosition: {
        confirmedBankCash: latestResult.amountSummary.bankCreditedValue,
        pendingSettlementValue: latestResult.amountSummary.pendingSettlementValue,
        totalExceptionExposure: latestResult.amountSummary.totalExceptionExposure
      },
      settlementSummary: latestResult.amountSummary,
      timingSummaries: latestResult.settlementTimingSummary,
      controllerActionQueue: latestResult.controllerActionQueue,
      exceptions: latestResult.exceptions,
      dataQualityWarnings: latestResult.dataQualityWarnings,
      complianceScreening: latestResult.complianceScreening,
      recommendedActions: latestResult.exceptions.map(e => ({ 
        id: e.id, 
        transactionId: e.transactionId,
        action: e.recommendedAction,
        reason: e.actionReason,
        thresholdExceeded: e.thresholdExceeded
      })),
      disclaimer: "Prototype finance-operations screening only. This application does not replace official government portals, bank records, payment-gateway settlement terms, qualified accountants, auditors, tax advisers, or legal advisers. Verify all thresholds, rates, eligibility conditions, filings, and settlement obligations before acting."
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation-${latestResult.batchId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!latestResult) return;
    const exportItems = latestResult.exceptions.map(e => ({
      'Exception ID': e.id,
      'Transaction ID': e.transactionId,
      'Source IDs': (e.sourceRecordIds || []).join('; '),
      'Exception Type': e.type,
      'Books Amount': e.booksAmount,
      'Payment Amount': e.paymentAmount,
      'Settlement Amount': e.settlementAmount,
      'Bank Amount': e.bankAmount,
      'Difference': e.difference,
      'Materiality Threshold': e.materialityThreshold,
      'Threshold Exceeded': e.thresholdExceeded ? 'Yes' : 'No',
      'Action Reason': e.actionReason,
      'Payment Date': e.paymentDate,
      'Settlement Date': e.settlementDate,
      'Bank Credit Date': e.bankCreditDate || '',
      'Settlement Timing Days': e.daysDifference,
      'Bank-Credit Timing Days': e.bankCreditTimingDays || 0,
      'Rule Applied': e.ruleApplied,
      'Deterministic Confidence': e.deterministicMatchConfidence,
      'Evidence Available': (e.evidenceAvailable || []).join('; '),
      'Evidence Missing': (e.evidenceMissing || []).join('; '),
      'Action': e.recommendedAction,
      'Data Freshness': isReconciliationStale ? 'Stale / Outdated' : 'Fresh',
      'Internal Notes': notes[e.id] || e.internalNote || ''
    }));
    
    const csv = Papa.unparse(exportItems);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exceptions-${latestResult.batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter exceptions if search query passed
  const filteredExceptions = latestResult ? latestResult.exceptions.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.transactionId.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      (e.sourceRecordIds || []).some(id => id.toLowerCase().includes(q))
    );
  }) : [];

  const uploadCards = [
    { 
      type: 'invoices' as const, 
      label: 'Invoices', 
      count: invoices.length, 
      fileName: fileNames?.invoices,
      ref: invoiceInputRef 
    },
    { 
      type: 'payments' as const, 
      label: 'Payments', 
      count: payments.length, 
      fileName: fileNames?.payments,
      ref: paymentInputRef 
    },
    { 
      type: 'settlements' as const, 
      label: 'Settlements', 
      count: settlements.length, 
      fileName: fileNames?.settlements,
      ref: settlementInputRef 
    },
    { 
      type: 'bankCredits' as const, 
      label: 'Bank Credits', 
      count: bankCredits.length, 
      fileName: fileNames?.bankCredits,
      ref: bankCreditInputRef 
    }
  ];

  const hasAnyData = invoices.length > 0 || payments.length > 0 || settlements.length > 0 || bankCredits.length > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-neu-base/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center gap-8 p-12 bg-neu-base rounded-[40px] shadow-neu-extruded">
            <div className="w-24 h-24 rounded-[24px] bg-[#9EEB75] shadow-neu-extruded flex items-center justify-center text-[#0F2F28] animate-pulse">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.5 8.5C6.5 7.5 8 8 9 9.5C10 11.5 11 15 12.5 18C10.5 15.5 8.5 11.5 7 10C6 9 5 8.5 5.5 8.5Z" />
                <path d="M9.5 10.5C12 9 15 7 18.5 5.5C15.5 8 12.5 9.5 9.5 10.5Z" />
                <path d="M11 12.5C13.5 11.5 16 10 18.5 9C16 11.5 13.5 12.5 11 12.5Z" />
              </svg>
            </div>
            
            <div className="text-center">
              <h1 className="text-4xl font-display font-extrabold tracking-tight text-neu-primary">Apex</h1>
              <p className="text-sm text-neu-muted font-bold tracking-widest uppercase mt-2">Controller</p>
            </div>

            <div className="mt-4 flex flex-col items-center w-64 gap-6">
               <p className="text-sm font-bold text-neu-primary animate-pulse">Running deterministic match...</p>
               <div className="w-full h-4 bg-neu-base shadow-neu-inset rounded-full overflow-hidden relative">
                  <div 
                    className="absolute inset-y-0 left-0 bg-neu-accent transition-all duration-100 ease-linear shadow-neu-extruded-sm"
                    style={{ width: `${progress}%` }}
                  ></div>
               </div>
               <p className="text-xs font-bold text-neu-muted tabular-nums">{progress}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-neu-primary">Reconciliation Engine</h2>
          <p className="text-sm text-neu-muted mt-1">Upload CSVs or load demo data to run deterministic 4-way matching.</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={handleClearAllData} 
            className="px-6 py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full font-bold text-sm text-[#E74C3C] flex items-center gap-2 transition-all"
            title="Clear all datasets, uploaded files, and reconciliation results"
          >
            <Trash2 className="w-4 h-4" />
            Clear Data
          </button>
          <button 
            onClick={handleLoadDemo} 
            className="px-6 py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full font-bold text-sm text-neu-primary flex items-center gap-2 transition-all"
            title="Load synthetic enterprise reconciliation records"
          >
            <Database className="w-4 h-4" />
            Load Demo Data
          </button>
        </div>
      </div>

      {/* Status Notice Toast / Banner */}
      {statusMessage && (
        <div className="p-4 bg-neu-base shadow-neu-inset border border-neu-muted/20 rounded-2xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-neu-accent" />
            <span className="text-sm font-bold text-neu-primary">{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-neu-muted hover:text-neu-primary p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stale Warning Banner */}
      <StaleWarningBanner onRunRecon={handleRun} />

      {showSuccessBanner && (
        <div className="p-4 bg-[#9EEB75]/20 text-[#0F2F28] border border-[#9EEB75] rounded-2xl flex items-center justify-between shadow-neu-extruded-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
            <span className="font-bold text-sm">Reconciliation completed. Dashboard, reports, cash forecast, and compliance screening have been updated.</span>
          </div>
          {onViewOverview && (
            <button onClick={onViewOverview} className="px-4 py-2 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full text-xs font-bold text-neu-primary">
              View Updated Overview
            </button>
          )}
        </div>
      )}

      {/* Upload Section - 4 File Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {uploadCards.map((card) => {
          const isLoaded = card.count > 0;
          return (
            <div 
              key={card.type} 
              className={`p-6 rounded-[24px] shadow-neu-extruded flex flex-col justify-between transition-all relative ${
                isLoaded ? 'bg-[#9EEB75]/10 border border-[#9EEB75]/40' : 'bg-neu-base border border-transparent'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-bold text-neu-primary">{card.label} CSV</p>
                    <p className="text-[11px] font-medium text-neu-muted truncate max-w-[130px]" title={card.fileName || 'No file selected'}>
                      {card.fileName || 'No file selected'}
                    </p>
                  </div>
                  {isLoaded ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-full bg-[#9EEB75] flex items-center justify-center text-[#0F2F28] shadow-neu-extruded-sm">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <button
                        onClick={() => handleRemoveSingleFile(card.type)}
                        title={`Clear ${card.label} file`}
                        className="w-7 h-7 rounded-full bg-neu-base shadow-neu-extruded hover:shadow-neu-inset flex items-center justify-center text-[#E74C3C] transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-neu-base shadow-neu-inset flex items-center justify-center text-neu-muted">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="my-2">
                  <p className="text-2xl font-display font-extrabold text-neu-primary">
                    {card.count} <span className="text-xs font-bold text-neu-muted uppercase tracking-wider">rows</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neu-muted/15">
                <input 
                  type="file" 
                  ref={card.ref}
                  accept=".csv" 
                  onChange={(e) => handleFileUpload(e, card.type)} 
                  className="hidden" 
                  id={`file-input-${card.type}`}
                />
                <label 
                  htmlFor={`file-input-${card.type}`}
                  className="px-4 py-2.5 bg-neu-base shadow-neu-extruded-sm hover:shadow-neu-inset active:shadow-neu-inset rounded-xl text-xs font-bold text-neu-primary w-full flex items-center justify-center gap-2 cursor-pointer transition-all text-center"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-neu-muted" />
                  {isLoaded ? 'Replace CSV' : 'Select CSV File'}
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Run Reconciliation Button */}
      <div className="flex flex-col items-center justify-center mt-8 gap-3 relative">
        <button 
          onClick={handleRun}
          disabled={isProcessing || !hasAnyData}
          className="relative px-10 py-4 bg-neu-primary shadow-[12px_12px_24px_rgba(163,177,198,0.5),-12px_-12px_24px_rgba(255,255,255,0.8)] hover:-translate-y-1 active:translate-y-1 rounded-full font-bold text-lg text-neu-base flex items-center gap-3 transition-all disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {hasAnyData && !isProcessing && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9EEB75] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#9EEB75] border-2 border-neu-primary"></span>
            </span>
          )}
          {isProcessing ? (
            <div className="w-6 h-6 border-4 border-neu-base border-t-transparent rounded-full animate-spin" />
          ) : (
            <PlayCircle className="w-6 h-6" />
          )}
          {isProcessing ? 'Processing Locally...' : 'Run Reconciliation'}
        </button>

        {!hasAnyData && (
          <p className="text-xs font-bold text-neu-muted">
            Upload CSV files above or click <strong className="text-neu-primary">Load Demo Data</strong> to enable reconciliation.
          </p>
        )}
      </div>

      {/* Empty State when no latestResult */}
      {!latestResult && (
        <div className="p-10 bg-neu-base rounded-[32px] shadow-neu-extruded flex flex-col items-center justify-center text-center space-y-4 animate-fade-in mt-8">
          <div className="w-16 h-16 bg-neu-base shadow-neu-inset rounded-full flex items-center justify-center text-neu-muted">
            <FileSearch className="w-8 h-8 text-neu-muted" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-xl font-display font-extrabold text-neu-primary">
              {hasAnyData ? "CSVs Loaded — Ready to Match" : "No Reconciliation Run Active"}
            </h3>
            <p className="text-sm text-neu-muted">
              {hasAnyData 
                ? "Your data files are ready. Click 'Run Reconciliation' above to execute 4-way deterministic matching and diagnose discrepancies."
                : "You have cleared all datasets. You can select your own CSV files for Invoices, Payments, Settlements, and Bank Credits, or click 'Load Demo Data' to load synthetic enterprise test transactions."}
            </p>
          </div>
          {!hasAnyData && (
            <button 
              onClick={handleLoadDemo} 
              className="px-6 py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-inset rounded-full text-xs font-bold text-neu-primary flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-neu-accent" />
              Load Synthetic Demo Data
            </button>
          )}
        </div>
      )}

      {/* Controller Action Queue */}
      {latestResult && (
        <ControllerActionQueue onSelectTransaction={(txnId) => setExpandedRow(latestResult.exceptions.find(e => e.transactionId === txnId)?.id || null)} />
      )}

      {/* Integrity Checks Card */}
      {latestResult && (
        <IntegrityCheckCard checks={latestResult.integrityChecks} overallStatus={latestResult.overallIntegrityStatus} />
      )}

      {/* Main Reconciliation Result Panel */}
      {latestResult && (
        <div ref={reportRef} className="space-y-8 bg-neu-base rounded-[32px] shadow-neu-inset p-8 mt-12 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-neu-muted/20 gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-display font-extrabold text-neu-primary">Reconciliation Result</h3>
                {isReconciliationStale && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F39C12]/20 text-[#D68910]">
                    Previous reconciliation result — rerun required
                  </span>
                )}
              </div>
              <p className="text-sm text-neu-muted mt-1">
                Batch ID: {latestResult.batchId} • {latestResult.processingMode} • Materiality: ₹{latestResult.materialityThreshold.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={exportCSV} className="px-4 py-2 bg-neu-base shadow-neu-extruded-sm hover:shadow-neu-inset rounded-full font-bold text-xs text-neu-primary flex items-center gap-2">
                <FileText className="w-4 h-4" /> CSV
              </button>
              <button onClick={exportJSON} className="px-4 py-2 bg-neu-base shadow-neu-extruded-sm hover:shadow-neu-inset rounded-full font-bold text-xs text-neu-primary flex items-center gap-2">
                <Download className="w-4 h-4" /> JSON
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <div className="p-4 bg-neu-base shadow-neu-extruded rounded-2xl">
               <p className="text-xs font-bold text-neu-muted uppercase tracking-widest mb-1">Match Rate</p>
               <p className="text-3xl font-display font-extrabold text-[#9EEB75]">{latestResult.matchRate.toFixed(1)}%</p>
             </div>
             <div className="p-4 bg-neu-base shadow-neu-extruded rounded-2xl">
               <p className="text-xs font-bold text-neu-muted uppercase tracking-widest mb-1">Exceptions</p>
               <p className="text-3xl font-display font-extrabold text-[#E74C3C]">{latestResult.transactionsWithExceptions}</p>
             </div>
             <div className="p-4 bg-neu-base shadow-neu-extruded rounded-2xl">
               <p className="text-xs font-bold text-neu-muted uppercase tracking-widest mb-1">Exception Exp.</p>
               <p className="text-3xl font-display font-extrabold text-[#F39C12]">₹{(latestResult.amountSummary.totalExceptionExposure/1000).toFixed(1)}k</p>
             </div>
             <div className="p-4 bg-neu-base shadow-neu-extruded rounded-2xl">
               <p className="text-xs font-bold text-neu-muted uppercase tracking-widest mb-1">Fully Matched</p>
               <p className="text-3xl font-display font-extrabold text-neu-primary">{latestResult.fullyMatched} / {latestResult.batchSize}</p>
             </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-neu-primary">Exceptions & Anomalies</h4>
              <span className="text-xs font-bold text-neu-muted">
                Showing {filteredExceptions.length} exception{filteredExceptions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto rounded-[24px] shadow-neu-extruded bg-neu-base">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-neu-muted/20 bg-neu-base/50">
                    <th className="text-left py-4 px-6 font-bold text-xs uppercase tracking-widest text-neu-muted">Transaction ID</th>
                    <th className="text-left py-4 px-6 font-bold text-xs uppercase tracking-widest text-neu-muted">Type</th>
                    <th className="text-left py-4 px-6 font-bold text-xs uppercase tracking-widest text-neu-muted">Difference</th>
                    <th className="text-left py-4 px-6 font-bold text-xs uppercase tracking-widest text-neu-muted">Action</th>
                    <th className="px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neu-muted/10">
                  {filteredExceptions.map((exc) => (
                    <React.Fragment key={exc.id}>
                      <tr className="hover:bg-neu-base/50 transition-colors cursor-pointer" onClick={() => setExpandedRow(expandedRow === exc.id ? null : exc.id)}>
                        <td className="py-4 px-6 text-sm font-bold text-neu-primary font-mono">{exc.transactionId}</td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#E74C3C]">
                            {exc.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-neu-primary">
                          {exc.difference !== 0 ? `₹${Math.abs(exc.difference).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-4 px-6">
                           <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full shadow-neu-inset ${
                             exc.recommendedAction === 'escalate' 
                               ? 'text-[#E74C3C]' 
                               : exc.recommendedAction === 'manual_review' 
                                 ? 'text-[#F39C12]' 
                                 : 'text-[#2E7D32]'
                           }`}>
                             {exc.recommendedAction.replace(/_/g, ' ')}
                           </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {expandedRow === exc.id ? <ChevronDown className="w-5 h-5 text-neu-muted inline" /> : <ChevronRight className="w-5 h-5 text-neu-muted inline" />}
                        </td>
                      </tr>
                      {expandedRow === exc.id && (
                        <tr className="bg-neu-base shadow-neu-inset">
                          <td colSpan={5} className="py-6 px-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div>
                                  <h5 className="text-xs font-bold text-neu-muted uppercase tracking-widest mb-1">Diagnostic & Routing</h5>
                                  <p className="text-sm text-neu-primary font-medium">{exc.details}</p>
                                  <p className="text-xs text-neu-muted mt-1">Rule Applied: {exc.ruleApplied} • Match Confidence: {exc.deterministicMatchConfidence}</p>
                                </div>
                                <div className="p-3 bg-neu-base shadow-neu-extruded-sm rounded-xl text-xs space-y-1">
                                  <span className="font-bold text-neu-muted uppercase text-[10px]">Action Rationalization</span>
                                  <p className="text-neu-primary font-medium">{exc.actionReason}</p>
                                  <div className="flex items-center gap-4 pt-1 text-[11px] text-neu-muted">
                                    <span>Materiality Threshold: ₹{exc.materialityThreshold.toLocaleString('en-IN')}</span>
                                    <span>Threshold Exceeded: <strong className={exc.thresholdExceeded ? 'text-[#E74C3C]' : 'text-[#2E7D32]'}>{exc.thresholdExceeded ? 'Yes' : 'No'}</strong></span>
                                  </div>
                                </div>
                                <div className="flex gap-4 pt-2">
                                  <div><span className="text-xs text-neu-muted block">Books</span><span className="text-sm font-bold">₹{exc.booksAmount}</span></div>
                                  <div><span className="text-xs text-neu-muted block">Payment</span><span className="text-sm font-bold">₹{exc.paymentAmount}</span></div>
                                  <div><span className="text-xs text-neu-muted block">Settlement</span><span className="text-sm font-bold">₹{exc.settlementAmount}</span></div>
                                  <div><span className="text-xs text-neu-muted block">Bank</span><span className="text-sm font-bold">₹{exc.bankAmount}</span></div>
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <h5 className="text-xs font-bold text-neu-muted uppercase tracking-widest mb-3">Internal Audit Note</h5>
                                <textarea 
                                  className="flex-1 w-full min-h-[100px] p-4 rounded-2xl bg-neu-base shadow-neu-inset text-sm font-medium text-neu-primary resize-none focus:outline-none focus:ring-2 focus:ring-neu-accent"
                                  placeholder="Add an internal audit note..."
                                  value={notes[exc.id] || ''}
                                  onChange={(e) => saveNote(exc.id, e.target.value)}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {filteredExceptions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neu-muted font-bold">No exceptions found matching your criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 rounded-xl bg-neu-base shadow-neu-inset text-xs text-neu-muted text-center italic">
        Prototype finance-operations screening only. This application does not replace official government portals, bank records, payment-gateway settlement terms, qualified accountants, auditors, tax advisers, or legal advisers. Verify all thresholds, rates, eligibility conditions, filings, and settlement obligations before acting.
      </div>
    </div>
  );
}
