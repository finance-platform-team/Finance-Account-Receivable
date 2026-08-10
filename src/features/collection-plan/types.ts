export type EditableFieldKey =
  | 'earlypayment'
  | 'legalissues'
  | 'bankruptcy'
  | 'claimsissue'
  | 'stopped'
  | 'agreedrecon';

export interface PlanRow {
  id: string;
  code: string;
  name: string;
  customerClass: string;
  companyType: string;
  bu: string;
  paymentTerm: string;
  taskOwner: string;
  supervisor: string;
  earlypayment: number;
  legalissues: number;
  bankruptcy: number;
  claimsissue: number;
  stopped: number;
  agreedrecon: number;
  totalOutstanding: number;
  rejections: number;
  outstandingRej: number;
  totalDues: number;
  targetPlanDB: number;
  achievement: number | null;
  collected: number;
  tax: number;
  collectedPlus: number;
}

export interface PlanTotals {
  agreedrecon: number;
  totalOutstanding: number;
  rejections: number;
  outstandingRej: number;
  totalDues: number;
  targetPlan: number;
  collected: number;
  collectedPlus: number;
}

export type AchvLevel = 'over' | 'mid' | 'low';

export interface DirtyChange {
  value: number;
  orig: number;
}

export interface AuditRow {
  id: string;
  when: string;
  field: string;
  oldValue: number | null;
  newValue: number | null;
  companyName: string;
  companyCode: string;
  type: string;
  changedBy: string;
}
