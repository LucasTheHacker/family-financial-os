import {
  User,
  UserCreate,
  Expense,
  ExpenseCreate,
  SettlementReport,
  RecurringExpense,
  RecurringExpenseCreate,
} from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> || {}),
  };

  // Attach Supabase access token if running in the browser
  if (typeof window !== "undefined") {
    try {
      const { supabase } = await import("./supabase");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Error retrieving Supabase session token:", err);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        errorMessage = Array.isArray(errorData.detail)
          ? errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")
          : errorData.detail;
      }
    } catch {
      // Ignore parsing errors, keep default message
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  return response.json();
}

export const api = {
  // Users
  getUsers: () => request<User[]>("/api/v1/users/"),
  createUser: (user: UserCreate) =>
    request<User>("/api/v1/users/", {
      method: "POST",
      body: JSON.stringify(user),
    }),
  updateUser: (userId: string, user: Partial<UserCreate>) =>
    request<User>(`/api/v1/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(user),
    }),
  deleteUser: (userId: string) =>
    request<void>(`/api/v1/users/${userId}`, {
      method: "DELETE",
    }),

  // Expenses
  getExpenses: (billingCycle?: string) => {
    const query = billingCycle ? `?billing_cycle=${billingCycle}` : "";
    return request<Expense[]>(`/api/v1/expenses/${query}`);
  },
  createExpense: (expense: ExpenseCreate) =>
    request<Expense>("/api/v1/expenses/", {
      method: "POST",
      body: JSON.stringify(expense),
    }),
  updateExpense: (expenseId: string, expense: Partial<ExpenseCreate>) =>
    request<Expense>(`/api/v1/expenses/${expenseId}`, {
      method: "PUT",
      body: JSON.stringify(expense),
    }),
  deleteExpense: (expenseId: string, deleteGroup: boolean = false) =>
    request<void>(`/api/v1/expenses/${expenseId}?delete_group=${deleteGroup}`, {
      method: "DELETE",
    }),

  // Settlements
  getSettlements: (billingCycle: string) =>
    request<SettlementReport>(`/api/v1/expenses/settlement?billing_cycle=${billingCycle}`),

  // Recurring Template
  getRecurringTemplates: () => request<RecurringExpense[]>("/api/v1/recurring-expenses/"),
  createRecurringTemplate: (template: RecurringExpenseCreate) =>
    request<RecurringExpense>("/api/v1/recurring-expenses/", {
      method: "POST",
      body: JSON.stringify(template),
    }),
  deleteRecurringTemplate: (templateId: string) =>
    request<void>(`/api/v1/recurring-expenses/${templateId}`, {
      method: "DELETE",
    }),
  generateRecurringExpenses: (billingCycle: string) =>
    request<Expense[]>(`/api/v1/recurring-expenses/generate?billing_cycle=${billingCycle}`, {
      method: "POST",
    }),
};
