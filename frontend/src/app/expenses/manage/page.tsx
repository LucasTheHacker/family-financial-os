"use client";

import React, { Suspense } from "react";
import ExpenseManager from "@/components/expenses/ExpenseManager";

export default function ManageExpensePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <span className="text-zinc-500 font-medium text-sm">Carregando formulário...</span>
          </div>
        </div>
      }
    >
      <ExpenseManager />
    </Suspense>
  );
}
