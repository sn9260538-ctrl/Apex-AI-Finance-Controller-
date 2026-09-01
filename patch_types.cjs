const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(/export type ExceptionType =[\s\S]*?;/, `export type ExceptionType =
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
  | 'Potential_TDS_Shortfall';`);

content = content.replace(/export type FinalStatus = 'Fully_Matched' \| 'Partial_Match' \| 'Unmatched';/, `export type FinalStatus = 'Fully_Matched' | 'Partial_Match' | 'Unmatched';
export type FinalTransactionStatus = FinalStatus;
export type DeterministicMatchConfidence = 'High' | 'Medium' | 'Low';`);

content = content.replace(/deterministicMatchConfidence: string;/, `deterministicMatchConfidence: DeterministicMatchConfidence;
  bankCreditDate?: string;
  bankCreditTimingDays?: number;`);

content = content.replace(/export interface AmountSummary/, `export interface AuditMetadata {
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
}

export interface AmountSummary`);

content = content.replace(/export interface ReconciliationResult \{/, `export interface ReconciliationResult {
  auditMetadata: AuditMetadata;`);

content = content.replace(/export interface SettlementTimingSummary \{[\s\S]*?\}/, `export interface SettlementTimingSummary {
  sameDay: number;
  tPlus1: number;
  tPlus2: number;
  tPlus3OrMore: number;
  timingReviewCount: number;
  bankCreditTimingReviewCount?: number;
}`);

fs.writeFileSync('src/types.ts', content);
console.log('Types updated');
