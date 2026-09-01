const fs = require('fs');

let content = fs.readFileSync('src/components/ReconciliationTab.tsx', 'utf8');

const exportJsonTarget = `  const exportJSON = () => {
    if (!latestResult) return;
    const blob = new Blob([JSON.stringify(latestResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`reconciliation-\${latestResult.batchId}.json\`;
    a.click();
    URL.revokeObjectURL(url);
  };`;

const exportJsonReplacement = `  const exportJSON = () => {
    if (!latestResult) return;
    const exportData = {
      reportType: "Financial Reconciliation Report",
      appVersion: "1.0.0",
      rulesVersion: "1.0.0",
      processedTimestamp: latestResult.processedAt,
      processingMode: latestResult.processingMode,
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
      exceptions: latestResult.exceptions,
      dataQualityWarnings: latestResult.dataQualityWarnings,
      complianceScreening: latestResult.complianceScreening,
      recommendedActions: latestResult.exceptions.map(e => ({ id: e.id, action: e.recommendedAction })),
      disclaimer: "Prototype finance-operations screening only. This application does not replace official government portals, bank records, payment-gateway settlement terms, qualified accountants, auditors, tax advisers, or legal advisers. Verify all thresholds, rates, eligibility conditions, filings, and settlement obligations before acting."
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`reconciliation-\${latestResult.batchId}.json\`;
    a.click();
    URL.revokeObjectURL(url);
  };`;

content = content.replace(exportJsonTarget, exportJsonReplacement);


const exportCsvTarget = `  const exportCSV = () => {
    if (!latestResult) return;
    const csv = Papa.unparse(latestResult.exceptions);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`exceptions-\${latestResult.batchId}.csv\`;
    a.click();
    URL.revokeObjectURL(url);
  };`;

const exportCsvReplacement = `  const exportCSV = () => {
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
      'Internal Notes': notes[e.id] || e.internalNote || ''
    }));
    
    const csv = Papa.unparse(exportItems);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`exceptions-\${latestResult.batchId}.csv\`;
    a.click();
    URL.revokeObjectURL(url);
  };`;

content = content.replace(exportCsvTarget, exportCsvReplacement);

// Add rules, companyProfile to useFinanceData destructuring
content = content.replace(
  'const { \n    latestResult, runReconciliationWithData, resetDemoData, clearLocalData, \n    dataMode, lastRunTimestamp, saveNote, notes \n  } = useFinanceData();',
  'const { \n    latestResult, runReconciliationWithData, resetDemoData, clearLocalData, \n    dataMode, lastRunTimestamp, saveNote, notes, rules, companyProfile \n  } = useFinanceData();'
)

fs.writeFileSync('src/components/ReconciliationTab.tsx', content);
console.log('Updated exports');
