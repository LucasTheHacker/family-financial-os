"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";

const formatBRL = (val: number) => {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

interface ProfileViewProps {
  userId: string;
  onBack?: () => void;
}

export default function ProfileView({ userId, onBack }: ProfileViewProps) {
  const { expenses, users } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<"paid" | "share">("paid");

  const member = users.find((u) => u.id === userId);

  if (!member) {
    return (
      <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-6 text-center dark:border-zinc-800/50 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Perfil do membro não encontrado.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
          >
            Voltar
          </button>
        )}
      </div>
    );
  }

  // 1. Expenses Paid by Me
  const paidExpenses = expenses.filter((e) => e.payer_id === userId);
  const totalPaidSum = paidExpenses.reduce((sum, e) => sum + Number(e.total_amount), 0);

  // 2. My Share in Expenses (Consumptions)
  const shareExpenses = expenses.filter((e) =>
    e.participations.some((p) => p.user_id === userId)
  );

  const getMyShareAmount = (expense: any) => {
    const part = expense.participations.find((p: any) => p.user_id === userId);
    return Number(part?.value || 0);
  };

  const totalShareSum = shareExpenses.reduce((sum, e) => sum + getMyShareAmount(e), 0);
  const netBalance = totalPaidSum - totalShareSum;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const localDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      const day = String(localDate.getDate()).padStart(2, "0");
      const month = String(localDate.getMonth() + 1).padStart(2, "0");
      const year = localDate.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/50 p-6 dark:border-zinc-800/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
        <div className="absolute top-0 right-0 h-32 w-32 translate-x-6 -translate-y-6 rounded-full bg-indigo-500/10 blur-2xl"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-lg border border-zinc-200 p-2 text-zinc-650 hover:bg-zinc-150 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors"
                title="Voltar para a lista de membros"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </button>
            )}
            
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-xl font-bold text-white shadow-lg shadow-indigo-500/15">
              {member.name.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{member.name}</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{member.email}</p>
              {member.pix_key && (
                <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.002-.083.003-.165.003-.247M8.25 3.888c.002-.083.003-.165.003-.247m0 0a2.25 2.25 0 0 1 2.25-2.25h3a2.25 2.25 0 0 1 2.25 2.25m-6 0c0-.213.017-.424.05-.63a5 5 0 1 1 5.9 0c.033.206.05.417.05.63m-9.75 0.12A10.5 10.5 0 0 0 12 21.75a10.5 10.5 0 0 0 9.75-17.742" />
                  </svg>
                  <span>Chave Pix: {member.pix_key}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 border-t border-zinc-100 sm:border-t-0 pt-4 sm:pt-0 flex-wrap">
            <div className="text-right">
              <span className="block text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Pago</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">R$ {formatBRL(totalPaidSum)}</span>
            </div>
            <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 self-center"></div>
            <div className="text-right">
              <span className="block text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Consumido</span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">R$ {formatBRL(totalShareSum)}</span>
            </div>
            <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 self-center"></div>
            <div className="text-right">
              <span className="block text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Saldo Pessoal</span>
              <span className={`text-lg font-bold ${netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                R$ {formatBRL(netBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Lists Grid / Tabs */}
      <div className="rounded-2xl border border-zinc-200/50 bg-white/50 overflow-hidden dark:border-zinc-800/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
        {/* Navigation Selector */}
        <div className="border-b border-zinc-150 dark:border-zinc-800">
          <nav className="flex px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveSubTab("paid")}
              className={`border-b-2 py-4 px-3 text-sm font-semibold transition-all ${
                activeSubTab === "paid"
                  ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              Despesas Pagas por Mim ({paidExpenses.length})
            </button>
            <button
              onClick={() => setActiveSubTab("share")}
              className={`border-b-2 py-4 px-3 text-sm font-semibold transition-all ${
                activeSubTab === "share"
                  ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              Minha Parcela em Despesas ({shareExpenses.length})
            </button>
          </nav>
        </div>

        {/* Content lists */}
        <div className="p-6">
          {activeSubTab === "paid" ? (
            paidExpenses.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                Nenhuma despesa paga por este usuário neste ciclo de faturamento.
              </p>
            ) : (
              <div className="space-y-4">
                {paidExpenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center rounded-xl bg-zinc-50/50 p-4 dark:bg-zinc-900/30 border border-zinc-100/50 dark:border-zinc-800/30">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{expense.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                        <span>{formatDate(expense.date)}</span>
                        <span>•</span>
                        <span>Dividido com {expense.participations.map((p) => p.user?.name || "Usuário").join(", ")}</span>
                      </p>
                    </div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      R$ {formatBRL(Number(expense.total_amount))}
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : shareExpenses.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
              Nenhuma parcela de consumo para este usuário neste ciclo de faturamento.
            </p>
          ) : (
            <div className="space-y-4">
              {shareExpenses.map((expense) => {
                const shareAmount = getMyShareAmount(expense);
                const payerName = expense.payer?.name || "Desconhecido";

                return (
                  <div key={expense.id} className="flex justify-between items-center rounded-xl bg-zinc-50/50 p-4 dark:bg-zinc-900/30 border border-zinc-100/50 dark:border-zinc-800/30">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{expense.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                        <span>{formatDate(expense.date)}</span>
                        <span>•</span>
                        <span>Pago por {payerName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-rose-600 dark:text-rose-400">
                        R$ {formatBRL(shareAmount)}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        Custo total: R$ {formatBRL(Number(expense.total_amount))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
