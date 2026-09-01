import { ReconciliationResult, ExceptionItem } from '../types';

export interface ControllerInsightAnswer {
  id: string;
  question: string;
  shortSummary: string;
  metrics: { label: string; value: string; highlight?: boolean; warning?: boolean }[];
  details: string[];
  recommendations: string[];
}

export function generateControllerInsights(result: ReconciliationResult | null): ControllerInsightAnswer[] {
  if (!result) return [];

  const { amountSummary, batchSize, fullyMatched, exceptions, paymentMethodSummary, rulesFingerprint } = result;

  // 1. Why is cash position lower than expected?
  const topContributing = [...exceptions]
    .filter(e => e.recommendedAction !== 'auto_resolve')
    .sort((a, b) => {
      const expA = Math.abs(a.difference) || Math.max(a.booksAmount, a.paymentAmount, a.settlementAmount, a.bankAmount);
      const expB = Math.abs(b.difference) || Math.max(b.booksAmount, b.paymentAmount, b.settlementAmount, b.bankAmount);
      return expB - expA;
    })
    .slice(0, 3);

  const cashWhyAnswer: ControllerInsightAnswer = {
    id: 'cash-lower-than-expected',
    question: 'Why is my cash position lower than expected?',
    shortSummary: `Confirmed liquidity is ₹${amountSummary.bankCreditedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} while ₹${(amountSummary.pendingSettlementValue + amountSummary.uncreditedBankValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })} remains tied up in gateway processing and uncredited bank queues.`,
    metrics: [
      { label: 'Confirmed Bank Cash', value: `₹${amountSummary.bankCreditedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, highlight: true },
      { label: 'Pending Settlement Value', value: `₹${amountSummary.pendingSettlementValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, warning: true },
      { label: 'Uncredited Bank Value', value: `₹${amountSummary.uncreditedBankValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, warning: true },
      { label: 'Total Exception Exposure', value: `₹${amountSummary.totalExceptionExposure.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, warning: true }
    ],
    details: [
      `Gateway Pipeline Hold: ₹${amountSummary.pendingSettlementValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} in captured payments has not settled to the merchant ledger.`,
      `Bank Ingestion Lag: ₹${amountSummary.uncreditedBankValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} in confirmed settlements has not cleared the destination bank account.`,
      `Top Contributing Variance: ${topContributing.map(e => `${e.transactionId} (${e.type.replace(/_/g, ' ')}: ₹${(Math.abs(e.difference) || e.settlementAmount || e.booksAmount).toLocaleString('en-IN')})`).join(', ') || 'No material open variances.'}`
    ],
    recommendations: [
      'Prioritize manual settlement trigger for pending gateway batches older than T+2 days.',
      'Request bank credit UTR statement confirmation from acquiring bank for uncredited settlement files.',
      'Review high-exposure customer invoices flagged under the Controller Action Queue.'
    ]
  };

  // 2. What is the biggest exception?
  const sortedByExposure = [...exceptions].sort((a, b) => {
    const expA = Math.abs(a.difference) || Math.max(a.booksAmount, a.paymentAmount, a.settlementAmount, a.bankAmount);
    const expB = Math.abs(b.difference) || Math.max(b.booksAmount, b.paymentAmount, b.settlementAmount, b.bankAmount);
    return expB - expA;
  });

  const biggest = sortedByExposure[0];
  const biggestExposure = biggest 
    ? (Math.abs(biggest.difference) || Math.max(biggest.booksAmount, biggest.paymentAmount, biggest.settlementAmount, biggest.bankAmount))
    : 0;

  const biggestExceptionAnswer: ControllerInsightAnswer = {
    id: 'biggest-exception',
    question: 'What is the biggest exception?',
    shortSummary: biggest 
      ? `Transaction ${biggest.transactionId} represents the highest exposure at ₹${biggestExposure.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${biggest.type.replace(/_/g, ' ')}).`
      : 'No exceptions detected in the current reconciliation batch.',
    metrics: biggest ? [
      { label: 'Transaction ID', value: biggest.transactionId, highlight: true },
      { label: 'Exception Type', value: biggest.type.replace(/_/g, ' ') },
      { label: 'Variance Amount', value: `₹${(Math.abs(biggest.difference) || biggestExposure).toLocaleString('en-IN')}`, warning: true },
      { label: 'Materiality Threshold', value: `₹${(biggest.materialityThreshold || 1000).toLocaleString('en-IN')}` },
      { label: 'Recommended Action', value: biggest.recommendedAction.toUpperCase(), highlight: true }
    ] : [],
    details: biggest ? [
      `Rule Triggered: ${biggest.ruleApplied}`,
      `Deterministic Confidence: ${biggest.deterministicMatchConfidence}`,
      `Evidence Available: ${biggest.evidenceAvailable.join(', ') || 'None'}`,
      `Evidence Missing: ${biggest.evidenceMissing.join(', ') || 'None identified'}`,
      `Action Context: ${biggest.actionReason || biggest.details}`
    ] : ['All transactions matched deterministically.'],
    recommendations: biggest ? [
      `Execute ${biggest.recommendedAction.replace(/_/g, ' ')} protocol immediately on transaction ${biggest.transactionId}.`,
      `Collect missing audit trail document: ${biggest.evidenceMissing.join(', ') || 'Bank UTR Advice'}.`
    ] : ['No action required.']
  };

  // 3. How many transactions were automatically resolved?
  const autoResolvedCount = exceptions.filter(e => e.recommendedAction === 'auto_resolve').length;
  const autoResolutionRate = batchSize > 0 ? (autoResolvedCount / batchSize) * 100 : 0;

  const autoResolveAnswer: ControllerInsightAnswer = {
    id: 'auto-resolution-stats',
    question: 'How many transactions were automatically resolved?',
    shortSummary: `${autoResolvedCount} transactions were automatically resolved based on tolerance boundaries and high deterministic evidence, while ${fullyMatched} transactions were fully balanced natively.`,
    metrics: [
      { label: 'Auto-Resolved Items', value: `${autoResolvedCount} records`, highlight: true },
      { label: 'Fully Matched Records', value: `${fullyMatched} records`, highlight: true },
      { label: 'Total Batch Size', value: `${batchSize} records` },
      { label: 'Auto-Resolution Rate', value: `${autoResolutionRate.toFixed(1)}%` }
    ],
    details: [
      `Immaterial Rounding & Tolerance: ${autoResolvedCount} amount discrepancies evaluated below the configured tolerance threshold and satisfied complete deterministic proof.`,
      `Zero False-Positives: Auto-resolution is restricted to records with High confidence and zero missing evidence tags.`,
      `Audit Logging: Every auto-resolved decision is logged with its mathematical rationale in the honest exception ledger.`
    ],
    recommendations: [
      'Maintain tolerance threshold at ₹1.00 for strict operational conservatism.',
      'Export audit trail quarterly to confirm auto-resolution consistency.'
    ]
  };

  // 4. Which payment method has the lowest match rate?
  const sortedPMethods = [...(paymentMethodSummary || [])].sort((a, b) => a.matchRate - b.matchRate);
  const lowestPm = sortedPMethods[0];

  const lowestPmAnswer: ControllerInsightAnswer = {
    id: 'lowest-match-rate-pm',
    question: 'Which payment method has the lowest match rate?',
    shortSummary: lowestPm 
      ? `${lowestPm.paymentMethod} has the lowest match rate at ${lowestPm.matchRate.toFixed(1)}% with ${lowestPm.exceptionCount} exceptions across ${lowestPm.transactionCount} transactions.`
      : 'Payment method breakdown is not available for this run.',
    metrics: lowestPm ? [
      { label: 'Payment Method', value: lowestPm.paymentMethod, highlight: true },
      { label: 'Match Rate', value: `${lowestPm.matchRate.toFixed(1)}%`, warning: lowestPm.matchRate < 70 },
      { label: 'Exceptions Count', value: `${lowestPm.exceptionCount} records`, warning: true },
      { label: 'Total Volume', value: `${lowestPm.transactionCount} transactions` },
      { label: 'Settlement Value', value: `₹${lowestPm.settlementValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` }
    ] : [],
    details: lowestPm ? [
      `Method Variance Profile: ${lowestPm.paymentMethod} exhibits higher timing or fee deductions variance compared to other rails.`,
      `Total Net Settled Volume: ₹${lowestPm.settlementValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} settled through ${lowestPm.paymentMethod}.`,
      `Comparison: Other methods average ${((paymentMethodSummary.reduce((acc, p) => acc + p.matchRate, 0) / paymentMethodSummary.length) || 0).toFixed(1)}% match rate across the portfolio.`
    ] : [],
    recommendations: lowestPm ? [
      `Review gateway settlement schedule and gateway fee structure for ${lowestPm.paymentMethod}.`,
      `Inspect timing threshold rules to accommodate bank processing cycles for ${lowestPm.paymentMethod}.`
    ] : []
  };

  return [cashWhyAnswer, biggestExceptionAnswer, autoResolveAnswer, lowestPmAnswer];
}
