"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, UserCreate, Expense, ExpenseCreate, SettlementReport, RecurringExpense, RecurringExpenseCreate } from "@/types";
import { api } from "@/lib/api";
import { usePathname } from "next/navigation";

interface AppContextType {
  users: User[];
  expenses: Expense[];
  settlements: SettlementReport | null;
  recurringTemplates: RecurringExpense[];
  currentCycle: string;
  loading: boolean;
  error: string | null;
  setCurrentCycle: (cycle: string) => void;
  refreshUsers: () => Promise<void>;
  refreshExpenses: () => Promise<void>;
  refreshSettlements: () => Promise<void>;
  refreshRecurringTemplates: () => Promise<void>;
  refreshAll: () => Promise<void>;
  createUser: (user: UserCreate) => Promise<User>;
  updateUser: (userId: string, user: Partial<UserCreate>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  createExpense: (expense: ExpenseCreate) => Promise<Expense>;
  updateExpense: (expenseId: string, expense: Partial<ExpenseCreate>) => Promise<Expense>;
  deleteExpense: (expenseId: string, deleteGroup?: boolean) => Promise<void>;
  createRecurringTemplate: (template: RecurringExpenseCreate) => Promise<RecurringExpense>;
  deleteRecurringTemplate: (templateId: string) => Promise<void>;
  generateRecurringExpenses: (cycle: string) => Promise<Expense[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Initialize with current date's cycle (YYYY-MM)
  const getInitialCycle = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${month}`;
  };

  const [currentCycle, setCurrentCycleState] = useState<string>(getInitialCycle());
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<SettlementReport | null>(null);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const setCurrentCycle = (cycle: string) => {
    setCurrentCycleState(cycle);
  };

  const refreshUsers = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to fetch users");
    }
  }, []);

  const refreshExpenses = useCallback(async () => {
    try {
      const data = await api.getExpenses(currentCycle);
      setExpenses(data);
    } catch (err: any) {
      console.error("Error fetching expenses:", err);
      setError(err.message || "Failed to fetch expenses");
    }
  }, [currentCycle]);

  const refreshSettlements = useCallback(async () => {
    try {
      const data = await api.getSettlements(currentCycle);
      setSettlements(data);
    } catch (err: any) {
      console.error("Error fetching settlements:", err);
      setError(err.message || "Failed to fetch settlements");
    }
  }, [currentCycle]);

  const refreshRecurringTemplates = useCallback(async () => {
    try {
      const data = await api.getRecurringTemplates();
      setRecurringTemplates(data);
    } catch (err: any) {
      console.error("Error fetching recurring templates:", err);
      setError(err.message || "Failed to fetch recurring templates");
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        refreshUsers(),
        refreshExpenses(),
        refreshSettlements(),
        refreshRecurringTemplates()
      ]);
    } catch (err: any) {
      setError("An error occurred while reloading data.");
    } finally {
      setLoading(false);
    }
  }, [refreshUsers, refreshExpenses, refreshSettlements, refreshRecurringTemplates]);

  // Handle data updates when billing cycle changes
  useEffect(() => {
    if (pathname === "/login") return;
    const loadCycleData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([refreshExpenses(), refreshSettlements()]);
      } catch (err) {
        // error handled in sub-methods
      } finally {
        setLoading(false);
      }
    };
    loadCycleData();
  }, [currentCycle, refreshExpenses, refreshSettlements, pathname]);

  // Initial load
  useEffect(() => {
    if (pathname === "/login") return;
    const initialLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([refreshUsers(), refreshRecurringTemplates()]);
      } catch (err) {
        // error handled in sub-methods
      } finally {
        setLoading(false);
      }
    };
    initialLoad();
  }, [refreshUsers, refreshRecurringTemplates, pathname]);

  const createUser = async (user: UserCreate) => {
    setLoading(true);
    try {
      const newUser = await api.createUser(user);
      await refreshUsers();
      return newUser;
    } catch (err: any) {
      setError(err.message || "Failed to create user");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, user: Partial<UserCreate>) => {
    setLoading(true);
    try {
      const updated = await api.updateUser(userId, user);
      await Promise.all([refreshUsers(), refreshExpenses(), refreshSettlements()]);
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to update user");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setLoading(true);
    try {
      await api.deleteUser(userId);
      await Promise.all([refreshUsers(), refreshExpenses(), refreshSettlements()]);
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expense: ExpenseCreate) => {
    setLoading(true);
    try {
      const newExpense = await api.createExpense(expense);
      await Promise.all([refreshExpenses(), refreshSettlements()]);
      return newExpense;
    } catch (err: any) {
      setError(err.message || "Failed to create expense");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (expenseId: string, expense: Partial<ExpenseCreate>) => {
    setLoading(true);
    try {
      const updated = await api.updateExpense(expenseId, expense);
      await Promise.all([refreshExpenses(), refreshSettlements()]);
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to update expense");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId: string, deleteGroup: boolean = false) => {
    setLoading(true);
    try {
      await api.deleteExpense(expenseId, deleteGroup);
      await Promise.all([refreshExpenses(), refreshSettlements()]);
    } catch (err: any) {
      setError(err.message || "Failed to delete expense");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createRecurringTemplate = async (template: RecurringExpenseCreate) => {
    setLoading(true);
    try {
      const newTemplate = await api.createRecurringTemplate(template);
      await refreshRecurringTemplates();
      return newTemplate;
    } catch (err: any) {
      setError(err.message || "Failed to create recurring template");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRecurringTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      await api.deleteRecurringTemplate(templateId);
      await refreshRecurringTemplates();
    } catch (err: any) {
      setError(err.message || "Failed to delete recurring template");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateRecurringExpenses = async (cycle: string) => {
    setLoading(true);
    try {
      const generated = await api.generateRecurringExpenses(cycle);
      await Promise.all([refreshExpenses(), refreshSettlements()]);
      return generated;
    } catch (err: any) {
      setError(err.message || "Failed to generate recurring expenses");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        users,
        expenses,
        settlements,
        recurringTemplates,
        currentCycle,
        loading,
        error,
        setCurrentCycle,
        refreshUsers,
        refreshExpenses,
        refreshSettlements,
        refreshRecurringTemplates,
        refreshAll,
        createUser,
        updateUser,
        deleteUser,
        createExpense,
        updateExpense,
        deleteExpense,
        createRecurringTemplate,
        deleteRecurringTemplate,
        generateRecurringExpenses,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
