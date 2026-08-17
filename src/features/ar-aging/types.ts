export interface AgingRow {
  id: string;
  code: string;
  name: string;
  customerClass: string;
  companyType: string;
  type: string;
  typeId: string | null;
  paymentTerm: string;
  taskOwner: string;
  supervisor: string;
  notDue: number;
  lt30: number;
  b3160: number;
  b6190: number;
  b91120: number;
  gt120: number;
  notes: string;
}

export interface AgingTotals {
  notDue: number;
  lt30: number;
  b3160: number;
  b6190: number;
  b91120: number;
  gt120: number;
}

export type DatasetKey = 'core' | 'africa';
