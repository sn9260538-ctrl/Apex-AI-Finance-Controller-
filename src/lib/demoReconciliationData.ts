import { generate100RecordSyntheticDataset, SyntheticDatasetBundle } from './syntheticDataset';

export const generateDemoData = (): {
  invoicesCsv: string;
  paymentsCsv: string;
  settlementsCsv: string;
  bankCreditsCsv: string;
} => {
  const bundle = generate100RecordSyntheticDataset();
  return {
    invoicesCsv: bundle.invoicesCsv,
    paymentsCsv: bundle.paymentsCsv,
    settlementsCsv: bundle.settlementsCsv,
    bankCreditsCsv: bundle.bankCreditsCsv
  };
};

export { generate100RecordSyntheticDataset };
export type { SyntheticDatasetBundle };
