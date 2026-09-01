import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Invoice, Payment, Settlement, BankCredit, 
  ReconciliationResult, ReconciliationRules,
  ReconciliationRunHistoryItem
} from '../types';
import { generateDemoData } from '../lib/demoReconciliationData';
import { runReconciliation } from '../lib/reconciliationEngine';
import Papa from 'papaparse';

interface FinanceDataState {
  dataMode: "Synthetic Demo Data" | "Local CSV Data";
  lastRunTimestamp: string | null;
  invoices: Invoice[];
  payments: Payment[];
  settlements: Settlement[];
  bankCredits: BankCredit[];
  fileNames: {
    invoices: string | null;
    payments: string | null;
    settlements: string | null;
    bankCredits: string | null;
  };
  latestResult: ReconciliationResult | null;
  rules: ReconciliationRules;
  companyProfile: {
    companyName: string;
    gstin: string;
    pan: string;
  };
  notes: Record<string, string>;
  runHistory: ReconciliationRunHistoryItem[];
  isReconciliationStale: boolean;
  staleReason: string | null;
}

interface FinanceDataContextValue extends FinanceDataState {
  runReconciliationWithData: (
    invoices: Invoice[],
    payments: Payment[],
    settlements: Settlement[],
    bankCredits: BankCredit[],
    mode: "Synthetic Demo Data" | "Local CSV Data",
    customFileNames?: {
      invoices: string | null;
      payments: string | null;
      settlements: string | null;
      bankCredits: string | null;
    }
  ) => void;
  updateDataset: (
    type: 'invoices' | 'payments' | 'settlements' | 'bankCredits',
    data: any[],
    fileName?: string | null
  ) => void;
  removeDataset: (
    type: 'invoices' | 'payments' | 'settlements' | 'bankCredits'
  ) => void;
  resetDemoData: () => void;
  clearLocalData: () => void;
  updateRules: (rules: ReconciliationRules) => void;
  updateCompanyProfile: (profile: { companyName: string, gstin: string, pan: string }) => void;
  saveNote: (id: string, note: string) => void;
  clearRunHistory: () => void;
  markStale: (reason?: string) => void;
}

const FinanceDataContext = createContext<FinanceDataContextValue | undefined>(undefined);

export const FinanceDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FinanceDataState>({
    dataMode: "Synthetic Demo Data",
    lastRunTimestamp: null,
    invoices: [],
    payments: [],
    settlements: [],
    bankCredits: [],
    fileNames: {
      invoices: null,
      payments: null,
      settlements: null,
      bankCredits: null
    },
    latestResult: null,
    rules: {
      tolerance: 1,
      timingThreshold: 1,
      materialityThreshold: 10000,
      gstRate: 18,
      tdsRate: 10
    },
    companyProfile: {
      companyName: 'Apex Demo Corp',
      gstin: '29XXXXX0000X1Z5',
      pan: 'XXXXX0000X'
    },
    notes: {},
    runHistory: [],
    isReconciliationStale: false,
    staleReason: null
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load
  useEffect(() => {
    const savedRules = {
      tolerance: Number(localStorage.getItem('reconTolerance')) || 1,
      timingThreshold: Number(localStorage.getItem('reconTiming')) || 1,
      materialityThreshold: Number(localStorage.getItem('reconMateriality')) || 10000,
      gstRate: Number(localStorage.getItem('reconGstRate')) || 18,
      tdsRate: Number(localStorage.getItem('reconTdsRate')) || 10
    };
    const savedProfile = {
      companyName: localStorage.getItem('companyName') || 'Apex Demo Corp',
      gstin: localStorage.getItem('gstin') || '29XXXXX0000X1Z5',
      pan: localStorage.getItem('pan') || 'XXXXX0000X'
    };
    const savedNotes = JSON.parse(localStorage.getItem('reconNotes') || '{}');
    
    let savedHistory: ReconciliationRunHistoryItem[] = [];
    try {
      savedHistory = JSON.parse(localStorage.getItem('reconRunHistory') || '[]');
      if (!Array.isArray(savedHistory)) savedHistory = [];
    } catch {
      savedHistory = [];
    }

    const savedStateStr = localStorage.getItem('financeDataState');
    if (savedStateStr) {
      try {
        const parsed = JSON.parse(savedStateStr);
        setState(prev => ({
          ...prev,
          ...parsed,
          fileNames: parsed.fileNames || {
            invoices: parsed.invoices?.length ? 'local_invoices.csv' : null,
            payments: parsed.payments?.length ? 'local_payments.csv' : null,
            settlements: parsed.settlements?.length ? 'local_settlements.csv' : null,
            bankCredits: parsed.bankCredits?.length ? 'local_bank_credits.csv' : null,
          },
          rules: savedRules,
          companyProfile: savedProfile,
          notes: savedNotes,
          runHistory: savedHistory,
          isReconciliationStale: false,
          staleReason: null
        }));
      } catch {
        loadDemo(savedRules, savedProfile, savedNotes, savedHistory);
      }
    } else {
      loadDemo(savedRules, savedProfile, savedNotes, savedHistory);
    }
    setIsLoaded(true);
  }, []);

  // Save state on change
  useEffect(() => {
    if (!isLoaded) return;
    const { invoices, payments, settlements, bankCredits, fileNames, latestResult, dataMode, lastRunTimestamp } = state;
    if (dataMode === "Local CSV Data") {
      localStorage.setItem('financeDataState', JSON.stringify({
        invoices, payments, settlements, bankCredits, fileNames, latestResult, dataMode, lastRunTimestamp
      }));
    } else {
      localStorage.removeItem('financeDataState');
    }
  }, [state.invoices, state.payments, state.settlements, state.bankCredits, state.fileNames, state.latestResult, state.dataMode, state.lastRunTimestamp, isLoaded]);

  const loadDemo = (
    rulesToUse?: ReconciliationRules, 
    profileToUse?: any, 
    notesToUse?: any,
    historyToUse?: ReconciliationRunHistoryItem[]
  ) => {
    const rules = rulesToUse || state.rules;
    const profile = profileToUse || state.companyProfile;
    const notes = notesToUse || state.notes;
    let runHistory = historyToUse || state.runHistory;

    const data = generateDemoData();
    const parse = (csv: string) => Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
    
    const invs = parse(data.invoicesCsv) as Invoice[];
    const pays = parse(data.paymentsCsv) as Payment[];
    const sets = parse(data.settlementsCsv) as Settlement[];
    const bnks = parse(data.bankCreditsCsv) as BankCredit[];

    const res = runReconciliation(invs, pays, sets, bnks, rules, "Synthetic Demo Data");
    res.processingMode = "Synthetic Demo Data";
    
    // Add demo run to history if history is empty
    if (runHistory.length === 0) {
      const demoHistoryItem: ReconciliationRunHistoryItem = {
        batchId: res.batchId,
        processedAt: res.processedAt,
        processingMode: "Synthetic Demo Data",
        inputRowCounts: res.inputRowCounts,
        batchSize: res.batchSize,
        fullyMatched: res.fullyMatched,
        partialMatches: res.partialMatches,
        unmatched: res.unmatched,
        transactionsWithExceptions: res.transactionsWithExceptions,
        totalExceptionItems: res.totalExceptionItems,
        matchRate: res.matchRate,
        exceptionRate: res.exceptionRate,
        totalExceptionExposure: res.amountSummary.totalExceptionExposure,
        confirmedBankCash: res.amountSummary.bankCreditedValue,
        pendingSettlementValue: res.amountSummary.pendingSettlementValue,
        datasetFingerprint: res.datasetFingerprint,
        rulesFingerprint: res.rulesFingerprint
      };
      runHistory = [demoHistoryItem];
      localStorage.setItem('reconRunHistory', JSON.stringify(runHistory));
    }

    setState({
      dataMode: "Synthetic Demo Data",
      lastRunTimestamp: res.processedAt,
      invoices: invs,
      payments: pays,
      settlements: sets,
      bankCredits: bnks,
      fileNames: {
        invoices: 'demo_invoices.csv',
        payments: 'demo_payments.csv',
        settlements: 'demo_settlements.csv',
        bankCredits: 'demo_bank_credits.csv'
      },
      latestResult: res,
      rules,
      companyProfile: profile,
      notes,
      runHistory,
      isReconciliationStale: false,
      staleReason: null
    });
  };

  const runReconciliationWithData = (
    invoices: Invoice[],
    payments: Payment[],
    settlements: Settlement[],
    bankCredits: BankCredit[],
    mode: "Synthetic Demo Data" | "Local CSV Data",
    customFileNames?: {
      invoices: string | null;
      payments: string | null;
      settlements: string | null;
      bankCredits: string | null;
    }
  ) => {
    const res = runReconciliation(invoices, payments, settlements, bankCredits, state.rules, mode);
    res.processingMode = mode;

    const newHistoryItem: ReconciliationRunHistoryItem = {
      batchId: res.batchId,
      processedAt: res.processedAt,
      processingMode: mode,
      inputRowCounts: res.inputRowCounts,
      batchSize: res.batchSize,
      fullyMatched: res.fullyMatched,
      partialMatches: res.partialMatches,
      unmatched: res.unmatched,
      transactionsWithExceptions: res.transactionsWithExceptions,
      totalExceptionItems: res.totalExceptionItems,
      matchRate: res.matchRate,
      exceptionRate: res.exceptionRate,
      totalExceptionExposure: res.amountSummary.totalExceptionExposure,
      confirmedBankCash: res.amountSummary.bankCreditedValue,
      pendingSettlementValue: res.amountSummary.pendingSettlementValue,
      datasetFingerprint: res.datasetFingerprint,
      rulesFingerprint: res.rulesFingerprint
    };

    const updatedHistory = [newHistoryItem, ...state.runHistory.filter(h => h.batchId !== res.batchId)].slice(0, 10);
    localStorage.setItem('reconRunHistory', JSON.stringify(updatedHistory));

    setState(prev => ({
      ...prev,
      dataMode: mode,
      lastRunTimestamp: res.processedAt,
      invoices,
      payments,
      settlements,
      bankCredits,
      fileNames: customFileNames || prev.fileNames,
      latestResult: res,
      runHistory: updatedHistory,
      isReconciliationStale: false,
      staleReason: null
    }));
  };

  const updateDataset = (
    type: 'invoices' | 'payments' | 'settlements' | 'bankCredits',
    data: any[],
    fileName: string | null = `${type}.csv`
  ) => {
    setState(prev => {
      const nextFileNames = {
        ...prev.fileNames,
        [type]: fileName
      };

      return {
        ...prev,
        dataMode: "Local CSV Data",
        [type]: data,
        fileNames: nextFileNames,
        isReconciliationStale: prev.latestResult !== null,
        staleReason: prev.latestResult !== null ? `Updated ${type} dataset (${fileName || 'file'}).` : null
      };
    });
  };

  const removeDataset = (type: 'invoices' | 'payments' | 'settlements' | 'bankCredits') => {
    setState(prev => {
      const nextFileNames = {
        ...prev.fileNames,
        [type]: null
      };

      return {
        ...prev,
        [type]: [],
        fileNames: nextFileNames,
        isReconciliationStale: prev.latestResult !== null,
        staleReason: prev.latestResult !== null ? `Cleared ${type} file.` : null
      };
    });
  };

  const resetDemoData = () => {
    loadDemo();
  };

  const clearLocalData = () => {
    localStorage.removeItem('financeDataState');
    localStorage.removeItem('reconNotes');
    setState(prev => ({
      ...prev,
      dataMode: "Local CSV Data",
      lastRunTimestamp: null,
      invoices: [],
      payments: [],
      settlements: [],
      bankCredits: [],
      fileNames: {
        invoices: null,
        payments: null,
        settlements: null,
        bankCredits: null
      },
      latestResult: null,
      notes: {},
      isReconciliationStale: false,
      staleReason: null
    }));
  };

  const clearRunHistory = () => {
    localStorage.removeItem('reconRunHistory');
    setState(prev => ({ ...prev, runHistory: [] }));
  };

  const markStale = (reason: string = "Input data or configuration changed.") => {
    setState(prev => ({
      ...prev,
      isReconciliationStale: true,
      staleReason: reason
    }));
  };

  const updateRules = (rules: ReconciliationRules) => {
    setState(prev => ({ 
      ...prev, 
      rules,
      isReconciliationStale: prev.latestResult !== null,
      staleReason: prev.latestResult !== null ? "Reconciliation rules were updated." : null
    }));
    localStorage.setItem('reconTolerance', String(rules.tolerance));
    localStorage.setItem('reconTiming', String(rules.timingThreshold));
    localStorage.setItem('reconMateriality', String(rules.materialityThreshold));
    localStorage.setItem('reconGstRate', String(rules.gstRate));
    localStorage.setItem('reconTdsRate', String(rules.tdsRate));
  };

  const updateCompanyProfile = (profile: { companyName: string, gstin: string, pan: string }) => {
    setState(prev => ({ 
      ...prev, 
      companyProfile: profile,
      isReconciliationStale: prev.latestResult !== null,
      staleReason: prev.latestResult !== null ? "Company profile was updated." : null
    }));
    localStorage.setItem('companyName', profile.companyName);
    localStorage.setItem('gstin', profile.gstin);
    localStorage.setItem('pan', profile.pan);
  };

  const saveNote = (id: string, note: string) => {
    const newNotes = { ...state.notes, [id]: note };
    setState(prev => ({ ...prev, notes: newNotes }));
    localStorage.setItem('reconNotes', JSON.stringify(newNotes));
  };

  if (!isLoaded) return null;

  return (
    <FinanceDataContext.Provider value={{
      ...state,
      runReconciliationWithData,
      updateDataset,
      removeDataset,
      resetDemoData,
      clearLocalData,
      updateRules,
      updateCompanyProfile,
      saveNote,
      clearRunHistory,
      markStale
    }}>
      {children}
    </FinanceDataContext.Provider>
  );
};

export const useFinanceData = () => {
  const context = useContext(FinanceDataContext);
  if (context === undefined) {
    throw new Error('useFinanceData must be used within a FinanceDataProvider');
  }
  return context;
};
