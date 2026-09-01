import { Invoice, Payment, Settlement, BankCredit } from '../types';

export const generateDemoData = () => {
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  const settlements: Settlement[] = [];
  const bankCredits: BankCredit[] = [];

  for (let i = 1; i <= 100; i++) {
    const isMissingPayment = i === 10;
    const isAmountMismatch = i === 20;
    const isMissingSettlement = i === 30;
    const isMissingBank = i === 40;
    const isDuplicate = i === 50;
    const isTimingReview = i === 60;
    const isDataQuality = i === 70; 

    const baseAmount = 1000 + i * 10;
    
    invoices.push({
      id: `INV-${i.toString().padStart(3, '0')}`,
      invoiceDate: '2026-08-01',
      customerName: `Customer ${i}`,
      amount: baseAmount,
      category: 'Sales'
    });

    if (isMissingPayment) continue;

    const paymentAmount = isAmountMismatch ? baseAmount - 5 : baseAmount;
    const paymentDate = isDataQuality ? 'invalid-date' : '2026-08-02';

    payments.push({
      id: `PAY-${i.toString().padStart(3, '0')}`,
      invoiceId: `INV-${i.toString().padStart(3, '0')}`,
      paymentDate: paymentDate,
      amount: paymentAmount,
      paymentMethod: 'UPI',
      status: 'SUCCESS'
    });

    if (isDuplicate) {
      payments.push({
        id: `PAY-${i.toString().padStart(3, '0')}-DUP`,
        invoiceId: `INV-${i.toString().padStart(3, '0')}`,
        paymentDate: paymentDate,
        amount: paymentAmount,
        paymentMethod: 'UPI',
        status: 'SUCCESS'
      });
    }

    if (isMissingSettlement) continue;

    const mdr = parseFloat((paymentAmount * 0.02).toFixed(2));
    const gstOnMdr = parseFloat((mdr * 0.18).toFixed(2));
    let netAmount = parseFloat((paymentAmount - mdr - gstOnMdr).toFixed(2));
    
    let refund = 0;
    if (i % 25 === 0) {
      refund = 50;
      netAmount -= refund;
    }

    const settlementDate = isTimingReview ? '2026-08-10' : '2026-08-03';

    settlements.push({
      id: `SET-${i.toString().padStart(3, '0')}`,
      paymentId: `PAY-${i.toString().padStart(3, '0')}`,
      settlementDate: settlementDate,
      grossAmount: paymentAmount,
      mdr: mdr,
      gstOnMdr: gstOnMdr,
      refundAmount: refund,
      chargebackAmount: 0,
      adjustmentAmount: 0,
      netAmount: netAmount,
      status: 'PROCESSED'
    });

    if (isMissingBank) continue;

    bankCredits.push({
      id: `BNK-${i.toString().padStart(3, '0')}`,
      settlementId: `SET-${i.toString().padStart(3, '0')}`,
      creditDate: '2026-08-04',
      amount: netAmount,
      narration: `Settlement for SET-${i.toString().padStart(3, '0')}`
    });
  }

  return {
    invoicesCsv: arrayToCsv(invoices),
    paymentsCsv: arrayToCsv(payments),
    settlementsCsv: arrayToCsv(settlements),
    bankCreditsCsv: arrayToCsv(bankCredits)
  };
};

function arrayToCsv(arr: any[]) {
  if (arr.length === 0) return '';
  const headers = Object.keys(arr[0]).join(',');
  const rows = arr.map(obj => Object.values(obj).join(',')).join('\n');
  return `${headers}\n${rows}`;
}
