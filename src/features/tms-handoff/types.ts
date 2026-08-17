export interface TmsHandoffRow {
  id: string;
  taskCode: string;
  decisionId: string;
  title: string;
  description: string;
  typeAction: string;
  assignee: string;
  priority: string;
  sla: string;
  dueDate: string | null;
  statusCode: number | null;
  statusLabel: string;
  createdOn: string | null;
}

export type SlaTone = 'ok' | 'warn' | 'bad';
