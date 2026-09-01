const fs = require('fs');
let content = fs.readFileSync('src/components/TransactionsTab.tsx', 'utf8');

const target = `return { label: 'Reconciled', color: 'text-[#9EEB75]' };`;
const replacement = `return { label: 'Reconciled', color: 'text-[#579CEB]' };`;

if(content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/TransactionsTab.tsx', content);
    console.log('Successfully changed Reconciled to blue');
} else {
    console.log('Target content not found.');
}
