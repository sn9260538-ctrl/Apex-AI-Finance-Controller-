const fs = require('fs');
let content = fs.readFileSync('src/components/TransactionsTab.tsx', 'utf8');

const searchTarget = `  if (searchQuery) {
    unified = unified.filter(u => 
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.source === 'Invoice' && (u as any).customerName?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }`;

const searchReplacement = `  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    unified = unified.filter(u => {
      // Common fields
      if (u.id.toLowerCase().includes(query)) return true;
      if (u.date && String(u.date).toLowerCase().includes(query)) return true;
      if (u.amount && String(u.amount).toLowerCase().includes(query)) return true;
      
      // Source specific fields
      if (u.source === 'Invoice') {
        const inv = u as any;
        if (inv.customerName?.toLowerCase().includes(query)) return true;
        if (inv.category?.toLowerCase().includes(query)) return true;
      }
      if (u.source === 'Payment') {
        const pay = u as any;
        if (pay.invoiceId?.toLowerCase().includes(query)) return true;
        if (pay.paymentMethod?.toLowerCase().includes(query)) return true;
        if (pay.status?.toLowerCase().includes(query)) return true;
      }
      if (u.source === 'Settlement') {
        const set = u as any;
        if (set.paymentId?.toLowerCase().includes(query)) return true;
        if (set.status?.toLowerCase().includes(query)) return true;
      }
      if (u.source === 'Bank Credit') {
        const bc = u as any;
        if (bc.settlementId?.toLowerCase().includes(query)) return true;
        if (bc.narration?.toLowerCase().includes(query)) return true;
      }
      return false;
    });
  }`;

if(content.includes(searchTarget)) {
  content = content.replace(searchTarget, searchReplacement);
  fs.writeFileSync('src/components/TransactionsTab.tsx', content);
  console.log('Updated search logic');
} else {
  console.log('Target not found');
}
