"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ParticipationCreate } from "@/types";

const parseCurrencyToFloat = (formattedVal: string): number => {
  const clean = formattedVal
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return parseFloat(clean) || 0;
};

const formatBRL = (val: number) => {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function ExpenseManager() {
  const { users, expenses, createExpense, updateExpense, currentCycle, loading } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const expenseId = searchParams.get("id");
  const isEditMode = !!expenseId;

  const [title, setTitle] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [date, setDate] = useState("");
  const [dateDisplay, setDateDisplay] = useState("");
  const [payerId, setPayerId] = useState("");
  const [expenseType, setExpenseType] = useState<"Single" | "Fixed" | "Installment">("Single");
  const [totalInstallments, setTotalInstallments] = useState(3);

  // Split state
  const [splitType, setSplitType] = useState<"equal" | "only-me" | "custom-weight" | "custom-value">("equal");
  const [checkedUsers, setCheckedUsers] = useState<Record<string, boolean>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});

  const [success, setSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Populate data when editing
  useEffect(() => {
    if (isEditMode && expenses.length > 0 && users.length > 0) {
      const expense = expenses.find((exp) => exp.id === expenseId);
      if (expense) {
        setTitle(expense.title);
        const formatted = Number(expense.total_amount).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        });
        setAmountStr(formatted);

        // Date format YYYY-MM-DD
        const d = new Date(expense.date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setDate(`${yyyy}-${mm}-${dd}`);
        setDateDisplay(`${dd}-${mm}-${yyyy}`);

        setPayerId(expense.payer_id);
        setExpenseType(expense.expense_type);
        setTotalInstallments(expense.total_installments || 3);

        // Map participations
        const checked: Record<string, boolean> = {};
        const w: Record<string, string> = {};
        const v: Record<string, string> = {};

        users.forEach((u) => {
          checked[u.id] = false;
          w[u.id] = "1";
          v[u.id] = "0.00";
        });

        let hasCustomValue = false;
        let hasCustomWeight = false;

        expense.participations.forEach((p) => {
          checked[p.user_id] = true;
          if (p.weight !== undefined && p.weight !== null) {
            w[p.user_id] = String(p.weight);
            if (Number(p.weight) !== 1) hasCustomWeight = true;
          }
          if (p.value !== undefined && p.value !== null) {
            v[p.user_id] = Number(p.value).toFixed(2);
            if (Number(p.value) > 0) hasCustomValue = true;
          }
        });

        setCheckedUsers(checked);
        setWeights(w);
        setValues(v);

        if (hasCustomValue) {
          setSplitType("custom-value");
        } else if (hasCustomWeight) {
          setSplitType("custom-weight");
        } else {
          const checkedCount = Object.values(checked).filter(Boolean).length;
          if (checkedCount === 1 && checked[expense.payer_id]) {
            setSplitType("only-me");
          } else {
            setSplitType("equal");
          }
        }
      }
    } else if (!isEditMode && users.length > 0) {
      if (!payerId) setPayerId(users[0].id);
      
      const initialChecked: Record<string, boolean> = {};
      const initialWeights: Record<string, string> = {};
      const initialValues: Record<string, string> = {};
      
      users.forEach((u) => {
        initialChecked[u.id] = true;
        initialWeights[u.id] = "1";
        initialValues[u.id] = "0.00";
      });
      
      setCheckedUsers(initialChecked);
      setWeights(initialWeights);
      setValues(initialValues);

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);
      setDateDisplay(`${dd}-${mm}-${yyyy}`);
    }
  }, [isEditMode, expenseId, expenses, users]);

  // Handle amount formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/\D/g, "");
    if (!cleanValue) {
      setAmountStr("");
      return;
    }
    const cents = parseInt(cleanValue, 10);
    const realValue = cents / 100;
    const formatted = realValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    setAmountStr(formatted);
  };

  // Handle date display mask
  const handleDateDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/\D/g, "");
    if (clean.length > 8) clean = clean.substring(0, 8);
    
    let formatted = "";
    if (clean.length > 0) {
      formatted += clean.substring(0, 2);
    }
    if (clean.length > 2) {
      formatted += "-" + clean.substring(2, 4);
    }
    if (clean.length > 4) {
      formatted += "-" + clean.substring(4, 8);
    }
    setDateDisplay(formatted);

    if (clean.length === 8) {
      const day = clean.substring(0, 2);
      const month = clean.substring(2, 4);
      const year = clean.substring(4, 8);
      setDate(`${year}-${month}-${day}`);
    }
  };

  // Split presets
  const handleSplitPreset = (preset: "equal" | "only-me" | "custom-weight" | "custom-value") => {
    setSplitType(preset);
    
    if (preset === "equal") {
      const updatedChecked: Record<string, boolean> = {};
      const updatedWeights: Record<string, string> = {};
      users.forEach((u) => {
        updatedChecked[u.id] = true;
        updatedWeights[u.id] = "1";
      });
      setCheckedUsers(updatedChecked);
      setWeights(updatedWeights);
    } else if (preset === "only-me") {
      const updatedChecked: Record<string, boolean> = {};
      const updatedWeights: Record<string, string> = {};
      users.forEach((u) => {
        updatedChecked[u.id] = u.id === payerId;
        updatedWeights[u.id] = u.id === payerId ? "1" : "0";
      });
      setCheckedUsers(updatedChecked);
      setWeights(updatedWeights);
    } else if (preset === "custom-weight") {
      const updatedWeights = { ...weights };
      users.forEach((u) => {
        if (checkedUsers[u.id] && (!updatedWeights[u.id] || parseFloat(updatedWeights[u.id]) <= 0)) {
          updatedWeights[u.id] = "1";
        }
      });
      setWeights(updatedWeights);
    } else if (preset === "custom-value") {
      const totalAmount = parseCurrencyToFloat(amountStr);
      const checkedCount = Object.values(checkedUsers).filter(Boolean).length;
      const share = checkedCount > 0 ? (totalAmount / checkedCount).toFixed(2) : "0.00";
      
      const updatedValues = { ...values };
      users.forEach((u) => {
        updatedValues[u.id] = checkedUsers[u.id] ? share : "0.00";
      });
      setValues(updatedValues);
    }
  };

  // Sync "Only Me" if payer changes
  useEffect(() => {
    if (splitType === "only-me") {
      const updatedChecked: Record<string, boolean> = {};
      const updatedWeights: Record<string, string> = {};
      users.forEach((u) => {
        updatedChecked[u.id] = u.id === payerId;
        updatedWeights[u.id] = u.id === payerId ? "1" : "0";
      });
      setCheckedUsers(updatedChecked);
      setWeights(updatedWeights);
    }
  }, [payerId, splitType, users]);

  const totalAmount = parseCurrencyToFloat(amountStr);
  const customValuesSum = users.reduce((sum, u) => {
    if (checkedUsers[u.id]) {
      return sum + (parseFloat(values[u.id]) || 0);
    }
    return sum;
  }, 0);
  
  const customValuesDiff = totalAmount - customValuesSum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    const parsedAmount = parseCurrencyToFloat(amountStr);
    if (parsedAmount <= 0) {
      setFormError("Por favor, insira um valor válido maior que R$ 0,00.");
      return;
    }

    if (!title.trim()) {
      setFormError("Por favor, digite o título.");
      return;
    }

    const checkedUserIds = Object.keys(checkedUsers).filter((id) => checkedUsers[id]);
    if (checkedUserIds.length === 0) {
      setFormError("Selecione pelo menos um participante.");
      return;
    }

    const participations: ParticipationCreate[] = [];

    if (splitType === "equal" || splitType === "only-me" || splitType === "custom-weight") {
      for (const id of checkedUserIds) {
        const weight = parseFloat(weights[id]);
        if (isNaN(weight) || weight <= 0) {
          setFormError("O peso de cada participante deve ser positivo.");
          return;
        }
        participations.push({ user_id: id, weight });
      }
    } else {
      if (Math.abs(customValuesDiff) > 0.02) {
        setFormError(`A soma das parcelas (R$ ${formatBRL(customValuesSum)}) deve ser igual ao valor total (R$ ${formatBRL(totalAmount)}).`);
        return;
      }
      for (const id of checkedUserIds) {
        const val = parseFloat(values[id]);
        if (isNaN(val) || val < 0) {
          setFormError("Os valores das parcelas não podem ser negativos.");
          return;
        }
        participations.push({ user_id: id, value: val });
      }
    }

    const billingCycle = date.substring(0, 7) || currentCycle;

    try {
      if (isEditMode) {
        await updateExpense(expenseId, {
          title,
          total_amount: parsedAmount,
          date: date ? new Date(date).toISOString() : undefined,
          payer_id: payerId,
          expense_type: expenseType,
          billing_cycle: billingCycle,
          total_installments: expenseType === "Installment" ? totalInstallments : undefined,
          participations,
        });
        setSuccess("Rateio atualizado com sucesso!");
      } else {
        await createExpense({
          title,
          total_amount: parsedAmount,
          date: date ? new Date(date).toISOString() : undefined,
          payer_id: payerId,
          expense_type: expenseType,
          billing_cycle: billingCycle,
          total_installments: expenseType === "Installment" ? totalInstallments : undefined,
          participations,
        });
        setSuccess("Rateio registrado com sucesso!");
      }

      setTimeout(() => {
        router.push("/?tab=ledger");
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || "Falha ao processar operação.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-6 dark:border-zinc-800/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-lg space-y-6">
        <div>
          <h3 className="text-lg font-bold leading-6 text-zinc-900 dark:text-white">
            {isEditMode ? "Editar Rateio" : "Novo Rateio"}
          </h3>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {isEditMode ? "Edite os detalhes do rateio e suas participações." : "Preencha os detalhes e selecione a divisão."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/30 animate-shake">
              {formError}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/30">
              {success}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Título</label>
              <input
                type="text"
                required
                placeholder="Ex: Assinatura de TV"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Valor Total</label>
              <input
                type="text"
                required
                placeholder="R$ 0,00"
                value={amountStr}
                onChange={handleAmountChange}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Data de Acerto</label>
              <input
                type="text"
                required
                placeholder="dd-mm-aaaa"
                value={dateDisplay}
                onChange={handleDateDisplayChange}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>

            {/* Payer */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Quem pagou</label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expense Type Options */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Tipo de Rateio</label>
            <div className="flex gap-4 flex-wrap">
              {[
                { type: "Single", label: "Única" },
                { type: "Fixed", label: "Mensal Fixo" },
                { type: "Installment", label: "Parcelado" }
              ].map((opt) => (
                <label key={opt.type} className="inline-flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="expenseType"
                    checked={expenseType === opt.type}
                    onChange={() => setExpenseType(opt.type as any)}
                    className="accent-indigo-600"
                  />
                  <span className="text-zinc-700 dark:text-zinc-300">{opt.label}</span>
                </label>
              ))}
            </div>

            {expenseType === "Installment" && (
              <div className="mt-4 max-w-xs">
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Número de Parcelas</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>
            )}
          </div>

          {/* Participations Section */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Participantes</label>
              
              <div className="flex flex-wrap gap-1">
                {[
                  { preset: "equal", label: "Dividir Igual" },
                  { preset: "only-me", label: "Apenas Eu" },
                  { preset: "custom-weight", label: "Pesos Pers." },
                  { preset: "custom-value", label: "Valores Pers." },
                ].map((btn) => (
                  <button
                    key={btn.preset}
                    type="button"
                    onClick={() => handleSplitPreset(btn.preset as any)}
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all border ${
                      splitType === btn.preset
                        ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-850"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom values validation totals banner */}
            {splitType === "custom-value" && (
              <div className={`text-xs font-semibold rounded-lg p-2 ${
                Math.abs(customValuesDiff) <= 0.02
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
              }`}>
                <span>Total alocado: <strong>R$ {formatBRL(customValuesSum)}</strong> / R$ {formatBRL(totalAmount)}</span>
                {Math.abs(customValuesDiff) > 0.02 && (
                  <span className="ml-2">({customValuesDiff > 0 ? "Faltando" : "Excedendo"} R$ ${formatBRL(Math.abs(customValuesDiff))})</span>
                )}
              </div>
            )}

            <div className="space-y-2">
              {users.map((user) => {
                const isChecked = !!checkedUsers[user.id];

                return (
                  <div key={user.id} className="flex items-center justify-between py-1.5 border-b border-zinc-200/40 dark:border-zinc-800/40">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={splitType === "only-me" && user.id !== payerId}
                        onChange={(e) => {
                          if (splitType === "only-me") return;
                          setCheckedUsers({ ...checkedUsers, [user.id]: e.target.checked });
                        }}
                        className="accent-indigo-600 rounded"
                      />
                      <span className="text-zinc-800 dark:text-zinc-200">{user.name}</span>
                    </label>

                    {isChecked && (splitType === "custom-weight" || splitType === "custom-value") && (
                      <div className="flex items-center gap-2 w-28">
                        {splitType === "custom-weight" ? (
                          <>
                            <span className="text-xs text-zinc-400">Peso:</span>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={weights[user.id] || ""}
                              onChange={(e) => setWeights({ ...weights, [user.id]: e.target.value })}
                              className="w-16 rounded border border-zinc-200 bg-white px-2 py-0.5 text-right text-xs text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                            />
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-zinc-400">R$:</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={values[user.id] || ""}
                              onChange={(e) => setValues({ ...values, [user.id]: e.target.value })}
                              className="w-16 rounded border border-zinc-200 bg-white px-2 py-0.5 text-right text-xs text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/?tab=ledger")}
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (splitType === "custom-value" && Math.abs(customValuesDiff) > 0.02)}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10 disabled:bg-zinc-250 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650"
            >
              {loading ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
