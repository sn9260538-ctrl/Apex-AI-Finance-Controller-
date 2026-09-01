const fs = require('fs');

let content = fs.readFileSync('src/components/ComplianceTab.tsx', 'utf8');

const additionalChecklist = `
          <li className="flex items-center justify-between p-4 bg-neu-base shadow-neu-extruded-sm rounded-2xl">
            <span className="text-sm font-bold text-neu-primary">Bank Credit Timing Overdue</span>
            <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#E74C3C]">
              {settlementTimingSummary.bankCreditTimingReviewCount || 0} records
            </span>
          </li>
          <li className="flex items-center justify-between p-4 bg-neu-base shadow-neu-extruded-sm rounded-2xl">
            <span className="text-sm font-bold text-neu-primary">Duplicate Records</span>
            <span className="px-3 py-1 bg-neu-base shadow-neu-inset rounded-full text-xs font-bold text-[#E74C3C]">
              {latestResult.exceptions.filter(e => e.type === 'Duplicate').length} records
            </span>
          </li>`;

content = content.replace(
  '<li className="flex items-center justify-between p-4 bg-neu-base shadow-neu-extruded-sm rounded-2xl">\n            <span className="text-sm font-bold text-neu-primary">Missing Settlements</span>',
  additionalChecklist + '\n          <li className="flex items-center justify-between p-4 bg-neu-base shadow-neu-extruded-sm rounded-2xl">\n            <span className="text-sm font-bold text-neu-primary">Missing Settlements</span>'
);

fs.writeFileSync('src/components/ComplianceTab.tsx', content);
console.log('Updated ComplianceTab checklist');
