import React, { useState } from 'react';
import { ReconciliationResult } from '../types';
import { generateControllerInsights, ControllerInsightAnswer } from '../lib/controllerInsights';
import { HelpCircle, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

interface ControllerInsightsCardProps {
  result: ReconciliationResult;
}

export default function ControllerInsightsCard({ result }: ControllerInsightsCardProps) {
  const insights = generateControllerInsights(result);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(insights[0]?.id || 'cash-lower-than-expected');

  const activeInsight = insights.find(i => i.id === selectedQuestionId) || insights[0];

  return (
    <div className="p-8 bg-neu-base rounded-[32px] shadow-neu-extruded space-y-6 animate-fade-in border border-neu-muted/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-neu-muted/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-neu-base shadow-neu-inset text-neu-accent rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-neu-accent" />
              Deterministic Finance Engine
            </span>
            <span className="text-xs text-neu-muted font-medium">Controller Insights — local rule-based analysis</span>
          </div>
          <h3 className="text-xl font-display font-bold text-neu-primary">Controller Q&A & Operational Insights</h3>
          <p className="text-xs text-neu-muted mt-1">
            Instant mathematical answers to core CFO queries derived deterministically from reconciliation state.
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-neu-base shadow-neu-inset rounded-xl text-[11px] font-bold text-neu-muted flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neu-accent"></div>
          Local Rule-Based Analysis (No External LLM)
        </div>
      </div>

      {/* Question Selector Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((item) => {
          const isSelected = item.id === selectedQuestionId;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedQuestionId(item.id)}
              className={`p-4 rounded-2xl text-left transition-all flex flex-col justify-between ${
                isSelected 
                  ? 'bg-neu-base shadow-neu-inset border border-neu-accent/40 ring-1 ring-neu-accent/30' 
                  : 'bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-xs font-bold leading-snug ${isSelected ? 'text-neu-accent' : 'text-neu-primary'}`}>
                  {item.question}
                </p>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected ? 'bg-neu-accent text-white' : 'bg-neu-base shadow-neu-inset text-neu-muted'
                }`}>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Insight Details Card */}
      {activeInsight && (
        <div className="p-6 bg-neu-base rounded-2xl shadow-neu-inset space-y-6 animate-fade-in border border-neu-muted/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-neu-muted uppercase tracking-wider mb-1.5">
              <HelpCircle className="w-4 h-4 text-neu-accent" />
              <span>Direct Controller Finding</span>
            </div>
            <h4 className="text-lg font-bold text-neu-primary leading-snug">
              {activeInsight.shortSummary}
            </h4>
          </div>

          {/* Metric Badges */}
          {activeInsight.metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {activeInsight.metrics.map((m, idx) => (
                <div key={idx} className="p-3.5 bg-neu-base rounded-xl shadow-neu-extruded flex flex-col">
                  <span className="text-[10px] font-bold text-neu-muted uppercase">{m.label}</span>
                  <span className={`text-base font-display font-extrabold mt-0.5 ${
                    m.warning ? 'text-[#E74C3C]' : m.highlight ? 'text-neu-primary' : 'text-neu-primary'
                  }`}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Key Findings List */}
          <div className="space-y-2 pt-2 border-t border-neu-muted/15">
            <p className="text-xs font-bold text-neu-primary uppercase tracking-wider">Detailed Findings</p>
            <ul className="space-y-2">
              {activeInsight.details.map((d, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-neu-muted leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-neu-accent shrink-0 mt-1.5"></div>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Controller Recommendations */}
          <div className="p-4 bg-neu-base rounded-xl shadow-neu-extruded space-y-2">
            <p className="text-xs font-bold text-neu-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0F2F28]" />
              Recommended Action Plan
            </p>
            <ul className="space-y-1.5">
              {activeInsight.recommendations.map((r, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-neu-muted">
                  <span className="text-neu-accent font-bold">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
