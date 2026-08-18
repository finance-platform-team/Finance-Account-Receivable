export interface AllocationRow {
  id: string;
  month: string | null;
  claim: number;
  amount: number;
  tax: number;
  volumeDiscount: number;
  earlyDiscount: number;
  admin: number;
  rejection: number;
  gross: number;
}

export interface VerificationRow {
  id: string;
  ref: string;
  entity: string;
  companyId: string | null;
  companyCode: string;
  companyName: string;
  date: string;
  method: number | null;
  methodLabel: string;
  bankAccount: string;
  net: number;
  proof: string;
  note: string;
  paymentReference: string;
  status: number | null;
  statusLabel: string;
  actionBy: string;
  actionOn: string;
  docsFolder: string;
  monthsLabel: string;
  claimsLabel: string;
  tax: number;
  vol: number;
  early: number;
  admin: number;
  reject: number;
  gross: number;
  allocs: AllocationRow[];
}

export type DecisionAction = 'approve' | 'reject';

export interface ProofFile {
  name: string;
  url: string;
  size?: number;
}
