import { GroundTruthTransaction, ExceptionType } from '../types';

/**
 * Centrally defined ground-truth dataset for AI Finance Controller evaluation.
 * Note: The reconciliation engine does NOT read this ground truth during matching.
 * It is solely used post-reconciliation by the evaluation engine to compute decision accuracy.
 */
export function getSyntheticEvaluationGroundTruth(): GroundTruthTransaction[] {
  const groundTruth: GroundTruthTransaction[] = [];

  for (let i = 1; i <= 100; i++) {
    const idNum = i.toString().padStart(3, '0');
    const transactionId = `INV-${idNum}`;

    // 1. Fully Matched (INV-001 to INV-068) - 68 transactions
    if (i >= 1 && i <= 68) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Fully_Matched",
        expectedExceptionTypes: [],
        expectedRecommendedAction: "none",
        expectedMatchable: true,
        expectedReason: "Four-way loop balanced with deterministic parity across invoice, payment, settlement, and bank credit."
      });
      continue;
    }

    // 2. Timing Differences (INV-069 to INV-078) - 10 transactions
    if (i >= 69 && i <= 74) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Partial_Match",
        expectedExceptionTypes: ["Timing_Difference"],
        expectedRecommendedAction: "manual_review",
        expectedMatchable: true,
        expectedReason: "Gateway settlement timing exceeds 3 business days threshold; requires merchant terms review."
      });
      continue;
    }

    if (i >= 75 && i <= 78) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Partial_Match",
        expectedExceptionTypes: ["Bank_Credit_Timing_Difference"],
        expectedRecommendedAction: "manual_review",
        expectedMatchable: true,
        expectedReason: "Bank credit timing exceeds 3 business days threshold; requires bank account credit review."
      });
      continue;
    }

    // 3. Amount Mismatches (INV-079 to INV-086) - 8 transactions
    if (i === 79 || i === 80) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Partial_Match",
        expectedExceptionTypes: ["Amount_Mismatch"],
        expectedRecommendedAction: "auto_resolve",
        expectedMatchable: true,
        expectedReason: "Immaterial difference within ₹1 tolerance threshold with full deterministic evidence; auto-resolved."
      });
      continue;
    }

    if (i === 81 || i === 82 || i === 84) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Partial_Match",
        expectedExceptionTypes: ["Amount_Mismatch"],
        expectedRecommendedAction: "manual_review",
        expectedMatchable: true,
        expectedReason: "Non-material amount variance above tolerance but below ₹1,000 materiality threshold; manual review."
      });
      continue;
    }

    if (i === 83 || i === 85 || i === 86) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Partial_Match",
        expectedExceptionTypes: ["Amount_Mismatch"],
        expectedRecommendedAction: "escalate",
        expectedMatchable: true,
        expectedReason: "Material amount variance exceeding ₹1,000 materiality threshold; escalated to finance controller."
      });
      continue;
    }

    // 4. Missing Records (INV-087 to INV-091) - 5 transactions
    if (i === 87 || i === 88) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Unmatched",
        expectedExceptionTypes: ["Missing_in_Payment"],
        expectedRecommendedAction: "escalate",
        expectedMatchable: false,
        expectedReason: "Invoice has no matching payment record in gateway; unresolved customer receivables."
      });
      continue;
    }

    if (i === 89) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Partial_Match",
        expectedExceptionTypes: ["Missing_in_Settlement"],
        expectedRecommendedAction: "manual_review",
        expectedMatchable: true,
        expectedReason: "Payment captured but missing gateway settlement record (< ₹1,000 threshold)."
      });
      continue;
    }

    if (i === 90 || i === 91) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Partial_Match",
        expectedExceptionTypes: ["Missing_in_Settlement"],
        expectedRecommendedAction: "escalate",
        expectedMatchable: true,
        expectedReason: "Payment captured but missing gateway settlement record (>= ₹1,000 material threshold)."
      });
      continue;
    }

    // 5. Missing in Bank (INV-092 to INV-094) - 3 transactions
    if (i === 92) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Partial_Match",
        expectedExceptionTypes: ["Missing_in_Bank"],
        expectedRecommendedAction: "manual_review",
        expectedMatchable: true,
        expectedReason: "Settlement confirmed by gateway but no bank statement credit identified (< ₹1,000 threshold)."
      });
      continue;
    }

    if (i === 93 || i === 94) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Partial_Match",
        expectedExceptionTypes: ["Missing_in_Bank"],
        expectedRecommendedAction: "escalate",
        expectedMatchable: true,
        expectedReason: "Settlement confirmed by gateway but no bank credit found (>= ₹1,000 material threshold)."
      });
      continue;
    }

    // 6. Duplicate Records (INV-095 to INV-097) - 3 transactions
    if (i === 95 || i === 96 || i === 97) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Partial_Match",
        expectedExceptionTypes: ["Duplicate"],
        expectedRecommendedAction: "escalate",
        expectedMatchable: false,
        expectedReason: "Duplicate transaction identifier identified in the loop ledger; blocked for integrity audit."
      });
      continue;
    }

    // 7. Data Quality Issues (INV-098 to INV-100) - 3 transactions
    if (i === 98 || i === 99 || i === 100) {
      groundTruth.push({
        transactionId,
        expectedFinalStatus: "Partial_Match",
        expectedExceptionTypes: ["Data_Quality_Issue"],
        expectedRecommendedAction: i === 99 ? "manual_review" : "escalate",
        expectedMatchable: false,
        expectedReason: "Schema/date/deduction data quality corruption requiring engineering pipeline triage."
      });
      continue;
    }
  }

  return groundTruth;
}
