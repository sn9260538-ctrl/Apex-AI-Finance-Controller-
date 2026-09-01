const fs = require('fs');
const disclaimerText = `
      <div className="mt-8 p-4 rounded-xl bg-neu-base shadow-neu-inset text-xs text-neu-muted text-center italic">
        Prototype finance-operations screening only. This application does not replace official government portals, bank records, payment-gateway settlement terms, qualified accountants, auditors, tax advisers, or legal advisers. Verify all thresholds, rates, eligibility conditions, filings, and settlement obligations before acting.
      </div>
`;

function addDisclaimer(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('Prototype finance-operations screening only.')) {
    // Find the last closing div before the end
    const idx = content.lastIndexOf('</div>');
    if (idx !== -1) {
      content = content.substring(0, idx) + disclaimerText + content.substring(idx);
      fs.writeFileSync(file, content);
      console.log('Added disclaimer to ' + file);
    }
  }
}

addDisclaimer('src/components/ReconciliationTab.tsx');
addDisclaimer('src/components/ComplianceTab.tsx');

