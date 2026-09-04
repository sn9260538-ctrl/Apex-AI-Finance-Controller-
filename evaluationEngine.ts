export type ExceptionType = 
  | "none" 
  | "amount_mismatch" 
  | "missing_settlement" 
  | "missing_payment" 
  | "duplicate" 
  | "timing_difference" 
  | "refund";

export interface TransactionPrediction {
  transactionId: string;
  actualShouldMatch: boolean;       // Ground truth: true if exact match, false if exception
  actualExceptionType: ExceptionType; // Ground truth exception type
  predictedShouldMatch: boolean;    // System output
  predictedExceptionType: ExceptionType; // System predicted exception type
}

export interface ConfusionMatrix {
  truePositives: number;  // TP: Correctly detected exceptions
  falsePositives: number; // FP: False alarms (flagged as exception, but shouldn't have been)
  trueNegatives: number;  // TN: Correctly matched (normal transaction, correctly left alone)
  falseNegatives: number; // FN: Missed exceptions (was an exception, but system missed it)
}

/**
 * Generates the overarching binary confusion matrix for EXCEPTION DETECTION.
 * "Positive" = Exception detected (!predictedShouldMatch)
 * "Negative" = Normal match (predictedShouldMatch)
 */
export function generateConfusionMatrix(records: TransactionPrediction[]): ConfusionMatrix {
  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (const record of records) {
    const actualIsException = !record.actualShouldMatch;
    const predictedIsException = !record.predictedShouldMatch;

    if (actualIsException && predictedIsException) tp++;
    else if (!actualIsException && predictedIsException) fp++;
    else if (!actualIsException && !predictedIsException) tn++;
    else if (actualIsException && !predictedIsException) fn++;
  }

  return { truePositives: tp, falsePositives: fp, trueNegatives: tn, falseNegatives: fn };
}

/**
 * Calculates Precision: Of all detected exceptions, how many were actually exceptions?
 */
export function calculatePrecision(tp: number, fp: number): number {
  if (tp + fp === 0) return 0;
  return tp / (tp + fp);
}

/**
 * Calculates Recall: Of all actual exceptions, how many did the system detect?
 */
export function calculateRecall(tp: number, fn: number): number {
  if (tp + fn === 0) return 0;
  return tp / (tp + fn);
}

/**
 * Calculates the F1 Score: Harmonic mean of Precision and Recall.
 */
export function calculateF1(precision: number, recall: number): number {
  if (precision + recall === 0) return 0;
  return 2 * (precision * recall) / (precision + recall);
}

/**
 * Calculates Exception Classification Accuracy:
 * Of the correctly detected exceptions (True Positives), how many were given the EXACT right exception type?
 */
export function calculateExceptionClassificationAccuracy(records: TransactionPrediction[]): number {
  const truePositives = records.filter(r => !r.actualShouldMatch && !r.predictedShouldMatch);
  
  if (truePositives.length === 0) return 0;

  const correctlyClassified = truePositives.filter(
    r => r.actualExceptionType === r.predictedExceptionType
  );

  return correctlyClassified.length / truePositives.length;
}

/**
 * Generates metrics for a specific exception type (One-vs-All approach).
 */
export function calculateTypeSpecificMetrics(
  records: TransactionPrediction[], 
  type: ExceptionType
): { precision: number; recall: number; f1: number } {
  let tp = 0, fp = 0, fn = 0;

  for (const r of records) {
    const actualIsType = r.actualExceptionType === type;
    const predictedIsType = r.predictedExceptionType === type;

    if (actualIsType && predictedIsType) tp++;
    else if (!actualIsType && predictedIsType) fp++;
    else if (actualIsType && !predictedIsType) fn++;
  }

  const precision = calculatePrecision(tp, fp);
  const recall = calculateRecall(tp, fn);
  const f1 = calculateF1(precision, recall);

  return { precision, recall, f1 };
}

/**
 * Complete evaluation suite runner.
 */
export function evaluateSystem(records: TransactionPrediction[]) {
  const matrix = generateConfusionMatrix(records);
  const precision = calculatePrecision(matrix.truePositives, matrix.falsePositives);
  const recall = calculateRecall(matrix.truePositives, matrix.falseNegatives);
  const f1 = calculateF1(precision, recall);
  const classificationAccuracy = calculateExceptionClassificationAccuracy(records);

  const exceptionTypes: ExceptionType[] = [
    "amount_mismatch", "missing_settlement", "missing_payment", 
    "duplicate", "timing_difference", "refund"
  ];

  const typeMetrics: Record<string, any> = {};
  for (const type of exceptionTypes) {
    typeMetrics[type] = calculateTypeSpecificMetrics(records, type);
  }

  return {
    overall: {
      confusionMatrix: matrix,
      precision,
      recall,
      f1Score: f1,
      classificationAccuracy
    },
    byExceptionType: typeMetrics
  };
}

// ==========================================
// EXAMPLE USAGE & UNIT TESTS
// ==========================================

export function runTests() {
  console.log("Running Evaluation Engine Tests...");

  const mockData: TransactionPrediction[] = [
    // True Negative (Normal match correctly identified)
    { transactionId: "T1", actualShouldMatch: true, actualExceptionType: "none", predictedShouldMatch: true, predictedExceptionType: "none" },
    // True Positive (Exception correctly identified and correctly classified)
    { transactionId: "T2", actualShouldMatch: false, actualExceptionType: "amount_mismatch", predictedShouldMatch: false, predictedExceptionType: "amount_mismatch" },
    // True Positive (Exception correctly identified, but MISCLASSIFIED)
    { transactionId: "T3", actualShouldMatch: false, actualExceptionType: "timing_difference", predictedShouldMatch: false, predictedExceptionType: "missing_settlement" },
    // False Positive (Normal transaction wrongly flagged as exception)
    { transactionId: "T4", actualShouldMatch: true, actualExceptionType: "none", predictedShouldMatch: false, predictedExceptionType: "duplicate" },
    // False Negative (Exception missed by the system)
    { transactionId: "T5", actualShouldMatch: false, actualExceptionType: "missing_payment", predictedShouldMatch: true, predictedExceptionType: "none" },
  ];

  const matrix = generateConfusionMatrix(mockData);
  
  // Test Confusion Matrix
  console.assert(matrix.trueNegatives === 1, "TN should be 1");
  console.assert(matrix.truePositives === 2, "TP should be 2"); // T2, T3
  console.assert(matrix.falsePositives === 1, "FP should be 1"); // T4
  console.assert(matrix.falseNegatives === 1, "FN should be 1"); // T5

  // Test Precision, Recall, F1
  const precision = calculatePrecision(matrix.truePositives, matrix.falsePositives); // 2 / (2 + 1) = 0.666...
  console.assert(Math.abs(precision - 0.666) < 0.01, "Precision should be ~0.666");

  const recall = calculateRecall(matrix.truePositives, matrix.falseNegatives); // 2 / (2 + 1) = 0.666...
  console.assert(Math.abs(recall - 0.666) < 0.01, "Recall should be ~0.666");

  const f1 = calculateF1(precision, recall);
  console.assert(Math.abs(f1 - 0.666) < 0.01, "F1 should be ~0.666");

  // Test Classification Accuracy
  // Out of 2 TPs (T2, T3), only T2 was correctly classified.
  const classAcc = calculateExceptionClassificationAccuracy(mockData);
  console.assert(classAcc === 0.5, "Classification accuracy should be 0.5");

  console.log("All tests passed successfully!");
  
  // Print Example Dashboard
  console.log("\nExample Evaluation Dashboard:");
  console.log(JSON.stringify(evaluateSystem(mockData), null, 2));
}

// Uncomment to run tests when executing this file directly
// runTests();
