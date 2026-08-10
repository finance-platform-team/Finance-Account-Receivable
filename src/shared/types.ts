export type PageSize = 15 | 25 | 50 | 100 | 'all';

export type ToastKind = 'success' | 'alert' | 'info';

export interface ToastItem {
  id: number;
  title: string;
  message: string;
  kind: ToastKind;
}
