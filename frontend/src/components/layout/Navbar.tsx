"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (pathname === "/login") return null;

  const { currentCycle, setCurrentCycle, loading, refreshAll } = useApp();
  const router = useRouter();

  // Determine active tab based on pathname and searchParams
  const activeTab = pathname.startsWith("/participants") || pathname.startsWith("/members")
    ? "members"
    : searchParams.get("tab") || "dashboard";

  // Translate month names dynamically using pt-BR locale
  const formatCycleDisplay = (cycleStr: string) => {
    try {
      const [year, month] = cycleStr.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      // Capitalize first letter of the month
      const formatted = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return cycleStr;
    }
  };

  const handlePrevMonth = () => {
    const [year, month] = currentCycle.split("-").map(Number);
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    setCurrentCycle(`${prevYear}-${String(prevMonth).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentCycle.split("-").map(Number);
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear += 1;
    }
    setCurrentCycle(`${nextYear}-${String(nextMonth).padStart(2, "0")}`);
  };

  const handleTabClick = (tabId: string) => {
    if (tabId === "members") {
      router.push("/participants");
    } else {
      router.push(`/?tab=${tabId}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5M5.25 7.5h13.5m-12 9a3 3 0 0 1 3-3h1.5a3 3 0 0 1 3 3m0 0a3 3 0 0 1-3 3H9.75a3 3 0 0 1-3-3Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-zinc-900 dark:text-white text-sm sm:text-lg tracking-tight truncate block max-w-[130px] xs:max-w-[180px] sm:max-w-none">
              Central Financeira - Família Batista
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="hidden md:flex space-x-1">
          {[
            { id: "dashboard", label: "Painel Geral" },
            { id: "ledger", label: "Lista de Rateios" },
            { id: "members", label: "Membros" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Billing Cycle Selector & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white/50 p-1 dark:border-zinc-800 dark:bg-zinc-900/50">
            <button
              onClick={handlePrevMonth}
              title="Mês Anterior"
              className="rounded p-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            <div className="relative px-1 sm:px-2 min-w-[90px] sm:min-w-[110px] text-center">
              <input
                type="month"
                value={currentCycle}
                onChange={(e) => e.target.value && setCurrentCycle(e.target.value)}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
              />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 select-none whitespace-nowrap">
                {formatCycleDisplay(currentCycle)}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              title="Próximo Mês"
              className="rounded p-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-lg border border-zinc-200 p-2 text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all cursor-pointer"
            title={theme === "light" ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
          >
            {theme === "light" ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m8.944-8.944H18.75M5.25 12H3m16.293-6.293-1.591 1.591M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Zm-9-6.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM6.75 6.75l.75.75m10.5 10.5.75.75" />
              </svg>
            )}
          </button>

          <button
            onClick={() => refreshAll()}
            disabled={loading}
            suppressHydrationWarning
            className={`rounded-lg border border-zinc-200 p-2 text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all cursor-pointer ${
              loading ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""
            }`}
            title="Sincronizar Dados"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex md:hidden border-t border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 px-2 py-1 justify-around">
        {[
          { id: "dashboard", label: "Painel", icon: "📊" },
          { id: "ledger", label: "Rateios", icon: "💸" },
          { id: "members", label: "Membros", icon: "👥" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex flex-col items-center flex-1 py-1 text-[10px] font-medium transition-all ${
              activeTab === tab.id
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <span className="text-base mb-0.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
