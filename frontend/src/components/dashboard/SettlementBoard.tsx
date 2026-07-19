"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { UserAvatar } from "../expenses/ExpenseForm";

const formatBRL = (val: number) => {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function SettlementBoard() {
  const { settlements, expenses, users, loading } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalMonthlySpend = expenses.reduce((sum, exp) => sum + Number(exp.total_amount), 0);

  const getPixKeyForUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.pix_key || null;
  };

  const handleCopyPix = (userId: string, pixKey: string) => {
    navigator.clipboard.writeText(pixKey);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading && (!settlements || settlements.balances.length === 0)) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Settlement plan skeleton */}
        <div className="rounded-2xl border border-zinc-200/50 bg-zinc-200/20 p-6 dark:border-zinc-800/50 dark:bg-zinc-800/20 h-80"></div>
        {/* Balance sheet skeleton */}
        <div className="rounded-2xl border border-zinc-200/50 bg-zinc-200/20 p-6 dark:border-zinc-800/50 dark:bg-zinc-800/20 h-80"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        {/* Real-time Debt Simplification (Transactions) */}
        <div className="rounded-2xl glass-panel p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold leading-6 text-zinc-900 dark:text-white">Valor dos acertos em tempo real</h3>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Esse valor já é resultado do cruzamento de valores entre pagadores e devedores.
            </p>

            <div className="mt-6 space-y-4">
              {expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nenhuma despesa registrada</h4>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 max-w-xs font-medium">
                    Não há despesas cadastradas neste mês. Registre uma nova despesa no formulário lateral.
                  </p>
                </div>
              ) : !settlements || settlements.transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Tudo em Dia!</h4>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 max-w-xs">
                    Nenhum saldo pendente precisa ser acertado. Todos contribuíram proporcionalmente com seus consumos!
                  </p>
                </div>
              ) : (
                settlements.transactions.map((tx, idx) => {
                  const toPixKey = getPixKeyForUser(tx.to_user_id);
                  const isCopied = copiedId === tx.to_user_id;
                  const fromUser = users.find((u) => u.id === tx.from_user_id);
                  const toUser = users.find((u) => u.id === tx.to_user_id);

                  return (
                    <div key={idx} className="flex flex-col rounded-xl bg-zinc-50/50 p-4 dark:bg-zinc-900/30 border border-zinc-200/40 dark:border-zinc-800/40 gap-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <UserAvatar name={tx.from_user_name} avatarUrl={fromUser?.avatar_url} size="w-7 h-7" />
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm">{tx.from_user_name}</span>
                          </div>
                          
                          <div className="flex flex-col items-center gap-0.5 text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider px-1">
                            <span>envia</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-indigo-500 dark:text-violet-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <UserAvatar name={tx.to_user_name} avatarUrl={toUser?.avatar_url} size="w-7 h-7" />
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm">{tx.to_user_name}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">R$ {formatBRL(Number(tx.amount))}</span>
                        </div>
                      </div>

                      {/* Pix Key and Copy Button row */}
                      <div className="flex items-center justify-between border-t border-zinc-150/40 dark:border-zinc-800 pt-2.5 ml-11">
                        <div className="text-xs">
                          {toPixKey ? (
                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                              Chave PIX: <code className="text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px] font-mono">{toPixKey}</code>
                            </span>
                          ) : (
                            <span className="text-zinc-450 dark:text-zinc-500 italic">
                              Chave PIX não cadastrada
                            </span>
                          )}
                        </div>

                        {toPixKey && (
                          <button
                            onClick={() => handleCopyPix(tx.to_user_id, toPixKey)}
                            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold border transition-all ${
                              isCopied
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                                : "bg-white text-indigo-600 border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/30 dark:bg-zinc-900 dark:text-indigo-400 dark:border-zinc-800 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/20"
                            }`}
                            title="Copiar chave Pix para transferência instantânea"
                          >
                            {isCopied ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                                Copiado!
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.002-.083.003-.165.003-.247M8.25 3.888c.002-.083.003-.165.003-.247m0 0a2.25 2.25 0 0 1 2.25-2.25h3a2.25 2.25 0 0 1 2.25 2.25m-6 0c0-.213.017-.424.05-.63a5 5 0 1 1 5.9 0c.033.206.05.417.05.63m-9.75 0.12A10.5 10.5 0 0 0 12 21.75a10.5 10.5 0 0 0 9.75-17.742" />
                                </svg>
                                Copiar chave Pix
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
              {/* Ledger Balance Sheet */}
        <div className="rounded-2xl glass-panel p-6 shadow-sm">
          <h3 className="text-base font-semibold leading-6 text-zinc-900 dark:text-white">Resumo por pessoa</h3>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Compare o valor pago individualmente com a sua participação em rateios.</p>

          <div className="mt-6 space-y-4">
            {settlements?.balances.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">Nenhum registro encontrado para este ciclo.</p>
            ) : (
              settlements?.balances.map((balance) => {
                const netBalance = Number(balance.net_balance);
                const isOwed = netBalance > 0;
                const isEven = netBalance === 0;
                const user = users.find((u) => u.id === balance.user_id);

                return (
                  <div key={balance.user_id} className="group relative rounded-xl bg-zinc-50/50 p-4 hover:bg-zinc-50 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50 transition-all border border-zinc-100/50 dark:border-zinc-800/30">
                     <div className="flex items-center justify-between gap-4">
                       <div className="flex items-center gap-3">
                         <UserAvatar name={balance.user_name} avatarUrl={user?.avatar_url} size="w-9 h-9" />
                         <div>
                           <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{balance.user_name}</h4>
                           <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                             <span>Pagou: <strong className="text-zinc-650 dark:text-zinc-300">R$ {formatBRL(Number(balance.total_paid))}</strong></span>
                             <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                             <span>Consumiu: <strong className="text-zinc-655 dark:text-zinc-300">R$ {formatBRL(Number(balance.total_consumed))}</strong></span>
                           </div>
                         </div>
                       </div>

                       <div className="text-right">
                         <span
                           className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                             isEven
                               ? "bg-zinc-50 text-zinc-600 ring-zinc-500/10 dark:bg-zinc-900 dark:text-zinc-400"
                               : isOwed
                               ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/20"
                               : "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-500/20"
                           }`}
                         >
                            {isEven ? "Quitado" : isOwed ? `A receber: R$ ${formatBRL(netBalance)}` : `Deve: R$ ${formatBRL(Math.abs(netBalance))}`}
                         </span>
                       </div>
                     </div>
                  </div>
                );
              })
            )}
          </div>
        </div>      </div>
      </div>
    </div>
  );
}
