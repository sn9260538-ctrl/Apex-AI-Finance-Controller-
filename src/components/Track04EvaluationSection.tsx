import React, { useRef, useState } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { evaluateReconciliationResult } from '../lib/evaluationEngine';
import FinanceOpsLoopProof from './FinanceOpsLoopProof';
import HonestExceptionList from './HonestExceptionList';
import ControllerInsightsCard from './ControllerInsightsCard';
import { 
  Trophy, CheckCircle2, AlertTriangle, ShieldCheck, Download, FileText, 
  ExternalLink, Layers, ArrowRight, Activity, HelpCircle, FileSpreadsheet
} from 'lucide-react';
import domtoimage from 'dom-to-image-more';
import jsPDF from 'jspdf';

interface Track04EvaluationSectionProps {
  onSelectTransaction?: (txId: string) => void;
}

export default function Track04EvaluationSection({ onSelectTransaction }: Track04EvaluationSectionProps) {
  const { latestResult, isReconciliationStale, dataMode, lastRunTimestamp } = useFinanceData();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  if (!latestResult) {
    return (
      <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-extruded text-center space-y-3">
        <Trophy className="w-10 h-10 text-neu-muted mx-auto" />
        <h3 className="text-xl font-bold text-neu-primary">Razorpay AI Buildathon — Track 04 Evaluation</h3>
        <p className="text-xs text-neu-muted max-w-md mx-auto">
          No reconciliation run completed yet. Run reconciliation with the 100-record synthetic batch to generate full Track 04 evaluation metrics.
        </p>
      </div>
    );
  }

  const evaluation = evaluateReconciliationResult(latestResult, isReconciliationStale);
  if (!evaluation) return null;

  const { accuracyMetrics, honestExceptions } = evaluation;

  // Export JSON Report
  const handleExportEvaluationJson = () => {
    const jsonReport = {
      project: "Apex — AI Finance Controller",
      track: "Razorpay AI Buildathon Track 04",
      tagline: "Run the books and the cash position.",
      evaluationSummary: evaluation,
      reconciliationRules: latestResult.rulesFingerprint,
      integrityAudit: latestResult.integrityChecks,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apex-track-04-evaluation-report-${latestResult.batchId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF Report
  const handleExportEvaluationPdf = async () => {
    if (!sectionRef.current) return;
    setIsExportingPdf(true);
    try {
      const scale = 2;
      const dataUrl = await domtoimage.toPng(sectionRef.current, {
        quality: 1,
        height: sectionRef.current.offsetHeight * scale,
        width: sectionRef.current.offsetWidth * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${sectionRef.current.offsetWidth}px`,
          height: `${sectionRef.current.offsetHeight}px`
        }
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [sectionRef.current.offsetWidth, sectionRef.current.offsetHeight]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, sectionRef.current.offsetWidth, sectionRef.current.offsetHeight);
      pdf.save(`apex-track-04-evaluation-report-${latestResult.batchId}.pdf`);
    } catch (err) {
      console.error('Track 04 Evaluation PDF export failed', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div ref={sectionRef} className="space-y-8 animate-fade-in">
      {/* 1. Track 04 Buildathon Banner */}
      <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-extruded space-y-6 border border-neu-muted/20 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-neu-muted/15">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-3.5 py-1 bg-neu-accent text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-neu-extruded-sm">
                <Trophy className="w-3.5 h-3.5 text-white" />
                Razorpay AI Buildathon — Track 04
              </span>
              <span className="px-3 py-1 bg-neu-base shadow-neu-inset text-neu-primary text-xs font-bold rounded-full">
                “Run the books and the cash position.”
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                evaluation.isStale 
                  ? 'bg-[#F39C12]/20 text-[#D68910] border border-[#F39C12]/30' 
                  : 'bg-[#9EEB75]/20 text-[#0F2F28]'
              }`}>
                {evaluation.dataFreshness}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-neu-primary tracking-tight">
              AI Finance Controller Evaluation
            </h2>
            <p className="text-xs text-neu-muted mt-1.5 max-w-3xl">
              Closed finance-operations loop across a 50+ record synthetic batch, reporting complete match rate, measured accuracy against ground truth, and honest unresolved exceptions.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportEvaluationJson}
              className="px-4 py-2.5 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-sm active:shadow-neu-inset rounded-2xl text-xs font-bold text-neu-primary flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-neu-accent" />
              Download Track 04 JSON Report
            </button>

            <button
              onClick={handleExportEvaluationPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 bg-neu-accent text-white shadow-neu-extruded-sm hover:opacity-95 active:shadow-neu-inset rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-white" />
              {isExportingPdf ? 'Generating PDF...' : 'Download Track 04 PDF Report'}
            </button>
          </div>
        </div>

        {/* Evaluation Metadata Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-neu-base rounded-2xl shadow-neu-inset">
            <p className="text-[10px] font-bold text-neu-muted uppercase">Finance-Ops Loop</p>
            <p className="font-bold text-neu-primary mt-0.5">{evaluation.financeOpsLoop}</p>
          </div>
          <div className="p-3.5 bg-neu-base rounded-2xl shadow-neu-inset">
            <p className="text-[10px] font-bold text-neu-muted uppercase">Data Mode</p>
            <p className="font-bold text-neu-primary mt-0.5">{evaluation.dataMode}</p>
          </div>
          <div className="p-3.5 bg-neu-base rounded-2xl shadow-neu-inset">
            <p className="text-[10px] font-bold text-neu-muted uppercase">Processed Batch ID</p>
            <p className="font-mono font-bold text-neu-primary mt-0.5">{evaluation.batchId}</p>
          </div>
          <div className="p-3.5 bg-neu-base rounded-2xl shadow-neu-inset">
            <p className="text-[10px] font-bold text-neu-muted uppercase">Integrity Status</p>
            <p className={`font-bold mt-0.5 flex items-center gap-1 ${
              evaluation.integrityStatus === 'Passed' ? 'text-[#0F2F28]' : 'text-[#E74C3C]'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {evaluation.integrityStatus}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-neu-muted italic bg-neu-base/60 p-2.5 rounded-xl shadow-neu-inset text-center">
          Synthetic demonstration data — no real customer, bank, or Razorpay information.
        </p>
      </div>

      {/* 2. Core Buildathon Scorecard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Throughput */}
        <div className="p-6 bg-neu-base rounded-[28px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-neu-muted mb-2">
              <span className="uppercase">1. Batch Throughput</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                evaluation.throughputStatus === 'Pass' ? 'bg-[#9EEB75]/20 text-[#0F2F28]' : 'bg-[#E74C3C]/20 text-[#E74C3C]'
              }`}>
                {evaluation.throughputStatus}
              </span>
            </div>
            <p className="text-3xl font-display font-extrabold text-neu-primary">
              {evaluation.batchSize} <span className="text-sm font-medium text-neu-muted">records</span>
            </p>
            <p className="text-xs text-neu-muted mt-1">Required standard: ≥50 records</p>
          </div>
          <div className="mt-4 pt-3 border-t border-neu-muted/10 text-[11px] font-medium text-neu-muted">
            {evaluation.batchSize >= 50 ? '✓ Exceeds 50+ batch requirement' : '✕ Below 50 record batch threshold'}
          </div>
        </div>

        {/* Metric 2: Match Rate */}
        <div className="p-6 bg-neu-base rounded-[28px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-neu-muted mb-2">
              <span className="uppercase">2. Complete Batch Match Rate</span>
              <span className="px-2 py-0.5 rounded-full bg-neu-base shadow-neu-inset text-[10px] font-bold text-neu-primary">
                {evaluation.fullyMatchedCount}/{evaluation.batchSize}
              </span>
            </div>
            <p className="text-3xl font-display font-extrabold text-neu-primary">
              {evaluation.matchRate}%
            </p>
            <p className="text-xs text-neu-muted mt-1">
              Fully Matched ÷ Batch Size
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neu-muted/10 text-[11px] font-medium text-neu-muted leading-tight">
            Match rate is calculated across the complete primary transaction batch. It is not based on a selected sample.
          </div>
        </div>

        {/* Metric 3: Decision Accuracy (Measured against Ground Truth) */}
        <div className="p-6 bg-neu-base rounded-[28px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-neu-muted mb-2">
              <span className="uppercase">3. Decision Accuracy</span>
              <span className="px-2 py-0.5 rounded-full bg-[#9EEB75]/20 text-[#0F2F28] text-[10px] font-bold">
                Ground Truth
              </span>
            </div>
            {accuracyMetrics.isGroundTruthAvailable ? (
              <>
                <p className="text-3xl font-display font-extrabold text-[#0F2F28]">
                  {accuracyMetrics.finalStatusAccuracy}%
                </p>
                <p className="text-xs text-neu-muted mt-1">
                  {accuracyMetrics.correctFinalStatusCount} / {accuracyMetrics.totalGroundTruthCount} Status Decisions Correct
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-neu-muted">Unavailable</p>
                <p className="text-[11px] text-neu-muted mt-1">
                  Ground-truth decision accuracy unavailable for custom uploaded data.
                </p>
              </>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-neu-muted/10 text-[11px] font-medium text-neu-muted">
            {accuracyMetrics.isGroundTruthAvailable 
              ? `Classification Accuracy: ${accuracyMetrics.exceptionClassificationAccuracy}%` 
              : 'Match rate available.'}
          </div>
        </div>

        {/* Metric 4: Honest Exceptions Count */}
        <div className="p-6 bg-neu-base rounded-[28px] shadow-neu-extruded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-neu-muted mb-2">
              <span className="uppercase">4. Honest Exceptions</span>
              <span className="px-2 py-0.5 rounded-full bg-[#E74C3C]/20 text-[#E74C3C] text-[10px] font-bold">
                Mandatory
              </span>
            </div>
            <p className="text-3xl font-display font-extrabold text-[#E74C3C]">
              {evaluation.unresolvedTransactionsCount} <span className="text-sm font-medium text-neu-muted">unresolved</span>
            </p>
            <p className="text-xs text-neu-muted mt-1">
              ₹{evaluation.totalInrExceptionExposure.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Total Exposure
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neu-muted/10 text-[11px] font-medium text-neu-muted">
            Zero unresolved exceptions hidden or excluded
          </div>
        </div>
      </div>

      {/* 3. Status Accounting Validation Card */}
      <div className="p-6 bg-neu-base rounded-[28px] shadow-neu-inset flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neu-muted uppercase tracking-wider">Status Accounting Check</span>
            <span className="text-xs font-bold text-[#0F2F28] bg-[#9EEB75] px-2 py-0.5 rounded-full">
              {evaluation.statusAccountingReconciled ? 'Reconciled ✓' : 'Discrepancy ✕'}
            </span>
          </div>
          <p className="font-mono text-sm font-bold text-neu-primary mt-1">
            {evaluation.statusAccountingFormula}
          </p>
        </div>
        <p className="text-xs text-neu-muted max-w-sm sm:text-right">
          Validates that every single primary transaction in the batch is deterministically accounted for without duplicate inflation or unassigned transactions.
        </p>
      </div>

      {/* 4. Measured Accuracy & Confusion Breakdown (when ground truth is available) */}
      {accuracyMetrics.isGroundTruthAvailable && (
        <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-extruded space-y-6 border border-neu-muted/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-neu-muted/15">
            <div>
              <h3 className="text-lg font-display font-bold text-neu-primary">
                Ground Truth Accuracy & Confusion Summary
              </h3>
              <p className="text-xs text-neu-muted mt-0.5">
                Evaluation matrix comparing deterministic engine decisions against central ground-truth benchmarks.
              </p>
            </div>
            <span className="px-3 py-1 bg-neu-base shadow-neu-inset text-xs font-bold text-neu-primary rounded-full">
              100 Transactions Evaluated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-neu-base rounded-2xl shadow-neu-inset flex flex-col">
              <span className="text-[11px] font-bold text-neu-muted uppercase">Final Status Accuracy</span>
              <span className="text-2xl font-display font-extrabold text-[#0F2F28] mt-1">
                {accuracyMetrics.finalStatusAccuracy}%
              </span>
              <span className="text-[11px] text-neu-muted mt-1">
                {accuracyMetrics.correctFinalStatusCount} of {accuracyMetrics.totalGroundTruthCount} exact matches
              </span>
            </div>

            <div className="p-4 bg-neu-base rounded-2xl shadow-neu-inset flex flex-col">
              <span className="text-[11px] font-bold text-neu-muted uppercase">Exception Label Accuracy</span>
              <span className="text-2xl font-display font-extrabold text-[#0F2F28] mt-1">
                {accuracyMetrics.exceptionClassificationAccuracy}%
              </span>
              <span className="text-[11px] text-neu-muted mt-1">
                {accuracyMetrics.correctExpectedExceptionLabelsCount} of {accuracyMetrics.totalExpectedExceptionLabelsCount} labels matching
              </span>
            </div>

            <div className="p-4 bg-neu-base rounded-2xl shadow-neu-inset flex flex-col">
              <span className="text-[11px] font-bold text-neu-muted uppercase">Recommended Action Accuracy</span>
              <span className="text-2xl font-display font-extrabold text-[#0F2F28] mt-1">
                {accuracyMetrics.recommendedActionAccuracy}%
              </span>
              <span className="text-[11px] text-neu-muted mt-1">
                {accuracyMetrics.correctActionsCount} of {accuracyMetrics.totalActionRequiredCount} actions matching
              </span>
            </div>
          </div>

          {/* Confusion Ledger */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-neu-base rounded-xl shadow-neu-extruded text-center">
              <p className="text-[10px] font-bold text-neu-muted uppercase">Correct Fully Matched</p>
              <p className="text-lg font-bold text-[#0F2F28] mt-0.5">{accuracyMetrics.confusionSummary.correctlyFullyMatched}</p>
            </div>
            <div className="p-3 bg-neu-base rounded-xl shadow-neu-extruded text-center">
              <p className="text-[10px] font-bold text-neu-muted uppercase">Correct Partial Match</p>
              <p className="text-lg font-bold text-[#0F2F28] mt-0.5">{accuracyMetrics.confusionSummary.correctlyPartialMatched}</p>
            </div>
            <div className="p-3 bg-neu-base rounded-xl shadow-neu-extruded text-center">
              <p className="text-[10px] font-bold text-neu-muted uppercase">Correct Unmatched</p>
              <p className="text-lg font-bold text-[#0F2F28] mt-0.5">{accuracyMetrics.confusionSummary.correctlyUnmatched}</p>
            </div>
            <div className="p-3 bg-neu-base rounded-xl shadow-neu-extruded text-center">
              <p className="text-[10px] font-bold text-neu-muted uppercase">False Decisions / Missed</p>
              <p className="text-lg font-bold text-neu-primary mt-0.5">
                {accuracyMetrics.confusionSummary.falseFullyMatched + accuracyMetrics.confusionSummary.missedExceptions}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Finance-Ops Loop Proof Card */}
      <FinanceOpsLoopProof result={latestResult} />

      {/* 6. Settlement Q&A / Controller Insights */}
      <ControllerInsightsCard result={latestResult} />

      {/* 7. Mandatory Honest Exception List */}
      <HonestExceptionList
        exceptions={honestExceptions}
        autoResolvedCount={evaluation.autoResolvedExceptionItemsCount}
        unresolvedTxCount={evaluation.unresolvedTransactionsCount}
        unresolvedItemCount={evaluation.unresolvedExceptionItemsCount}
        totalInrExposure={evaluation.totalInrExceptionExposure}
        largestDifference={evaluation.largestUnresolvedDifference}
        materialExceptionsCount={evaluation.materialExceptionsCount}
        dataQualityBlockedCount={evaluation.dataQualityBlockedCount}
        onSelectTransaction={onSelectTransaction}
      />
    </div>
  );
}
