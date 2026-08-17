export interface BusinessPartnerRow {
  id: string;
  name: string;
  companyCode: string;
  companyType: string;
  companyTypeValue: number | null;
  paymentTerm: string;
  paymentTermId: string | null;
  customerClass: string;
  customerClassValue: number | null;
  bu: string;
  buId: string | null;
  createdBy: string;
  createdOn: string;
}

export type SortKey =
  | 'name'
  | 'companyCode'
  | 'companyType'
  | 'paymentTerm'
  | 'customerClass'
  | 'bu'
  | 'createdBy'
  | 'createdOn';

export type SortDir = 'asc' | 'desc';

export interface PartnerFormInput {
  name: string;
  companyCode: string;
  companyTypeValue: number | null;
  customerClassValue: number | null;
  paymentTermId: string | null;
  buId: string;
  buName: string;
}

export interface BulkEditInput {
  companyTypeValue?: number | null;
  customerClassValue?: number | null;
  paymentTermId?: string | null;
  buId?: string;
  buName?: string;
}

export type { BuOption } from '../../shared/components/BuCombo';
