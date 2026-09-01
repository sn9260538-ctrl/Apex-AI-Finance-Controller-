import { Invoice, Payment, Settlement, BankCredit } from '../types';

export interface SyntheticDatasetBundle {
  invoices: Invoice[];
  payments: Payment[];
  settlements: Settlement[];
  bankCredits: BankCredit[];
  invoicesCsv: string;
  paymentsCsv: string;
  settlementsCsv: string;
  bankCreditsCsv: string;
}

export function generate100RecordSyntheticDataset(): SyntheticDatasetBundle {
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  const settlements: Settlement[] = [];
  const bankCredits: BankCredit[] = [];

  const paymentMethods = ['UPI', 'Card', 'Netbanking', 'Wallet'];
  const customerNames = [
    'Acme Technologies India Pvt Ltd',
    'Nexus Cloud Solutions',
    'Zenith Retail Ventures',
    'Bharat Logistics Corp',
    'Finovate Payments Ltd',
    'Kaveri Consumer Goods',
    'Trident Engineering Works',
    'Vanguard Media Labs',
    'Omega Healthcare Solutions',
    'Sahyadri Agro Foods'
  ];

  for (let i = 1; i <= 100; i++) {
    const idNum = i.toString().padStart(3, '0');
    const invId = `INV-${idNum}`;
    const payId = `PAY-${idNum}`;
    const setId = `SET-${idNum}`;
    const bnkId = `BNK-${idNum}`;

    const customer = customerNames[(i - 1) % customerNames.length];
    const pMethod = paymentMethods[(i - 1) % paymentMethods.length];

    // Base amounts: Realistic Indian INR corporate transactions between ₹1,200 and ₹25,000
    let baseAmount = 1500 + ((i * 237) % 18500);
    // Round to standard 2 decimal places
    baseAmount = Math.round(baseAmount * 100) / 100;

    // Categories with Professional Fees for TDS screening
    let category = 'Sales';
    if (i % 5 === 0 || i === 10 || i === 20 || i === 30 || i === 50 || i === 60) {
      category = 'Professional Fees';
    } else if (i % 3 === 0) {
      category = 'Subscription';
    } else if (i % 2 === 0) {
      category = 'Services';
    }

    // Default dates (Aug 2026)
    const day = ((i - 1) % 10) + 1;
    const invDate = `2026-08-${day.toString().padStart(2, '0')}`;
    const payDate = `2026-08-${(day + 1).toString().padStart(2, '0')}`;
    let setDate = `2026-08-${(day + 2).toString().padStart(2, '0')}`;
    let bnkDate = `2026-08-${(day + 3).toString().padStart(2, '0')}`;

    // Specific Scenario Logic:
    // -------------------------------------------------------------
    // Group 1: INV-001 to INV-068 -> Fully Matched (68 records)
    // Included: INV-025 (Refund ₹150), INV-040 (Chargeback ₹250), INV-060 (Adjustment ₹100)
    // -------------------------------------------------------------
    // Group 2: INV-069 to INV-078 -> Timing Review (10 records)
    //   INV-069..INV-074: Settlement timing (setDate is 10 days later)
    //   INV-075..INV-078: Bank credit timing (bnkDate is 8 days later)
    // -------------------------------------------------------------
    // Group 3: INV-079 to INV-086 -> Amount Mismatches (8 records)
    //   INV-079: payment diff ₹0.50 (<= ₹1 tol -> auto_resolve)
    //   INV-080: payment diff ₹0.80 (<= ₹1 tol -> auto_resolve)
    //   INV-081: payment diff ₹80.00 (manual_review)
    //   INV-082: payment diff ₹250.00 (manual_review)
    //   INV-083: payment diff ₹2,500.00 (escalate)
    //   INV-084: settlement net diff ₹45.20 (manual_review)
    //   INV-085: settlement net diff ₹3,500.00 (escalate)
    //   INV-086: bank credit diff ₹1,500.00 (escalate)
    // -------------------------------------------------------------
    // Group 4: INV-087 to INV-091 -> Missing Records (5 records)
    //   INV-087: Missing in Payment (Unmatched, ₹1,500 escalate)
    //   INV-088: Missing in Payment (Unmatched, ₹3,800 escalate)
    //   INV-089: Missing in Settlement (Partial Match, ₹800 manual_review)
    //   INV-090: Missing in Settlement (Partial Match, ₹2,400 escalate)
    //   INV-091: Missing in Settlement (Partial Match, ₹6,500 escalate)
    // -------------------------------------------------------------
    // Group 5: INV-092 to INV-094 -> Missing Bank Credits (3 records)
    //   INV-092: Missing in Bank (Partial Match, ₹900 manual_review)
    //   INV-093: Missing in Bank (Partial Match, ₹4,200 escalate)
    //   INV-094: Missing in Bank (Partial Match, ₹11,000 escalate)
    // -------------------------------------------------------------
    // Group 6: INV-095 to INV-097 -> Duplicate Records (3 records)
    //   INV-095: Duplicate Payment ID
    //   INV-096: Duplicate Settlement ID
    //   INV-097: Duplicate Bank Credit ID
    // -------------------------------------------------------------
    // Group 7: INV-098 to INV-100 -> Data Quality Issues (3 records)
    //   INV-098: Settlement missing deduction fields (null/undefined)
    //   INV-099: Payment invalid date format ('invalid-date-format')
    //   INV-100: Invoice invalid amount (null / 0)
    // -------------------------------------------------------------

    // 1. Invoices
    let invAmount = baseAmount;
    if (i === 100) {
      invAmount = 0; // Data quality: invalid amount
    }

    invoices.push({
      id: invId,
      invoiceDate: invDate,
      customerName: customer,
      amount: invAmount,
      category: category
    });

    // Handle Missing in Payment (INV-087, INV-088)
    if (i === 87 || i === 88) {
      continue;
    }

    // 2. Payments
    let paymentAmount = baseAmount;
    let paymentDateStr = payDate;

    if (i === 79) paymentAmount = baseAmount - 0.50; // tolerance auto-resolve
    else if (i === 80) paymentAmount = baseAmount - 0.80; // tolerance auto-resolve
    else if (i === 81) paymentAmount = baseAmount - 80.00; // manual review
    else if (i === 82) paymentAmount = baseAmount - 250.00; // manual review
    else if (i === 83) paymentAmount = baseAmount - 2500.00; // escalate
    else if (i === 99) paymentDateStr = 'invalid-date-format'; // Data quality

    payments.push({
      id: payId,
      invoiceId: invId,
      paymentDate: paymentDateStr,
      amount: paymentAmount,
      paymentMethod: pMethod,
      status: 'SUCCESS'
    });

    // Duplicate Payment candidate (INV-095)
    if (i === 95) {
      payments.push({
        id: `${payId}-DUP`,
        invoiceId: invId,
        paymentDate: paymentDateStr,
        amount: paymentAmount,
        paymentMethod: pMethod,
        status: 'SUCCESS'
      });
    }

    // Handle Missing in Settlement (INV-089, INV-090, INV-091)
    if (i === 89 || i === 90 || i === 91) {
      continue;
    }

    // 3. Settlements
    // Timing difference: INV-069 to INV-074
    if (i >= 69 && i <= 74) {
      setDate = `2026-08-${(day + 11).toString().padStart(2, '0')}`;
    }

    const mdr = Math.round(paymentAmount * 0.018 * 100) / 100;
    const gstOnMdr = Math.round(mdr * 0.18 * 100) / 100;

    let refund = 0;
    let chargeback = 0;
    let adjustment = 0;

    if (i === 25) refund = 150.00;
    if (i === 40) chargeback = 250.00;
    if (i === 60) adjustment = 100.00;

    let netAmount = Math.round((paymentAmount - mdr - gstOnMdr - refund - chargeback - adjustment) * 100) / 100;

    // Amount mismatches on Settlement
    if (i === 84) {
      netAmount = Math.round((netAmount - 45.20) * 100) / 100;
    } else if (i === 85) {
      netAmount = Math.round((netAmount - 3500.00) * 100) / 100;
    }

    // Data quality missing deduction line items (INV-098)
    const isMissingDeductions = (i === 98);

    settlements.push({
      id: setId,
      paymentId: payId,
      settlementDate: setDate,
      grossAmount: paymentAmount,
      mdr: isMissingDeductions ? (undefined as any) : mdr,
      gstOnMdr: isMissingDeductions ? (undefined as any) : gstOnMdr,
      refundAmount: isMissingDeductions ? (undefined as any) : refund,
      chargebackAmount: isMissingDeductions ? (undefined as any) : chargeback,
      adjustmentAmount: isMissingDeductions ? (undefined as any) : adjustment,
      netAmount: netAmount,
      status: 'PROCESSED'
    });

    // Duplicate Settlement candidate (INV-096)
    if (i === 96) {
      settlements.push({
        id: `${setId}-DUP`,
        paymentId: payId,
        settlementDate: setDate,
        grossAmount: paymentAmount,
        mdr: mdr,
        gstOnMdr: gstOnMdr,
        refundAmount: refund,
        chargebackAmount: chargeback,
        adjustmentAmount: adjustment,
        netAmount: netAmount,
        status: 'PROCESSED'
      });
    }

    // Handle Missing in Bank (INV-092, INV-093, INV-094)
    if (i === 92 || i === 93 || i === 94) {
      continue;
    }

    // 4. Bank Credits
    // Bank credit timing difference: INV-075 to INV-078
    if (i >= 75 && i <= 78) {
      bnkDate = `2026-08-${(day + 10).toString().padStart(2, '0')}`;
    } else {
      bnkDate = `2026-08-${(day + 3).toString().padStart(2, '0')}`;
    }

    let bankAmount = netAmount;
    if (i === 86) {
      bankAmount = Math.round((netAmount - 1500.00) * 100) / 100;
    }

    bankCredits.push({
      id: bnkId,
      settlementId: setId,
      creditDate: bnkDate,
      amount: bankAmount,
      narration: `Settlement payout for ${setId} Ref#${idNum}99`
    });

    // Duplicate Bank Credit candidate (INV-097)
    if (i === 97) {
      bankCredits.push({
        id: `${bnkId}-DUP`,
        settlementId: setId,
        creditDate: bnkDate,
        amount: bankAmount,
        narration: `Duplicate payout for ${setId} Ref#${idNum}99`
      });
    }
  }

  return {
    invoices,
    payments,
    settlements,
    bankCredits,
    invoicesCsv: arrayToCsv(invoices),
    paymentsCsv: arrayToCsv(payments),
    settlementsCsv: arrayToCsv(settlements),
    bankCreditsCsv: arrayToCsv(bankCredits)
  };
}

function arrayToCsv(arr: any[]): string {
  if (arr.length === 0) return '';
  const keys = Object.keys(arr[0]);
  const headers = keys.join(',');
  const rows = arr.map(obj => {
    return keys.map(k => {
      const val = obj[k];
      if (val === undefined || val === null) return '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',');
  }).join('\n');
  return `${headers}\n${rows}`;
}
