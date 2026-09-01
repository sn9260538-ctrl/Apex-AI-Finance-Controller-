const fs = require('fs');

let content = fs.readFileSync('src/components/ComplianceTab.tsx', 'utf8');

const referenceText = `
      <div className="mt-8 p-6 bg-neu-base rounded-[32px] shadow-neu-extruded">
        <h4 className="text-sm font-bold text-neu-primary mb-4">Reference Notes</h4>
        <ul className="list-disc pl-5 text-xs text-neu-muted space-y-2">
          <li>Income-tax Act, 2025 applies from 1 April 2026.</li>
          <li>TDS screening reference: sections 392 and 393.</li>
          <li>TCS screening reference: section 394.</li>
          <li>RBI (Regulation of Payment Aggregators) Directions, 2025 — operational screening only.</li>
          <li>This prototype does not verify payment aggregator authorisation, merchant KYC, escrow ownership, or legal compliance.</li>
        </ul>
      </div>
`;

// Insert before the last disclaimer
if (content.includes('Prototype finance-operations screening only.')) {
  content = content.replace(
    '<div className="mt-8 p-4 rounded-xl bg-neu-base shadow-neu-inset text-xs text-neu-muted text-center italic">',
    referenceText + '\n      <div className="mt-8 p-4 rounded-xl bg-neu-base shadow-neu-inset text-xs text-neu-muted text-center italic">'
  );
  fs.writeFileSync('src/components/ComplianceTab.tsx', content);
  console.log('Updated ComplianceTab');
}
