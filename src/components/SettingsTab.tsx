import React, { useState, useEffect } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { Save, Trash2, History } from 'lucide-react';

export default function SettingsTab() {
  const { rules, companyProfile, updateRules, updateCompanyProfile, clearRunHistory, runHistory } = useFinanceData();

  const [settings, setSettings] = useState({
    companyName: companyProfile.companyName,
    gstin: companyProfile.gstin,
    pan: companyProfile.pan,
    reconTolerance: rules.tolerance,
    reconTiming: rules.timingThreshold,
    reconMateriality: rules.materialityThreshold,
    reconGstRate: rules.gstRate,
    reconTdsRate: rules.tdsRate
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setSettings({
      companyName: companyProfile.companyName,
      gstin: companyProfile.gstin,
      pan: companyProfile.pan,
      reconTolerance: rules.tolerance,
      reconTiming: rules.timingThreshold,
      reconMateriality: rules.materialityThreshold,
      reconGstRate: rules.gstRate,
      reconTdsRate: rules.tdsRate
    });
  }, [rules, companyProfile]);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateCompanyProfile({
      companyName: settings.companyName,
      gstin: settings.gstin,
      pan: settings.pan
    });
    
    updateRules({
      tolerance: Number(settings.reconTolerance) || 0,
      timingThreshold: Number(settings.reconTiming) || 0,
      materialityThreshold: Number(settings.reconMateriality) || 0,
      gstRate: Number(settings.reconGstRate) || 0,
      tdsRate: Number(settings.reconTdsRate) || 0
    });
    
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear the local reconciliation run history? This action cannot be undone.")) {
      clearRunHistory();
    }
  };

  return (
    <div className="bg-neu-base p-6 sm:p-10 rounded-[32px] shadow-neu-extruded animate-fade-in pb-20 space-y-10">
      <div className="flex justify-between items-center border-b border-neu-muted/20 pb-6">
        <div>
          <h3 className="font-display text-2xl font-extrabold text-neu-primary tracking-tight">System Settings</h3>
          <p className="text-xs text-neu-muted mt-1">Configure company profiles, reconciliation rules, and audit parameters.</p>
        </div>
        {savedSuccess && (
          <span className="px-4 py-2 bg-[#9EEB75]/20 text-[#2E7D32] border border-[#9EEB75] rounded-full text-xs font-bold animate-fade-in">
            Settings saved. Rerun required to apply to metrics.
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Profile & Reconciliation Rules */}
        <div className="space-y-8">
          <div>
            <h4 className="font-bold text-neu-primary text-sm uppercase tracking-widest mb-6">Company Profile</h4>
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neu-muted mb-2 ml-2">Company Name</label>
                <input 
                  type="text" 
                  value={settings.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full bg-neu-base shadow-neu-inset rounded-2xl px-6 py-3.5 text-sm font-bold text-neu-primary outline-none focus:ring-2 focus:ring-neu-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neu-muted mb-2 ml-2">GSTIN</label>
                <input 
                  type="text" 
                  value={settings.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value)}
                  className="w-full bg-neu-base shadow-neu-inset rounded-2xl px-6 py-3.5 text-sm font-mono font-bold text-neu-primary outline-none focus:ring-2 focus:ring-neu-accent transition-all uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neu-muted mb-2 ml-2">PAN</label>
                <input 
                  type="text" 
                  value={settings.pan}
                  onChange={(e) => handleChange('pan', e.target.value)}
                  className="w-full bg-neu-base shadow-neu-inset rounded-2xl px-6 py-3.5 text-sm font-mono font-bold text-neu-primary outline-none focus:ring-2 focus:ring-neu-accent transition-all uppercase"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-neu-primary text-sm uppercase tracking-widest mb-6">Reconciliation Rules</h4>
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neu-muted mb-2 ml-2">Amount Match Tolerance (₹)</label>
                <input 
                  type="number" 
                  value={settings.reconTolerance}
                  onChange={(e) => handleChange('reconTolerance', e.target.value)}
                  className="w-full bg-neu-base shadow-neu-inset rounded-2xl px-6 py-3.5 text-sm font-bold text-neu-primary outline-none focus:ring-2 focus:ring-neu-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neu-muted mb-2 ml-2">Timing Review Threshold (Days)</label>
                <input 
                  type="number" 
                  value={settings.reconTiming}
                  onChange={(e) => handleChange('reconTiming', e.target.value)}
                  className="w-full bg-neu-base shadow-neu-inset rounded-2xl px-6 py-3.5 text-sm font-bold text-neu-primary outline-none focus:ring-2 focus:ring-neu-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neu-muted mb-2 ml-2">Materiality Escalation Threshold (₹)</label>
                <input 
                  type="number" 
                  value={settings.reconMateriality}
                  onChange={(e) => handleChange('reconMateriality', e.target.value)}
                  className="w-full bg-neu-base shadow-neu-inset rounded-2xl px-6 py-3.5 text-sm font-bold text-neu-primary outline-none focus:ring-2 focus:ring-neu-accent transition-all"
                />
              </div>
            </div>
          </div>
          
          <button onClick={handleSave} className="px-8 py-4 rounded-2xl bg-neu-accent text-white font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-3 shadow-neu-extruded hover:-translate-y-0.5 active:shadow-neu-inset transition-all w-full sm:w-auto">
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>

        {/* Compliance Settings & History Management */}
        <div className="space-y-8">
          <div>
            <h4 className="font-bold text-neu-primary text-sm uppercase tracking-widest mb-6">Compliance & Statutory Screening</h4>
            <div className="bg-neu-base p-6 rounded-[28px] shadow-neu-inset space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-neu-muted/10">
                <span className="font-bold text-neu-muted text-xs uppercase">GSTR-9 Annual Return</span>
                <span className="font-display font-extrabold text-sm text-neu-primary">₹2,00,00,000</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-neu-muted/10">
                <span className="font-bold text-neu-muted text-xs uppercase">GSTR-9C Reconciliation</span>
                <span className="font-display font-extrabold text-sm text-neu-primary">₹5,00,00,000</span>
              </div>
              
              <div className="pt-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neu-muted mb-2 ml-2">GST Rate on Gateway Fees (%)</label>
                <input 
                  type="number" 
                  value={settings.reconGstRate}
                  onChange={(e) => handleChange('reconGstRate', e.target.value)}
                  className="w-full bg-neu-base shadow-neu-inset rounded-2xl px-6 py-3 text-sm font-bold text-neu-primary outline-none focus:ring-2 focus:ring-neu-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neu-muted mb-2 ml-2">Professional-fee TDS Rate (%)</label>
                <input 
                  type="number" 
                  value={settings.reconTdsRate}
                  onChange={(e) => handleChange('reconTdsRate', e.target.value)}
                  className="w-full bg-neu-base shadow-neu-inset rounded-2xl px-6 py-3 text-sm font-bold text-neu-primary outline-none focus:ring-2 focus:ring-neu-accent transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-neu-primary text-sm uppercase tracking-widest mb-6">Run History Management</h4>
            <div className="p-6 rounded-[28px] bg-neu-base shadow-neu-extruded space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neu-base shadow-neu-inset flex items-center justify-center text-neu-muted">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-neu-primary block">Saved Batches</span>
                    <span className="text-xs text-neu-muted">{runHistory.length} of 10 history slots in local storage</span>
                  </div>
                </div>
                <button
                  onClick={handleClearHistory}
                  disabled={runHistory.length === 0}
                  className="px-4 py-2 bg-neu-base shadow-neu-extruded-sm hover:shadow-neu-inset rounded-xl text-xs font-bold text-[#E74C3C] flex items-center gap-2 transition-all disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear History
                </button>
              </div>
              <p className="text-[11px] text-neu-muted leading-relaxed">
                Reconciliation runs are stored locally on your device for trending analytics. Clearing removes historical snapshots without affecting the active dataset.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
