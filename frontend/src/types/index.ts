export interface User {
  id: string;
  name: string;
  email: string;
  pix_key?: string;
  created_at: string;
}

export interface UserCreate {
  name: string;
  email: string;
  pix_key?: string;
}

export interface Participation {
  id: string;
  expense_id: string;
  user_id: string;
  value?: number;
  weight?: number;
  user: User;
}

export interface ParticipationCreate {
  user_id: string;
  value?: number;
  weight?: number;
}

export interface Expense {
  id: string;
  title: string;
  total_amount: number;
  date: string;
  payer_id: string;
  expense_type: "Single" | "Fixed" | "Installment";
  billing_cycle: string;
  installment_number?: number;
  total_installments?: number;
  parent_installment_id?: string;
  recurring_expense_id?: string;
  created_at: string;
  payer: User;
  participations: Participation[];
}

export interface ExpenseCreate {
  title: string;
  total_amount: number;
  date?: string;
  payer_id: string;
  expense_type: "Single" | "Fixed" | "Installment";
  billing_cycle: string;
  total_installments?: number;
  participations: ParticipationCreate[];
}

export interface RecurringParticipation {
  id: string;
  recurring_expense_id: string;
  user_id: string;
  value?: number;
  weight?: number;
  user: User;
}

export interface RecurringParticipationCreate {
  user_id: string;
  value?: number;
  weight?: number;
}

export interface RecurringExpense {
  id: string;
  title: string;
  total_amount: number;
  payer_id: string;
  is_active: boolean;
  created_at: string;
  payer: User;
  participations: RecurringParticipation[];
}

export interface RecurringExpenseCreate {
  title: string;
  total_amount: number;
  payer_id: string;
  is_active: boolean;
  participations: RecurringParticipationCreate[];
}

export interface SettlementBalance {
  user_id: string;
  user_name: string;
  total_paid: number;
  total_consumed: number;
  net_balance: number;
}

export interface SettlementTransaction {
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  amount: number;
}

export interface SettlementReport {
  billing_cycle: string;
  balances: SettlementBalance[];
  transactions: SettlementTransaction[];
}
