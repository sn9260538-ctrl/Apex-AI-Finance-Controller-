import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, X, Send, Loader2, MessageSquare, Key, Check, RotateCcw, BarChart3, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useFinanceData } from '../context/FinanceDataContext';
import { ReconciliationResult } from '../types';

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
}

const QUICK_ACTIONS = [
  "Summary of my finances",
  "Show visual reconciliation chart",
  "Explain my recent exceptions",
  "Summarize my cash flow & settlements",
  "What is my reconciliation status?"
];

/**
 * Extracts the raw reconciliation report from FinanceDataContext and formats
 * it into a token-optimized, minified JSON string for LLM system prompt injection.
 */
export function formatTokenOptimizedReport(
  report: ReconciliationResult | null,
  additionalContext?: {
    companyName?: string;
    currency?: string;
    invoicesCount?: number;
    paymentsCount?: number;
    settlementsCount?: number;
    bankCreditsCount?: number;
    dataMode?: string;
    fileNames?: Record<string, string>;
    isReconciliationStale?: boolean;
    staleReason?: string | null;
  }
): string {
  if (!report) {
    return JSON.stringify({
      status: "no_data_available",
      message: "No reconciliation batch has been run in the current session."
    });
  }

  // Extract and compress exceptions to reduce token overhead while preserving exact numbers
  const compactExceptions = (report.exceptions || []).map(e => ({
    id: e.id,
    txId: e.transactionId,
    type: e.type,
    diff: e.difference,
    booksAmt: e.booksAmount,
    pmtAmt: e.paymentAmount,
    settleAmt: e.settlementAmount,
    bankAmt: e.bankAmount,
    action: e.recommendedAction,
    reason: e.actionReason || e.details,
    material: e.thresholdExceeded,
    rule: e.ruleApplied
  }));

  // Extract controller queue actions if present
  const compactActions = (report.controllerActionQueue || []).slice(0, 20).map(a => ({
    txId: a.transactionId,
    type: a.type,
    exposed: a.amountExposed,
    action: a.recommendedAction,
    reason: a.oneLineReason
  }));

  // Condense payment method summary
  const compactMethods = (report.paymentMethodSummary || []).map(m => ({
    method: m.paymentMethod,
    count: m.transactionCount,
    matched: m.fullyMatched,
    rate: `${m.matchRate}%`,
    exceptions: m.exceptionCount,
    val: m.settlementValue
  }));

  // Build the unified token-optimized financial state object
  const tokenOptimizedState = {
    batchId: report.batchId,
    timestamp: report.processedAt,
    mode: report.processingMode,
    integrity: report.overallIntegrityStatus,
    matchRate: `${report.matchRate}%`,
    exceptionRate: `${report.exceptionRate}%`,
    autoResolutionRate: `${report.autoResolutionRate}%`,
    batchSize: report.batchSize,
    counts: {
      fullyMatched: report.fullyMatched,
      partialMatches: report.partialMatches,
      unmatched: report.unmatched,
      withExceptions: report.transactionsWithExceptions,
      totalExceptions: report.totalExceptionItems
    },
    amounts: report.amountSummary,
    timing: report.settlementTimingSummary ? {
      sameDay: report.settlementTimingSummary.sameDay,
      tPlus1: report.settlementTimingSummary.tPlus1,
      tPlus2: report.settlementTimingSummary.tPlus2,
      tPlus3Plus: report.settlementTimingSummary.tPlus3OrMore,
      reviewCount: report.settlementTimingSummary.timingReviewCount
    } : undefined,
    methods: compactMethods,
    exceptions: compactExceptions,
    actionQueue: compactActions,
    warnings: report.dataQualityWarnings || [],
    meta: {
      company: additionalContext?.companyName,
      currency: additionalContext?.currency || 'INR',
      stale: additionalContext?.isReconciliationStale,
      staleReason: additionalContext?.staleReason,
      ledgerCounts: {
        invoices: additionalContext?.invoicesCount,
        payments: additionalContext?.paymentsCount,
        settlements: additionalContext?.settlementsCount,
        bankCredits: additionalContext?.bankCreditsCount
      }
    }
  };

  // Minify to zero-whitespace string for maximum token efficiency
  return JSON.stringify(tokenOptimizedState);
}

export default function AIFinancialAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [manualKey, setManualKey] = useState(() => 
    localStorage.getItem('gemini_api_key') || localStorage.getItem('GEMINI_API_KEY') || ''
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'agent', text: 'Hello! I am your AI Financial Controller. Ask me to check for discrepancies, summarize your settlements, explain exceptions, or analyze your cash flow.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { 
    invoices, 
    payments, 
    settlements, 
    bankCredits, 
    latestResult, 
    dataMode, 
    rules, 
    companyProfile, 
    fileNames, 
    lastRunTimestamp, 
    isReconciliationStale, 
    staleReason 
  } = useFinanceData();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset / Clear chat conversation history
  const handleClearChat = () => {
    setMessages([
      { role: 'agent', text: 'Hello! I am your AI Financial Controller. Chat history cleared. How can I assist you with your reconciliation and ledger audits today?' }
    ]);
  };

  // Synchronize key dynamically from localStorage (e.g. when configured in Settings tab)
  useEffect(() => {
    const syncKeyFromStorage = () => {
      const activeKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('GEMINI_API_KEY') || '';
      setManualKey(activeKey);
    };

    syncKeyFromStorage();
    window.addEventListener('storage', syncKeyFromStorage);
    return () => window.removeEventListener('storage', syncKeyFromStorage);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const activeKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('GEMINI_API_KEY') || '';
      setManualKey(activeKey);
    }
  }, [isOpen]);

  const saveManualKey = (key: string) => {
    const trimmed = key.trim();
    setManualKey(trimmed);
    if (trimmed) {
      localStorage.setItem('gemini_api_key', trimmed);
      localStorage.setItem('GEMINI_API_KEY', trimmed);
    } else {
      localStorage.removeItem('gemini_api_key');
      localStorage.removeItem('GEMINI_API_KEY');
    }
    window.dispatchEvent(new Event('storage'));
    setShowKeyInput(false);
  };

  // Direct client-side synthesizer if the server / network has any issue
  const synthesizeLocalAnalysis = (userMsg: string) => {
    if (!latestResult) {
      return `### ⚠️ No Reconciliation Data Available\n\nNo reconciliation report was found in this session. Please upload your CSVs or run synthetic demo data in the **Upload / Run** tab first.`;
    }

    const amt = latestResult.amountSummary;
    const p = userMsg.toLowerCase();

    if (p.includes("exception") || p.includes("discrepancy") || p.includes("error") || p.includes("mismatch") || p.includes("why")) {
      const topExceptions = (latestResult.exceptions || []).slice(0, 5);
      let list = "";
      if (topExceptions.length > 0) {
        list = topExceptions.map((e, idx) => {
          return `**${idx + 1}. [${e.type}] Invoice ${e.transactionId}**\n` +
                 `- **Difference:** ₹${e.difference.toLocaleString('en-IN')}\n` +
                 `- **Recommended Action:** \`${e.recommendedAction}\`\n` +
                 `- **Analysis:** ${e.details || e.actionReason || 'Amount mismatch detected in settlement pipeline'}`;
        }).join("\n\n");
      } else {
        list = "No exceptions identified in the current batch.";
      }

      return `### 📋 Financial Exception Audit Report\n\n` +
             `Our reconciliation engine flagged **${latestResult.totalExceptionItems} exceptions** representing **₹${amt.totalExceptionExposure.toLocaleString('en-IN')}** in financial risk exposure.\n\n` +
             `#### Priority Exceptions:\n\n${list}\n\n` +
             `> **Action Required:** Invoices with high variance should be reviewed with the payment gateway or escalated to the billing team.`;
    }

    if (p.includes("cash") || p.includes("flow") || p.includes("settlement") || p.includes("bank") || p.includes("liquidity")) {
      return `### 💰 Cash Flow & Settlement Pipeline\n\n` +
             `- **Confirmed Bank Credited Cash:** ₹${amt.bankCreditedValue.toLocaleString('en-IN')}\n` +
             `- **Pending Settlement Pipeline:** ₹${amt.pendingSettlementValue.toLocaleString('en-IN')}\n` +
             `- **Gateway Processing Fees (MDR + GST):** ₹${(amt.totalMdr + amt.totalGstOnMdr).toLocaleString('en-IN')}\n` +
             `- **Total Invoiced Receivables:** ₹${amt.grossInvoiceValue.toLocaleString('en-IN')}\n\n` +
             `**Settlement Conversion:** Approximately **${amt.grossInvoiceValue ? ((amt.bankCreditedValue / amt.grossInvoiceValue) * 100).toFixed(1) : 0}%** of total billed receivables are currently credited in your bank accounts.`;
    }

    if (p.includes("chart") || p.includes("visual") || p.includes("graph") || p.includes("distribution")) {
      const matchPct = ((latestResult.fullyMatched / (latestResult.batchSize || 1)) * 100).toFixed(1);
      const partialPct = ((latestResult.partialMatches / (latestResult.batchSize || 1)) * 100).toFixed(1);
      const exPct = ((latestResult.totalExceptionItems / (latestResult.batchSize || 1)) * 100).toFixed(1);
      const unPct = ((latestResult.unmatched / (latestResult.batchSize || 1)) * 100).toFixed(1);
      return `### 📊 Visual Reconciliation Chart Breakdown\n\n` +
             `Here is the clear ledger transaction distribution for batch \`${latestResult.batchId}\`:\n\n` +
             `| Status Segment | Count | Share | Visual Distribution |\n` +
             `| :--- | :--- | :--- | :--- |\n` +
             `| 🟢 **Fully Matched** | ${latestResult.fullyMatched} | ${matchPct}% | \`${"█".repeat(Math.max(1, Math.round(Number(matchPct) / 10)))}\` |\n` +
             `| 🟡 **Partial Matches** | ${latestResult.partialMatches} | ${partialPct}% | \`${"█".repeat(Math.max(1, Math.round(Number(partialPct) / 10)))}\` |\n` +
             `| 🔴 **Exceptions Flagged** | ${latestResult.totalExceptionItems} | ${exPct}% | \`${"█".repeat(Math.max(1, Math.round(Number(exPct) / 10)))}\` |\n` +
             `| ⚪ **Unmatched** | ${latestResult.unmatched} | ${unPct}% | \`${"█".repeat(Math.max(1, Math.round(Number(unPct) / 10)))}\` |\n\n` +
             `#### 💰 Cash Flow Distribution\n` +
             `- **Confirmed Bank Cash:** ₹${amt.bankCreditedValue.toLocaleString('en-IN')}\n` +
             `- **Pending Settlements:** ₹${amt.pendingSettlementValue.toLocaleString('en-IN')}\n` +
             `- **Discrepancy Exposure:** ₹${amt.totalExceptionExposure.toLocaleString('en-IN')}\n\n` +
             `*(Click the **Chart** icon in the header above to open the live interactive visual chart bar anytime.)*`;
    }

    // Default executive summary
    return `### 📊 Executive Financial Reconciliation Summary\n\n` +
           `| Metric | Status / Value |\n` +
           `| :--- | :--- |\n` +
           `| **Batch Integrity** | \`${latestResult.overallIntegrityStatus.toUpperCase()}\` |\n` +
           `| **Reconciliation Match Rate** | **${latestResult.matchRate}%** |\n` +
           `| **Fully Matched Transactions** | ${latestResult.fullyMatched} of ${latestResult.batchSize} |\n` +
           `| **Partial Matches** | ${latestResult.partialMatches} |\n` +
           `| **Unmatched Transactions** | ${latestResult.unmatched} |\n` +
           `| **Active Exceptions** | ${latestResult.totalExceptionItems} |\n` +
           `| **Total Discrepancy Exposure** | ₹${amt.totalExceptionExposure.toLocaleString('en-IN')} |\n` +
           `| **Confirmed Bank Cash** | ₹${amt.bankCreditedValue.toLocaleString('en-IN')} |\n` +
           `| **Pending Settlements** | ₹${amt.pendingSettlementValue.toLocaleString('en-IN')} |\n\n` +
           `*All figures are deterministically audited across your ledger files for ${companyProfile.companyName}. Ask me about specific exceptions, cash flow forecasting, or fee audits for more granular breakdowns.*`;
  };

  const handleSend = async (textOverride?: string) => {
    const userMsg = (textOverride || input).trim();
    if (!userMsg) return;

    if (userMsg.toLowerCase().includes("chart") || userMsg.toLowerCase().includes("graph")) {
      setShowChart(true);
    }

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    // Extract the raw reconciliation report from FinanceDataContext and format into a minified, token-optimized JSON string
    const minifiedReportJson = formatTokenOptimizedReport(latestResult, {
      companyName: companyProfile.companyName,
      currency: 'INR',
      invoicesCount: invoices.length,
      paymentsCount: payments.length,
      settlementsCount: settlements.length,
      bankCreditsCount: bankCredits.length,
      dataMode,
      fileNames,
      isReconciliationStale,
      staleReason
    });

    // Construct system prompt injecting the minified JSON string for context-aware financial reasoning
    const systemPrompt = `You are a strict Corporate Financial Controller and Senior Ledger Analyst.
You cannot do math yourself. You must ONLY use the exact deterministic numbers and data provided in the token-optimized JSON report below.
You must act purely as a data analyst, translating the raw JSON reconciliation results, exceptions, and amounts into plain, executive English advice.
Do NOT hallucinate or alter any financial figures. Format your responses with clean Markdown, bold headers, and structured tables where appropriate.

FINANCIAL_STATE_JSON:${minifiedReportJson}`;

    // Build the complete, aggregated reconciliation report JSON from the current FinanceDataContext
    const aggregatedReport = latestResult ? {
      batchId: latestResult.batchId,
      processedAt: latestResult.processedAt,
      processingMode: latestResult.processingMode || dataMode,
      batchSize: latestResult.batchSize,
      matchRate: `${latestResult.matchRate}%`,
      exceptionRate: `${latestResult.exceptionRate}%`,
      autoResolutionRate: `${latestResult.autoResolutionRate}%`,
      overallIntegrityStatus: latestResult.overallIntegrityStatus,
      summaryCounts: {
        fullyMatched: latestResult.fullyMatched,
        partialMatches: latestResult.partialMatches,
        unmatched: latestResult.unmatched,
        transactionsWithExceptions: latestResult.transactionsWithExceptions,
        totalExceptionItems: latestResult.totalExceptionItems,
      },
      amountSummary: latestResult.amountSummary,
      settlementTimingSummary: latestResult.settlementTimingSummary,
      paymentMethodSummary: latestResult.paymentMethodSummary,
      complianceScreening: latestResult.complianceScreening,
      integrityChecks: latestResult.integrityChecks,
      exceptions: latestResult.exceptions,
      controllerActionQueue: latestResult.controllerActionQueue,
      dataQualityWarnings: latestResult.dataQualityWarnings,
      matchingRulesApplied: latestResult.matchingRulesApplied,
    } : null;

    const contextPayload = {
      reconciliationReport: aggregatedReport,
      minifiedReportJson,
      datasetInfo: {
        dataMode,
        fileNames,
        lastRunTimestamp,
        isReconciliationStale,
        staleReason,
        totalInvoices: invoices.length,
        totalPayments: payments.length,
        totalSettlements: settlements.length,
        totalBankCredits: bankCredits.length,
      },
      rules,
      companyProfile,
      latestResult: aggregatedReport,
      exceptions: latestResult?.exceptions || [],
      actionQueue: latestResult?.controllerActionQueue || []
    };

    // Prefer locally persisted key from localStorage / user settings
    const userKey = (manualKey || localStorage.getItem('gemini_api_key') || localStorage.getItem('GEMINI_API_KEY') || '').trim();
    const keyToSend = userKey || undefined;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userMsg, 
          systemPrompt,
          minifiedReportJson,
          context: contextPayload,
          manualApiKey: keyToSend
        }),
      });

      if (!response.ok) {
        // Fall back directly to the high-precision deterministic analysis instead of displaying error
        const localText = synthesizeLocalAnalysis(userMsg);
        setMessages(prev => [...prev, { role: 'agent', text: localText }]);
        return;
      }

      const data = await response.json();
      if (data && data.text) {
        setMessages(prev => [...prev, { role: 'agent', text: data.text }]);
      } else {
        const localText = synthesizeLocalAnalysis(userMsg);
        setMessages(prev => [...prev, { role: 'agent', text: localText }]);
      }
    } catch (error: any) {
      console.warn("API request issue, generating direct controller analysis:", error);
      const localText = synthesizeLocalAnalysis(userMsg);
      setMessages(prev => [...prev, { role: 'agent', text: localText }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-neu-primary text-neu-base rounded-full shadow-neu-extruded hover:-translate-y-1 transition-all z-50 flex items-center gap-2"
        >
          <Bot className="w-6 h-6" />
          <span className="font-bold pr-2">AI Controller</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[30rem] h-[38rem] max-h-[85vh] bg-neu-base rounded-2xl shadow-neu-extruded flex flex-col z-50 overflow-hidden border border-neu-border">
          {/* Header */}
          <div className="bg-neu-primary p-4 flex justify-between items-center text-neu-base shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-neu-accent" />
              <div>
                <h3 className="font-bold text-sm">AI Financial Controller</h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-neu-accent font-medium">Reconciliation & Ledger Intelligence</span>
                  {manualKey ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#9EEB75]/25 text-[#1B5E20] font-extrabold border border-[#9EEB75]/60 flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> Key Active
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Toggle Visual Reconciliation Chart */}
              <button 
                onClick={() => setShowChart(!showChart)} 
                title={showChart ? "Hide Reconciliation Chart" : "Show Clear Reconciliation Chart"}
                className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${showChart ? 'bg-neu-accent text-white shadow-neu-flat' : 'text-neutral-300 hover:bg-white/10 hover:text-white'}`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Chart</span>
              </button>

              {/* Clear Chat History */}
              <button 
                onClick={handleClearChat} 
                title="Clear conversation history"
                className="px-2 py-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Clear</span>
              </button>

              {/* Configure API Key */}
              <button 
                onClick={() => setShowKeyInput(!showKeyInput)} 
                title={manualKey ? "Custom API Key Active (Click to edit)" : "Configure custom Gemini API key"}
                className={`p-1.5 rounded-lg transition-colors ${manualKey ? 'text-[#9EEB75] bg-white/10 hover:bg-white/20' : 'text-neutral-400 hover:bg-white/10'}`}
              >
                <Key className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:opacity-80 transition-opacity p-1 text-neutral-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Optional Manual Key Drawer */}
          {showKeyInput && (
            <div className="bg-neutral-900 text-white p-3 text-xs flex flex-col gap-2 border-b border-neutral-700">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-neutral-300">Custom API Key</span>
                <span className="text-[10px] text-neutral-400">Synced with Settings tab</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  placeholder="Paste API key..."
                  className="flex-1 px-2.5 py-1.5 rounded bg-neutral-800 border border-neutral-700 text-white text-xs focus:outline-none focus:border-neu-accent"
                />
                <button
                  onClick={() => saveManualKey(manualKey)}
                  className="px-3 py-1.5 bg-neu-accent text-neu-primary font-bold rounded flex items-center gap-1 hover:brightness-110"
                >
                  <Check className="w-3 h-3" /> Save
                </button>
                {manualKey && (
                  <button
                    onClick={() => saveManualKey('')}
                    className="px-2.5 py-1.5 bg-red-600/30 text-red-300 hover:bg-red-600/50 rounded font-medium"
                    title="Remove custom key"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="text-[10px] text-neutral-400">
                Key is persisted strictly in your browser's <code className="text-neutral-300 font-mono">localStorage</code>.
              </div>
            </div>
          )}

          {/* Live Clear Visual Chart Panel */}
          {showChart && (
            <div className="bg-neu-base border-b border-neu-border p-3.5 space-y-3 shrink-0 shadow-neu-inset text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-neu-accent" />
                  <span className="font-bold text-neu-primary text-xs uppercase tracking-wider">Reconciliation Audit Chart</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neu-primary text-neu-base">
                    {latestResult ? `${latestResult.matchRate}% Match` : 'No Data'}
                  </span>
                  <button
                    onClick={() => setShowChart(false)}
                    className="text-neu-muted hover:text-neu-primary p-0.5"
                    title="Close Chart"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {latestResult ? (
                <div className="space-y-2.5">
                  {/* Transaction Breakdown Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] font-semibold text-neu-muted mb-1">
                      <span>Ledger Distribution ({latestResult.batchSize} items)</span>
                      <span>{latestResult.fullyMatched} Matched · {latestResult.totalExceptionItems} Exceptions</span>
                    </div>
                    <div className="h-3 w-full bg-neutral-200 rounded-full overflow-hidden flex shadow-inner">
                      <div 
                        style={{ width: `${(latestResult.fullyMatched / (latestResult.batchSize || 1)) * 100}%` }} 
                        className="bg-[#2E7D32] h-full transition-all" 
                        title={`Matched: ${latestResult.fullyMatched}`}
                      />
                      <div 
                        style={{ width: `${(latestResult.partialMatches / (latestResult.batchSize || 1)) * 100}%` }} 
                        className="bg-[#F39C12] h-full transition-all" 
                        title={`Partial: ${latestResult.partialMatches}`}
                      />
                      <div 
                        style={{ width: `${(latestResult.totalExceptionItems / (latestResult.batchSize || 1)) * 100}%` }} 
                        className="bg-[#E74C3C] h-full transition-all" 
                        title={`Exceptions: ${latestResult.totalExceptionItems}`}
                      />
                      <div 
                        style={{ width: `${(latestResult.unmatched / (latestResult.batchSize || 1)) * 100}%` }} 
                        className="bg-neutral-400 h-full transition-all" 
                        title={`Unmatched: ${latestResult.unmatched}`}
                      />
                    </div>
                    <div className="flex flex-wrap justify-between gap-1 text-[9px] text-neu-muted mt-1.5 font-mono">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></span> Matched ({latestResult.fullyMatched})</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#F39C12]"></span> Partial ({latestResult.partialMatches})</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#E74C3C]"></span> Exceptions ({latestResult.totalExceptionItems})</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span> Unmatched ({latestResult.unmatched})</span>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div className="p-2 rounded-xl bg-neutral-100/90 border border-neutral-200">
                      <span className="text-[9px] uppercase font-bold text-neu-muted block">Confirmed Bank Cash</span>
                      <span className="font-bold text-xs text-[#2E7D32]">
                        ₹{(latestResult.amountSummary.bankCreditedValue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-100/90 border border-neutral-200">
                      <span className="text-[9px] uppercase font-bold text-neu-muted block">Discrepancy Exposure</span>
                      <span className="font-bold text-xs text-[#E74C3C]">
                        ₹{(latestResult.amountSummary.totalExceptionExposure || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-neu-border/60">
                    <button
                      onClick={() => handleSend("Explain the variance and distribution shown in the reconciliation chart")}
                      className="text-[10px] font-bold text-neu-accent hover:underline flex items-center gap-1"
                    >
                      <TrendingUp className="w-3 h-3" /> Audit this chart in chat
                    </button>
                    <button
                      onClick={() => setShowChart(false)}
                      className="text-[10px] text-neu-muted hover:text-neu-primary font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-neu-muted text-center py-2">
                  No reconciliation data available. Run demo data or upload CSVs in the Upload tab.
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neu-background">
            {messages.length === 1 && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="text-xs text-neutral-500 font-medium mb-1">Quick controller questions:</div>
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(action)}
                    className="self-start text-xs font-semibold px-3 py-1.5 bg-neu-base text-neu-primary border border-neu-border rounded-full hover:bg-neu-primary hover:text-neu-base transition-colors shadow-neu-flat"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-neu-primary text-neu-base rounded-br-none shadow-neu-flat' : 'bg-neu-base text-neu-primary rounded-bl-none shadow-neu-flat border border-neu-border'}`}>
                  {msg.role === 'agent' && <MessageSquare className="w-4 h-4 mb-2 opacity-50" />}
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-neu-primary prose-headings:text-neu-primary prose-a:text-neu-accent prose-strong:text-neu-primary prose-code:text-neu-accent prose-table:text-xs">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neu-base p-3 rounded-2xl rounded-bl-none shadow-neu-flat border border-neu-border text-neu-primary flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Analyzing reconciliation report & ledgers...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-neu-base border-t border-neu-border flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about discrepancies, cash flow, settlements..."
              className="flex-1 p-3 rounded-xl bg-neu-background shadow-neu-inset text-sm text-neu-primary focus:outline-none focus:ring-2 focus:ring-neu-accent"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-neu-primary text-neu-base rounded-xl shadow-neu-flat hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

