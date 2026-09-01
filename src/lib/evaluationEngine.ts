import { 
  ReconciliationResult, 
  GroundTruthTransaction, 
  BuildathonAccuracyMetrics, 
  HonestExceptionRecord, 
  Track04EvaluationSummary,
  ExceptionType
} from '../types';
import { getSyntheticEvaluationGroundTruth } from './syntheticGroundTruth';

/**
 * Evaluates the reconciliation output against the central synthetic ground truth.
 * Returns null / unavailable metrics if running on custom local CSVs without ground truth.
 */
export function evaluateReconciliationResult(
  result: ReconciliationResult | null,
  isStale: boolean
): Track04EvaluationSummary | null {
  if (!result) return null;

  const groundTruthList = getSyntheticEvaluationGroundTruth();
  const groundTruthMap = new Map<string, GroundTruthTransaction>();
  groundTruthList.forEach(gt => groundTruthMap.set(gt.transactionId, gt));

  // Determine if this run matches the synthetic dataset (e.g. at least 50% ID match with ground truth)
  const matchingTxCount = Object.keys(result.statusesByTransactionId).filter(id => groundTruthMap.has(id)).length;
  const isGroundTruthAvailable = result.processingMode === "Synthetic Demo Data" || matchingTxCount >= 50;

  // 1. Status Accounting Check
  const statusSum = result.fullyMatched + result.partialMatches + result.unmatched;
  const statusAccountingReconciled = statusSum === result.batchSize;
  const statusAccountingFormula = `${result.fullyMatched} Fully Matched + ${result.partialMatches} Partial + ${result.unmatched} Unmatched = ${statusSum} / ${result.batchSize} Total`;

  // 2. Build Honest Exception Records
  const honestExceptions: HonestExceptionRecord[] = [];
  let totalInrExceptionExposure = 0;
  let largestUnresolvedDifference = 0;
  let materialExceptionsCount = 0;
  let dataQualityBlockedCount = 0;
  let autoResolvedExceptionItemsCount = 0;
  let unresolvedExceptionItemsCount = 0;
  const unresolvedTxIds = new Set<string>();

  result.exceptions.forEach(e => {
    let resolutionState: HonestExceptionRecord['resolutionState'] = 'Unresolved — Manual Review';

    if (e.recommendedAction === 'auto_resolve') {
      resolutionState = 'Auto-resolved';
      autoResolvedExceptionItemsCount++;
    } else if (e.type === 'Data_Quality_Issue') {
      resolutionState = 'Data Quality Blocked';
      dataQualityBlockedCount++;
      unresolvedExceptionItemsCount++;
      unresolvedTxIds.add(e.transactionId);
    } else if (e.recommendedAction === 'escalate') {
      resolutionState = 'Unresolved — Escalate';
      unresolvedExceptionItemsCount++;
      unresolvedTxIds.add(e.transactionId);
    } else {
      resolutionState = 'Unresolved — Manual Review';
      unresolvedExceptionItemsCount++;
      unresolvedTxIds.add(e.transactionId);
    }

    const exposure = Math.abs(e.difference) || Math.max(e.booksAmount, e.paymentAmount, e.settlementAmount, e.bankAmount, 0);
    if (resolutionState !== 'Auto-resolved') {
      totalInrExceptionExposure += exposure;
      if (Math.abs(e.difference) > largestUnresolvedDifference) {
        largestUnresolvedDifference = Math.abs(e.difference);
      }
      if (e.thresholdExceeded) {
        materialExceptionsCount++;
      }
    }

    const finalStatus = result.statusesByTransactionId[e.transactionId] || 'Partial_Match';

    honestExceptions.push({
      exceptionId: e.id,
      transactionId: e.transactionId,
      finalStatus,
      type: e.type,
      invoiceAmount: e.booksAmount || 0,
      paymentAmount: e.paymentAmount || 0,
      settlementAmount: e.settlementAmount || 0,
      bankAmount: e.bankAmount || 0,
      difference: e.difference || 0,
      ruleApplied: e.ruleApplied || 'Rule Check',
      evidenceAvailable: e.evidenceAvailable || [],
      evidenceMissing: e.evidenceMissing || [],
      deterministicMatchConfidence: e.deterministicMatchConfidence || 'High',
      materialityThreshold: e.materialityThreshold || 1000,
      thresholdExceeded: e.thresholdExceeded || false,
      recommendedAction: e.recommendedAction,
      reason: e.actionReason || e.details || 'Exception recorded by deterministic matching engine.',
      resolutionState
    });
  });

  // 3. Measured Accuracy Calculation (if ground truth available)
  let accuracyMetrics: BuildathonAccuracyMetrics = {
    isGroundTruthAvailable: false,
    finalStatusAccuracy: 0,
    correctFinalStatusCount: 0,
    totalGroundTruthCount: 0,
    exceptionClassificationAccuracy: 0,
    correctExpectedExceptionLabelsCount: 0,
    totalExpectedExceptionLabelsCount: 0,
    falsePositivesCount: 0,
    falseNegativesCount: 0,
    recommendedActionAccuracy: 0,
    correctActionsCount: 0,
    totalActionRequiredCount: 0,
    confusionSummary: {
      correctlyFullyMatched: 0,
      correctlyPartialMatched: 0,
      correctlyUnmatched: 0,
      falseFullyMatched: 0,
      falsePartialMatch: 0,
      falseUnmatched: 0,
      missedExceptions: 0,
      extraExceptions: 0
    }
  };

  if (isGroundTruthAvailable) {
    let correctFinalStatusCount = 0;
    let totalGroundTruthCount = groundTruthList.length;

    let correctExpectedExceptionLabelsCount = 0;
    let totalExpectedExceptionLabelsCount = 0;
    let falsePositivesCount = 0;
    let falseNegativesCount = 0;

    let correctActionsCount = 0;
    let totalActionRequiredCount = 0;

    let correctlyFullyMatched = 0;
    let correctlyPartialMatched = 0;
    let correctlyUnmatched = 0;
    let falseFullyMatched = 0;
    let falsePartialMatch = 0;
    let falseUnmatched = 0;

    // Group actual exceptions by transactionId
    const actualExceptionsByTx = new Map<string, ExceptionType[]>();
    const actualActionByTx = new Map<string, string>();

    result.exceptions.forEach(e => {
      if (!actualExceptionsByTx.has(e.transactionId)) {
        actualExceptionsByTx.set(e.transactionId, []);
      }
      actualExceptionsByTx.get(e.transactionId)!.push(e.type);
      // Store highest severity action
      const prev = actualActionByTx.get(e.transactionId);
      if (!prev || e.recommendedAction === 'escalate' || (e.recommendedAction === 'manual_review' && prev === 'auto_resolve')) {
        actualActionByTx.set(e.transactionId, e.recommendedAction);
      }
    });

    groundTruthList.forEach(gt => {
      const actualStatus = result.statusesByTransactionId[gt.transactionId];

      // A. Final Status Accuracy
      if (actualStatus === gt.expectedFinalStatus) {
        correctFinalStatusCount++;
        if (gt.expectedFinalStatus === 'Fully_Matched') correctlyFullyMatched++;
        else if (gt.expectedFinalStatus === 'Partial_Match') correctlyPartialMatched++;
        else if (gt.expectedFinalStatus === 'Unmatched') correctlyUnmatched++;
      } else {
        if (actualStatus === 'Fully_Matched') falseFullyMatched++;
        else if (actualStatus === 'Partial_Match') falsePartialMatch++;
        else if (actualStatus === 'Unmatched') falseUnmatched++;
      }

      // B. Exception Classification Accuracy
      const actualExcs = actualExceptionsByTx.get(gt.transactionId) || [];
      const expectedExcs = gt.expectedExceptionTypes || [];

      totalExpectedExceptionLabelsCount += expectedExcs.length;

      expectedExcs.forEach(expectedType => {
        if (actualExcs.includes(expectedType)) {
          correctExpectedExceptionLabelsCount++;
        } else {
          falseNegativesCount++;
        }
      });

      actualExcs.forEach(actualType => {
        if (!expectedExcs.includes(actualType)) {
          falsePositivesCount++;
        }
      });

      // C. Action Accuracy
      if (gt.expectedRecommendedAction !== 'none') {
        totalActionRequiredCount++;
        const actualAction = actualActionByTx.get(gt.transactionId);
        if (actualAction === gt.expectedRecommendedAction) {
          correctActionsCount++;
        }
      }
    });

    const finalStatusAccuracy = totalGroundTruthCount > 0 
      ? (correctFinalStatusCount / totalGroundTruthCount) * 100 
      : 0;

    const exceptionClassificationAccuracy = totalExpectedExceptionLabelsCount > 0
      ? (correctExpectedExceptionLabelsCount / totalExpectedExceptionLabelsCount) * 100
      : 100;

    const recommendedActionAccuracy = totalActionRequiredCount > 0
      ? (correctActionsCount / totalActionRequiredCount) * 100
      : 100;

    accuracyMetrics = {
      isGroundTruthAvailable: true,
      finalStatusAccuracy: Math.round(finalStatusAccuracy * 10) / 10,
      correctFinalStatusCount,
      totalGroundTruthCount,
      exceptionClassificationAccuracy: Math.round(exceptionClassificationAccuracy * 10) / 10,
      correctExpectedExceptionLabelsCount,
      totalExpectedExceptionLabelsCount,
      falsePositivesCount,
      falseNegativesCount,
      recommendedActionAccuracy: Math.round(recommendedActionAccuracy * 10) / 10,
      correctActionsCount,
      totalActionRequiredCount,
      confusionSummary: {
        correctlyFullyMatched,
        correctlyPartialMatched,
        correctlyUnmatched,
        falseFullyMatched,
        falsePartialMatch,
        falseUnmatched,
        missedExceptions: falseNegativesCount,
        extraExceptions: falsePositivesCount
      }
    };
  }

  const batchSize = result.batchSize || 0;
  const throughputStatus = batchSize >= 50 ? 'Pass' : 'Fail';

  let integrityStatus: "Passed" | "Warning" | "Failed" = "Passed";
  if (!statusAccountingReconciled || result.overallIntegrityStatus === 'fail') {
    integrityStatus = "Failed";
  } else if (result.overallIntegrityStatus === 'warning') {
    integrityStatus = "Warning";
  }

  return {
    trackName: "Razorpay AI Buildathon — Track 04 Evaluation",
    financeOpsLoop: "Invoice → Payment → Settlement → Bank Credit",
    dataMode: result.processingMode,
    batchId: result.batchId,
    processedAt: result.processedAt,
    batchSize,
    requiredMinimumBatchSize: 50,
    throughputStatus,
    matchRate: Math.round(result.matchRate * 10) / 10,
    fullyMatchedCount: result.fullyMatched,
    partialMatchesCount: result.partialMatches,
    unmatchedCount: result.unmatched,
    statusAccountingReconciled,
    statusAccountingFormula,
    accuracyMetrics,
    honestExceptions,
    unresolvedTransactionsCount: unresolvedTxIds.size,
    unresolvedExceptionItemsCount,
    autoResolvedExceptionItemsCount,
    totalInrExceptionExposure: Math.round(totalInrExceptionExposure * 100) / 100,
    largestUnresolvedDifference: Math.round(largestUnresolvedDifference * 100) / 100,
    materialExceptionsCount,
    dataQualityBlockedCount,
    integrityStatus,
    dataFreshness: isStale ? "Previous result — rerun required" : "Current",
    isStale
  };
}
