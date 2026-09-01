const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'sample_data');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

let invoices = "Invoice_ID,Date,Amount,Description,Category\n";
let payments = "Payment_ID,Invoice_ID,Date,Amount\n";
let settlements = "Settlement_ID,Payment_ID,Date,Amount,MDR\n";
let bank = "Bank_Txn_ID,Settlement_ID,Date,Amount\n";

let totalAmount = 0;
for(let i=1; i<=100; i++) {
  const amt = (Math.random() * 10000 + 500).toFixed(2);
  const isProfessional = Math.random() > 0.8;
  const desc = isProfessional ? "Professional Fees" : "Product Sale";
  const cat = isProfessional ? "Services" : "Sales";
  totalAmount += parseFloat(amt);
  
  invoices += `INV_${i},2026-08-01,${amt},${desc},${cat}\n`;
  payments += `PAY_${i},INV_${i},2026-08-01,${amt}\n`;
  
  let mdr = (amt * 0.02).toFixed(2);
  let setAmt = (amt - mdr).toFixed(2);
  
  if (![10, 20, 30, 40, 50].includes(i)) {
    if (i === 60) setAmt = (parseFloat(setAmt) - 100).toFixed(2);
    let setDate = (i === 70) ? "2026-08-04" : "2026-08-02";
    settlements += `SET_${i},PAY_${i},${setDate},${setAmt},${mdr}\n`;
    
    if (![15, 25].includes(i)) {
      bank += `BNK_${i},SET_${i},2026-08-03,${setAmt}\n`;
      if ([80, 90].includes(i)) {
        bank += `BNK_${i}_DUP,SET_${i},2026-08-03,${setAmt}\n`;
      }
    }
  }
}

fs.writeFileSync(path.join(dir, 'invoices.csv'), invoices);
fs.writeFileSync(path.join(dir, 'payments.csv'), payments);
fs.writeFileSync(path.join(dir, 'settlements.csv'), settlements);
fs.writeFileSync(path.join(dir, 'bank_statement.csv'), bank);
console.log("Created sample_data CSVs");
