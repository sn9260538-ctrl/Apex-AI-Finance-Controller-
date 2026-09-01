const fs = require('fs');

let content = fs.readFileSync('src/components/CashForecastTab.tsx', 'utf8');

const targetStr = '<p className="text-sm text-neu-muted mt-1">Projected liquidity based on latest reconciliation.</p>';
const repStr = '<p className="text-sm text-neu-muted mt-1">Projected liquidity based on latest reconciliation. Forecast includes expected pending settlements of ₹{amountSummary.pendingSettlementValue.toLocaleString(\'en-IN\', { maximumFractionDigits: 2 })}.</p>';

content = content.replace(targetStr, repStr);
fs.writeFileSync('src/components/CashForecastTab.tsx', content);
console.log('Updated CashForecastTab');
