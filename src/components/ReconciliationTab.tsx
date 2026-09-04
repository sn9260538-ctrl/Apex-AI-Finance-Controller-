import React, { useState, useRef } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { 
  FileSearch, UploadCloud, PlayCircle, CheckCircle2, AlertTriangle, 
  Download, FileText, ChevronDown, ChevronRight, Save, Database, Trash2,
  ShieldCheck, ArrowRight, Activity, X, RefreshCw, Trophy, Layers, HelpCircle
} from 'lucide-react';
import Papa from 'papaparse';
import { Invoice, Payment, Settlement, BankCredit } from '../types';
import StaleWarningBanner from './StaleWarningBanner';
import IntegrityCheckCard from './IntegrityCheckCard';
import ControllerActionQueue from './ControllerActionQueue';
import Track04EvaluationSection from './Track04EvaluationSection';

interface ReconciliationTabProps {
  searchQuery?: string;
  onViewOverview?: () => void;
}

type ReconSubView = 'buildathon_eval' | 'ledger' | 'action_queue';

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
  const [activeSubView, setActiveSubView] = useState<ReconSubView>('buildathon_eval');

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
    setStatusMessage("Demo dataset loaded (100-record synthetic batch for controller evaluation).");
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
    }, 80);

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
    }, 4000);
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
      },
      amountSummary: latestResult.amountSummary,
      settlementTimingSummary: latestResult.settlementTimingSummary,
      paymentMethodSummary: latestResult.paymentMethodSummary,
      exceptions: latestResult.exceptions,
      disclaimer: "Prototype finance-operations screening only. This application does not replace official government portals, bank records, payment-gateway settlement terms, qualified accountants, auditors, tax advisers, or legal advisers."
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation-audit-${latestResult.batchId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
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
      'Difference (INR)': e.difference,
      'Materiality Threshold (INR)': e.materialityThreshold,
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
  const filteredExceptions = latestResult ? (latestResult.exceptions || []).filter(e => {
    if (!searchQuery) return true;
    const q = String(searchQuery || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (e.transactionId && String(e.transactionId).toLowerCase().includes(q)) ||
      (e.type && String(e.type).toLowerCase().includes(q)) ||
      (Array.isArray(e.sourceRecordIds) && e.sourceRecordIds.some(id => id && String(id).toLowerCase().includes(q)))
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
              <p className="text-sm text-neu-muted font-bold tracking-widest uppercase mt-2">AI Finance Controller</p>
            </div>

            <div className="mt-4 flex flex-col items-center w-64 gap-6">
               <p className="text-sm font-bold text-neu-primary animate-pulse">Running deterministic 4-way match...</p>
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
          <p className="text-sm text-neu-muted mt-1">
            Deterministic 4-way matching loop (Invoice → Payment → Settlement → Bank Credit) with complete controller evaluation.
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {latestResult && isReconciliationStale && (
            <span className="px-3 py-1 bg-[#F39C12]/20 text-[#D68910] text-xs font-bold rounded-full border border-[#F39C12]/30">
              Previous reconciliation result — rerun required
            </span>
          )}

          <div className="flex gap-2">
            <button 
              onClick={handleLoadDemo} 
              className="px-4 py-2 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-sm active:shadow-neu-inset rounded-full font-bold text-xs text-neu-primary flex items-center gap-2 transition-all cursor-pointer"
            >
              <Database className="w-4 h-4 text-neu-accent" />
              Load Synthetic Demo Data (100 Records)
            </button>

            {hasAnyData && (
              <button 
                onClick={handleClearAllData} 
                className="px-4 py-2 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-sm active:shadow-neu-inset rounded-full font-bold text-xs text-[#E74C3C] flex items-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </button>
            )}
          </div>
        </div>
      </div>

      <StaleWarningBanner />

      {/* Status / Flash Notification */}
      {statusMessage && (
        <div className="p-4 bg-neu-base rounded-2xl shadow-neu-inset flex items-center gap-3 animate-fade-in border border-neu-accent/30 text-xs font-bold text-neu-primary">
          <CheckCircle2 className="w-4 h-4 text-neu-accent shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 4-Way CSV Upload Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {uploadCards.map((card) => (
          <div key={card.type} className="p-6 bg-neu-base rounded-[28px] shadow-neu-extruded flex flex-col justify-between relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-neu-muted uppercase tracking-widest">{card.label}</span>
                <span className={`w-3 h-3 rounded-full ${card.count > 0 ? 'bg-[#9EEB75]' : 'bg-neu-muted/40'}`}></span>
              </div>
              <p className="text-3xl font-display font-extrabold text-neu-primary">
                {card.count} <span className="text-sm font-medium text-neu-muted">records</span>
              </p>
              {card.fileName ? (
                <p className="text-xs text-neu-accent font-medium mt-1 truncate" title={card.fileName}>
                  {card.fileName}
                </p>
              ) : (
                <p className="text-xs text-neu-muted mt-1">
                  {card.count > 0 ? `${dataMode}` : 'No file loaded'}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2">
              <label className="flex-1 px-4 py-2.5 bg-neu-base shadow-neu-extruded-sm hover:shadow-neu-inset rounded-full font-bold text-xs text-neu-primary flex items-center justify-center gap-2 transition-all cursor-pointer">
                <UploadCloud className="w-4 h-4 text-neu-muted" />
                Upload CSV
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={card.ref} 
                  onChange={(e) => handleFileUpload(e, card.type)} 
                  className="hidden" 
                />
              </label>

              {card.count > 0 && (
                <button
                  onClick={() => handleRemoveSingleFile(card.type)}
                  className="w-9 h-9 bg-neu-base shadow-neu-extruded-sm hover:shadow-neu-inset rounded-full flex items-center justify-center text-neu-muted hover:text-[#E74C3C] transition-all cursor-pointer shrink-0"
                  title={`Clear ${card.label}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Run Reconciliation Action Button */}
      <div className="flex flex-col items-center justify-center mt-6 gap-3 relative">
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
            Upload CSV files above or click <strong className="text-neu-primary">Load Synthetic Demo Data</strong> to run 4-way matching.
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
                ? "Your data files are ready. Click 'Run Reconciliation' above to execute 4-way deterministic matching and evaluate against ground-truth standards."
                : "You have cleared all datasets. You can select your own CSV files for Invoices, Payments, Settlements, and Bank Credits, or click 'Load Synthetic Demo Data' to load the 100-record synthetic batch."}
            </p>
          </div>
          {!hasAnyData && (
            <button 
              onClick={handleLoadDemo} 
              className="px-6 py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-inset rounded-full text-xs font-bold text-neu-primary flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-neu-accent" />
              Load Synthetic Demo Data (100 Records)
            </button>
          )}
        </div>
      )}

      {/* Sub-Navigation Switcher when Result is Ready */}
      {latestResult && (
        <div className="space-y-8 animate-fade-in pt-4">
          <div className="flex items-center justify-center gap-3 p-1.5 bg-neu-base rounded-full shadow-neu-inset w-fit mx-auto border border-neu-muted/20">
            <button
              onClick={() => setActiveSubView('buildathon_eval')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubView === 'buildathon_eval'
                  ? 'bg-neu-primary text-neu-base shadow-neu-extruded-sm'
                  : 'text-neu-muted hover:text-neu-primary'
              }`}
            >
              <Trophy className="w-4 h-4 text-neu-accent" />
              Controller Evaluation
            </button>

            <button
              onClick={() => setActiveSubView('ledger')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubView === 'ledger'
                  ? 'bg-neu-primary text-neu-base shadow-neu-extruded-sm'
                  : 'text-neu-muted hover:text-neu-primary'
              }`}
            >
              <FileText className="w-4 h-4" />
              Detailed Ledger & Exceptions
            </button>

            <button
              onClick={() => setActiveSubView('action_queue')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubView === 'action_queue'
                  ? 'bg-neu-primary text-neu-base shadow-neu-extruded-sm'
                  : 'text-neu-muted hover:text-neu-primary'
              }`}
            >
              <Activity className="w-4 h-4" />
              Controller Action Queue
            </button>
          </div>

          {/* VIEW 1: Controller Evaluation Mode */}
          {activeSubView === 'buildathon_eval' && (
            <Track04EvaluationSection 
              onSelectTransaction={(txId) => {
                setActiveSubView('ledger');
                const exc = latestResult.exceptions.find(e => e.transactionId === txId);
                if (exc) setExpandedRow(exc.id);
              }} 
            />
          )}

          {/* VIEW 2: Detailed Ledger & Exceptions Table */}
          {activeSubView === 'ledger' && (
            <div className="space-y-8 animate-fade-in">
              <IntegrityCheckCard checks={latestResult.integrityChecks} overallStatus={latestResult.overallIntegrityStatus} />

              <div ref={reportRef} className="space-y-8 bg-neu-base rounded-[32px] shadow-neu-inset p-8">
                <div className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-neu-muted/20 gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-display font-extrabold text-neu-primary">Reconciliation Result Ledger</h3>
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
                    <button onClick={exportCSV} className="px-4 py-2 bg-neu-base shadow-neu-extruded-sm hover:shadow-neu-inset rounded-full font-bold text-xs text-neu-primary flex items-center gap-2 cursor-pointer">
                      <FileText className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={exportJSON} className="px-4 py-2 bg-neu-base shadow-neu-extruded-sm hover:shadow-neu-inset rounded-full font-bold text-xs text-neu-primary flex items-center gap-2 cursor-pointer">
                      <Download className="w-4 h-4" /> JSON
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="p-4 bg-neu-base shadow-neu-extruded rounded-2xl">
                     <p className="text-xs font-bold text-neu-muted uppercase tracking-widest mb-1">Match Rate</p>
                     <p className={`text-3xl font-display font-extrabold ${
                        latestResult.matchRate.toFixed(1) === '100.0' ? 'text-[#9EEB75]' : 
                        latestResult.matchRate.toFixed(1) === '0.0' ? 'text-[#E74C3C]' : 
                        'text-[#F39C12]'
                     }`}>{latestResult.matchRate.toFixed(1)}%</p>
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
                    <h4 className="text-lg font-bold text-neu-primary">Exceptions Ledger</h4>
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
                                {exc.difference !== 0 ? `₹${exc.difference > 0 ? `+${exc.difference.toFixed(2)}` : exc.difference.toFixed(2)}` : '₹0.00'}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  exc.recommendedAction === 'auto_resolve' ? 'bg-[#9EEB75]/20 text-[#0F2F28]' :
                                  exc.recommendedAction === 'escalate' ? 'bg-[#E74C3C]/20 text-[#E74C3C]' :
                                  'bg-[#F39C12]/20 text-[#D68910]'
                                }`}>
                                  {exc.recommendedAction.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="w-8 h-8 rounded-full bg-neu-base shadow-neu-extruded-sm flex items-center justify-center ml-auto">
                                  {expandedRow === exc.id ? <ChevronDown className="w-4 h-4 text-neu-muted" /> : <ChevronRight className="w-4 h-4 text-neu-muted" />}
                                </div>
                              </td>
                            </tr>
                            {expandedRow === exc.id && (
                              <tr>
                                <td colSpan={5} className="p-6 bg-neu-base/40">
                                  <div className="p-6 bg-neu-base rounded-2xl shadow-neu-inset space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div>
                                        <p className="text-xs font-bold text-neu-muted">Books Amount</p>
                                        <p className="text-sm font-bold text-neu-primary mt-1">₹{exc.booksAmount.toLocaleString('en-IN')}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-neu-muted">Payment Amount</p>
                                        <p className="text-sm font-bold text-neu-primary mt-1">₹{exc.paymentAmount.toLocaleString('en-IN')}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-neu-muted">Settlement Net</p>
                                        <p className="text-sm font-bold text-neu-primary mt-1">₹{exc.settlementAmount.toLocaleString('en-IN')}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-neu-muted">Bank Credited</p>
                                        <p className="text-sm font-bold text-neu-primary mt-1">₹{exc.bankAmount.toLocaleString('en-IN')}</p>
                                      </div>
                                    </div>
                                    <div className="pt-4 border-t border-neu-muted/20">
                                      <p className="text-xs font-bold text-neu-muted uppercase">Reason & Action Context</p>
                                      <p className="text-sm text-neu-primary mt-1">{exc.actionReason || exc.details}</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: Controller Action Queue */}
          {activeSubView === 'action_queue' && (
            <div className="space-y-8 animate-fade-in">
              <ControllerActionQueue 
                onSelectTransaction={(txnId) => {
                  setActiveSubView('ledger');
                  const exc = latestResult.exceptions.find(e => e.transactionId === txnId);
                  if (exc) setExpandedRow(exc.id);
                }} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
