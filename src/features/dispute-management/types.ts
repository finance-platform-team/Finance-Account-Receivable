export interface DisputeRow {
  id: string;
  code: string;
  name: string;
  auto: boolean;
  companyId: string | null;
  amount: number;
  rejPct: number | null;
  due: string;
  dueRaw: string | null;
  category: string;
  categoryValue: number | null;
  arReview: string;
  arReviewValue: number | null;
  owner: string;
  agreement: string;
  proof: string;
  docsFolder: string;
}

export interface DisputeHistoryRow {
  id: string;
  typeLabel: string;
  typeValue: number | null;
  note: string;
  date: string;
}

export interface CompanySearchResult {
  id: string;
  code: string;
  name: string;
  cls: string;
}

export interface NewDisputeInput {
  code: string;
  companyName: string;
  companyId: string | null;
  categoryValue: number;
  amount: number | null;
  dueMonth: string;
}
