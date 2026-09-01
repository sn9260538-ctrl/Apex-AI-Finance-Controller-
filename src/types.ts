export interface Invoice {
  id: string;
  invoiceDate: string;
  customerName: string;
  amount: number;
  category: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  status: string;
}

export interface Settlement {
  id: string;
  paymentId: string;
  settlementDate: string;
  grossAmount: number;
  mdr: number;
  gstOnMdr: number;
  refundAmount: number;
  chargebackAmount: number;
  adjustmentAmount: number;
  netAmount: number;
  status: string;
}

export interface BankCredit {
  id: string;
  settlementId: string;
  creditDate: string;
  amount: number;
  narration: string;
}

export type ExceptionType =
  | 'Amount_Mismatch'
  | 'Missing_in_Payment'
  | 'Missing_in_Settlement'
  | 'Missing_in_Bank'
  | 'Duplicate'
  | 'Timing_Difference'
  | 'Bank_Credit_Timing_Difference'
  | 'Partial_Match'
  | 'Data_Quality_Issue'
  | 'Potential_GST_ITC_Variance'
  | 'Potential_TDS_Shortfall';

export type FinalStatus = 'Fully_Matched' | 'Partial_Match' | 'Unmatched';
export type FinalTransactionStatus = FinalStatus;
export type DeterministicMatchConfidence = 'High' | 'Medium' | 'Low';

export interface ExceptionItem {
  id: string;
  transactionId: string; // The primary Invoice ID
  type: ExceptionType;
  booksAmount: number;
  paymentAmount: number;
  settlementAmount: number;
  bankAmount: number;
  difference: number;
  paymentDate: string;
  settlementDate: string;
  daysDifference: number;
  ruleApplied: string;
  deterministicMatchConfidence: DeterministicMatchConfidence;
  bankCreditDate?: string;
  bankCreditTimingDays?: number;
  recommendedAction: 'auto_resolve' | 'manual_review' | 'escalate';
  details: string;
  internalNote?: string;
  sourceRecordIds: string[];
  evidenceAvailable: string[];
  evidenceMissing: string[];
  materialityThreshold: number;
  thresholdExceeded: boolean;
  actionReason: string;
}

export interface AuditMetadata {
  batchId: string;
  appVersion: string;
  rulesVersion: string;
  processedAt: string;
  processingMode: "Synthetic Demo Data" | "Local CSV Data";
  denominatorDefinition: string;
  inputFiles: {
    invoices?: string;
    payments?: string;
    settlements?: string;
    bankCredits?: string;
  };
  inputRowCounts: {
    invoices: number;
    payments: number;
    settlements: number;
    bankCredits: number;
  };
  amountToleranceInr: number;
  settlementTimingReviewThresholdDays: number;
  bankCreditTimingReviewThresholdDays: number;
  escalationMaterialityInr: number;
  matchingRulesApplied: string[];
  dataQualityWarnings: string[];
  datasetFingerprint: string;
  rulesFingerprint: string;
}

export interface AmountSummary {
  grossInvoiceValue: number;
  grossPaymentValue: number;
  totalMdr: number;
  totalGstOnMdr: number;
  totalRefunds: number;
  totalChargebacks: number;
  totalAdjustments: number;
  expectedSettlementValue: number;
  actualSettlementValue: number;
  bankCreditedValue: number;
  pendingSettlementValue: number;
  uncreditedBankValue: number;
  totalExceptionExposure: number;
}

export interface SettlementTimingSummary {
  sameDay: number;
  tPlus1: number;
  tPlus2: number;
  tPlus3OrMore: number;
  timingReviewCount: number;
  bankCreditTimingReviewCount?: number;
}

export interface PaymentMethodSummary {
  paymentMethod: string;
  transactionCount: number;
  fullyMatched: number;
  matchRate: number;
  exceptionCount: number;
  settlementValue: number;
}

export interface ReconciliationIntegrityCheck {
  id: string;
  label: string;
  status: "pass" | "warning" | "fail";
  detail: string;
}

export interface ReconciliationRunHistoryItem {
  batchId: string;
  processedAt: string;
  processingMode: "Synthetic Demo Data" | "Local CSV Data";
  inputRowCounts: {
    invoices: number;
    payments: number;
    settlements: number;
    bankCredits: number;
  };
  batchSize: number;
  fullyMatched: number;
  partialMatches: number;
  unmatched: number;
  transactionsWithExceptions: number;
  totalExceptionItems: number;
  matchRate: number;
  exceptionRate: number;
  totalExceptionExposure: number;
  confirmedBankCash: number;
  pendingSettlementValue: number;
  datasetFingerprint: string;
  rulesFingerprint: string;
}

export interface ControllerActionItem {
  id: string;
  transactionId: string;
  type: ExceptionType;
  amountExposed: number;
  recommendedAction: 'auto_resolve' | 'manual_review' | 'escalate';
  oneLineReason: string;
  details: string;
  sourceRecordIds: string[];
}

export interface ReconciliationResult {
  auditMetadata: AuditMetadata;
  batchId: string;
  processingMode: "Synthetic Demo Data" | "Local CSV Data";
  processedAt: string;
  inputRowCounts: {
    invoices: number;
    payments: number;
    settlements: number;
    bankCredits: number;
  };
  denominatorDefinition: string;
  batchSize: number;
  fullyMatched: number;
  partialMatches: number;
  unmatched: number;
  transactionsWithExceptions: number;
  totalExceptionItems: number;
  matchRate: number;
  exceptionRate: number;
  autoResolutionRate: number;
  statusesByTransactionId: Record<string, "Fully_Matched" | "Partial_Match" | "Unmatched">;
  exceptions: ExceptionItem[];
  amountSummary: AmountSummary;
  settlementTimingSummary: SettlementTimingSummary;
  paymentMethodSummary: PaymentMethodSummary[];
  dataQualityWarnings: string[];
  matchingRulesApplied: string[];
  complianceScreening?: ComplianceScreening;
  integrityChecks: ReconciliationIntegrityCheck[];
  overallIntegrityStatus: "pass" | "warning" | "fail";
  materialityThreshold: number;
  datasetFingerprint: string;
  rulesFingerprint: string;
  controllerActionQueue: ControllerActionItem[];
}

export interface ComplianceScreening {
  potentialItcVariance: number;
  requiredTds: number;
  tdsRecorded: number;
  potentialTdsShortfall: number;
}

export interface ReconciliationRules {
  tolerance: number;
  timingThreshold: number;
  materialityThreshold: number;
  gstRate: number;
  tdsRate: number;
}
