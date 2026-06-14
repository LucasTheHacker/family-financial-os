"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SettlementBoard from "@/components/dashboard/SettlementBoard";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import ExpenseLedger from "@/components/expenses/ExpenseLedger";
import RecurringTemplates from "@/components/recurring/RecurringTemplates";
import MemberManager from "@/components/members/MemberManager";
import { useApp } from "@/context/AppContext";

function HomeContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const { error, loading, expenses } = useApp();
  const [dismissError, setDismissError] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <SettlementBoard />
            <ExpenseForm />
          </div>
        );
      case "ledger":
        return <ExpenseLedger />;
      case "recurring":
        return <RecurringTemplates />;
      case "members":
        return <MemberManager />;
      default:
        return (
          <div className="space-y-6">
            <SettlementBoard />
            <ExpenseForm />
          </div>
        );
    }
  };

  return (
    <>
      {/* Error Banner */}
      {error && !dismissError && (
        <div className="flex items-center justify-between rounded-2xl bg-rose-50 border border-rose-200/50 p-4 text-sm font-semibold text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setDismissError(true)}
            className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Dynamic Tab Views */}
      <div className="transition-all duration-300">
        {renderContent()}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="text-zinc-500 font-medium text-sm">Carregando...</span>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
