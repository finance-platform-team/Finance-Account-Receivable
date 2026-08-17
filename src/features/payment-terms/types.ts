export interface PaymentTermRow {
  id: string;
  name: string;
  numberOfDays: number;
  createdBy: string;
  createdOn: string;
}

export type SortKey = 'name' | 'numberOfDays' | 'createdOn';
export type SortDir = 'asc' | 'desc';
