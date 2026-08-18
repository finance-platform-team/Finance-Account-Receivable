export interface SlaRow {
  id: string;
  action: string;
  slaTypeValue: number | null;
  slaTypeLabel: string;
  slaValue: string;
  responsibleId: string | null;
  responsibleName: string;
  escalationRule: string;
  department1: string;
  manager1Id: string | null;
  manager1Name: string;
  department2: string;
  manager2Id: string | null;
  manager2Name: string;
  deduction: string;
}

export interface SlaFormInput {
  action: string;
  slaTypeValue: number | null;
  slaValue: string;
  responsibleId: string | null;
  responsibleName: string;
  escalationRule: string;
  department1: string;
  manager1Id: string | null;
  manager1Name: string;
  department2: string;
  manager2Id: string | null;
  manager2Name: string;
  deduction: string;
}
