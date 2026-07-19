"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Expense } from "@/types";

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

export default function ExpenseLedger() {
  const { expenses, users, deleteExpense, updateExpense, loading } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [payerFilter, setPayerFilter] = useState("all");
  const [participantFilter, setParticipantFilter] = useState("all");
  
  // Custom modal for installment deletion confirmation
  const [deleteConfirmExpense, setDeleteConfirmExpense] = useState<Expense | null>(null);
  const [deletingProgress, setDeletingProgress] = useState(false);

  // Edit State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmountStr, setEditAmountStr] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDateDisplay, setEditDateDisplay] = useState("");
  const [editPayerId, setEditPayerId] = useState("");
  const [editExpenseType, setEditExpenseType] = useState<"Single" | "Fixed" | "Installment">("Single");
  const [editTotalInstallments, setEditTotalInstallments] = useState(3);

  // Edit Split State
  const [editSplitType, setEditSplitType] = useState<"equal" | "only-me" | "custom-weight" | "custom-value">("equal");
  const [editCheckedUsers, setEditCheckedUsers] = useState<Record<string, boolean>>({});
  const [editWeights, setEditWeights] = useState<Record<string, string>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const [editError, setEditError] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/\D/g, "");
    if (!cleanValue) {
      setEditAmountStr("");
      return;
    }
    const cents = parseInt(cleanValue, 10);
    const realValue = cents / 100;
    const formatted = realValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    setEditAmountStr(formatted);
  };

  const handleEditDateDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setEditDateDisplay(formatted);

    if (clean.length === 8) {
      const day = clean.substring(0, 2);
      const month = clean.substring(2, 4);
      const year = clean.substring(4, 8);
      setEditDate(`${year}-${month}-${day}`);
    }
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditTitle(expense.title);
    
    // Mask currency initial value
    const formatted = Number(expense.total_amount).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    setEditAmountStr(formatted);
    
    // Date formatting YYYY-MM-DD for date input
    const d = new Date(expense.date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setEditDate(`${yyyy}-${mm}-${dd}`);
    setEditDateDisplay(`${dd}-${mm}-${yyyy}`);
    
    setEditPayerId(expense.payer_id);
    setEditExpenseType(expense.expense_type);
    setEditTotalInstallments(expense.total_installments || 3);

    // Initial Split setup
    const checked: Record<string, boolean> = {};
    const weights: Record<string, string> = {};
    const values: Record<string, string> = {};

    // Default init for all users
    users.forEach((u) => {
      checked[u.id] = false;
      weights[u.id] = "1";
      values[u.id] = "0.00";
    });

    let hasCustomValue = false;
    let hasCustomWeight = false;

    expense.participations.forEach((p) => {
      checked[p.user_id] = true;
      if (p.weight !== undefined && p.weight !== null) {
        weights[p.user_id] = String(p.weight);
        if (Number(p.weight) !== 1) {
          hasCustomWeight = true;
        }
      }
      if (p.value !== undefined && p.value !== null) {
        values[p.user_id] = Number(p.value).toFixed(2);
        if (Number(p.value) > 0) {
          hasCustomValue = true;
        }
      }
    });

    setEditCheckedUsers(checked);
    setEditWeights(weights);
    setEditValues(values);

    if (hasCustomValue) {
      setEditSplitType("custom-value");
    } else if (hasCustomWeight) {
      setEditSplitType("custom-weight");
    } else {
      // Check if it's "Only Me"
      const checkedCount = Object.values(checked).filter(Boolean).length;
      if (checkedCount === 1 && checked[expense.payer_id]) {
        setEditSplitType("only-me");
      } else {
        setEditSplitType("equal");
      }
    }

    setEditError(null);
  };

  const handleSplitPreset = (preset: "equal" | "only-me" | "custom-weight" | "custom-value") => {
    setEditSplitType(preset);
    
    if (preset === "equal") {
      const updatedChecked: Record<string, boolean> = {};
      const updatedWeights: Record<string, string> = {};
      users.forEach((u) => {
        updatedChecked[u.id] = true;
        updatedWeights[u.id] = "1";
      });
      setEditCheckedUsers(updatedChecked);
      setEditWeights(updatedWeights);
    } else if (preset === "only-me") {
      const updatedChecked: Record<string, boolean> = {};
      const updatedWeights: Record<string, string> = {};
      users.forEach((u) => {
        updatedChecked[u.id] = u.id === editPayerId;
        updatedWeights[u.id] = u.id === editPayerId ? "1" : "0";
      });
      setEditCheckedUsers(updatedChecked);
      setEditWeights(updatedWeights);
    } else if (preset === "custom-weight") {
      const updatedWeights = { ...editWeights };
      users.forEach((u) => {
        if (editCheckedUsers[u.id] && (!updatedWeights[u.id] || parseFloat(updatedWeights[u.id]) <= 0)) {
          updatedWeights[u.id] = "1";
        }
      });
      setEditWeights(updatedWeights);
    } else if (preset === "custom-value") {
      const totalAmount = parseCurrencyToFloat(editAmountStr);
      const checkedCount = Object.values(editCheckedUsers).filter(Boolean).length;
      const share = checkedCount > 0 ? (totalAmount / checkedCount).toFixed(2) : "0.00";
      
      const updatedValues = { ...editValues };
      users.forEach((u) => {
        updatedValues[u.id] = editCheckedUsers[u.id] ? share : "0.00";
      });
      setEditValues(updatedValues);
    }
  };

  // Sync "Only Me" if payer changes during edit
  React.useEffect(() => {
    if (editSplitType === "only-me" && editingExpense) {
      const updatedChecked: Record<string, boolean> = {};
      const updatedWeights: Record<string, string> = {};
      users.forEach((u) => {
        updatedChecked[u.id] = u.id === editPayerId;
        updatedWeights[u.id] = u.id === editPayerId ? "1" : "0";
      });
      setEditCheckedUsers(updatedChecked);
      setEditWeights(updatedWeights);
    }
  }, [editPayerId, editSplitType, users, editingExpense]);

  const editTotalAmount = parseCurrencyToFloat(editAmountStr);
  const editCustomValuesSum = users.reduce((sum, u) => {
    if (editCheckedUsers[u.id]) {
      return sum + (parseFloat(editValues[u.id]) || 0);
    }
    return sum;
  }, 0);
  
  const editCustomValuesDiff = editTotalAmount - editCustomValuesSum;

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    setEditError(null);

    const parsedAmount = parseCurrencyToFloat(editAmountStr);
    if (parsedAmount <= 0) {
      setEditError("Por favor, insira um valor válido maior que R$ 0,00.");
      return;
    }

    if (!editTitle.trim()) {
      setEditError("Por favor, digite o título.");
      return;
    }

    // Compile participations
    const checkedUserIds = Object.keys(editCheckedUsers).filter((id) => editCheckedUsers[id]);
    if (checkedUserIds.length === 0) {
      setEditError("Selecione ao menos um participante.");
      return;
    }

    const participations: any[] = [];

    if (editSplitType === "equal" || editSplitType === "only-me" || editSplitType === "custom-weight") {
      for (const id of checkedUserIds) {
        const weight = parseFloat(editWeights[id]);
        if (isNaN(weight) || weight <= 0) {
          setEditError("O peso de cada participante deve ser um número positivo.");
          return;
        }
        participations.push({ user_id: id, weight });
      }
    } else {
      // custom-value
      if (Math.abs(editCustomValuesDiff) > 0.02) {
        setEditError(`A soma das parcelas (R$ ${formatBRL(editCustomValuesSum)}) deve ser igual ao valor total (R$ ${formatBRL(editTotalAmount)}).`);
        return;
      }
      for (const id of checkedUserIds) {
        const val = parseFloat(editValues[id]);
        if (isNaN(val) || val < 0) {
          setEditError("Os valores das parcelas não podem ser negativos.");
          return;
        }
        participations.push({ user_id: id, value: val });
      }
    }

    const billingCycle = editDate.substring(0, 7);

    try {
      await updateExpense(editingExpense.id, {
        title: editTitle.trim(),
        total_amount: parsedAmount,
        date: editDate ? new Date(editDate).toISOString() : undefined,
        payer_id: editPayerId,
        expense_type: editExpenseType,
        billing_cycle: billingCycle,
        total_installments: editExpenseType === "Installment" ? editTotalInstallments : undefined,
        participations,
      });

      setEditingExpense(null);
    } catch (err: any) {
      setEditError(err.message || "Falha ao salvar alterações.");
    }
  };

  const handleOpenDelete = (expense: Expense) => {
    if (confirm(`Tem certeza de que deseja excluir a despesa "${expense.title}"?`)) {
      performDelete(expense.id);
    }
  };

  const performDelete = async (id: string) => {
    setDeletingProgress(true);
    try {
      await deleteExpense(id);
      setDeleteConfirmExpense(null);
    } catch (err: any) {
      alert(err.message || "Falha ao excluir despesa");
    } finally {
      setDeletingProgress(false);
    }
  };

  // Filter expenses based on search, payer, and participant selection
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayer = payerFilter === "all" || expense.payer_id === payerFilter;
    const matchesParticipant =
      participantFilter === "all" ||
      expense.participations.some((p) => p.user_id === participantFilter);

    return matchesSearch && matchesPayer && matchesParticipant;
  });

  const totalFilteredRateios = filteredExpenses.reduce(
    (sum, exp) => sum + Number(exp.total_amount),
    0
  );

  const totalFilteredParticipations = filteredExpenses.reduce((sum, exp) => {
    if (participantFilter === "all") {
      return sum + exp.participations.reduce((pSum, p) => pSum + Number(p.value || 0), 0);
    }
    const userPart = exp.participations.find((p) => p.user_id === participantFilter);
    return sum + (userPart ? Number(userPart.value || 0) : 0);
  }, 0);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      // Adjust for time zone offset to avoid off-by-one errors
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
      {/* Search & Filters */}
      <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-4 dark:border-zinc-800/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          {/* Filter by Payer */}
          <div>
            <select
              value={payerFilter}
              onChange={(e) => setPayerFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="all">Pago por: Todos</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  Pago por: {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Participant */}
          <div>
            <select
              value={participantFilter}
              onChange={(e) => setParticipantFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="all">Participante: Qualquer um</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  Participante: {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Ledger List */}
      <div className="rounded-2xl border border-zinc-200/50 bg-white/50 overflow-hidden dark:border-zinc-800/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold leading-6 text-zinc-900 dark:text-white">Lista de Rateios</h3>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Exibindo atualmente {filteredExpenses.length} itens filtrados.</p>
          </div>
          
          <div className="flex gap-4 self-start sm:self-center">
            <div className="text-right">
              <span className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Soma dos Rateios</span>
              <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                R$ {formatBRL(totalFilteredRateios)}
              </span>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 self-center"></div>
            <div className="text-right">
              <span className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                {participantFilter === "all" ? "Soma das Participações" : `Parcela de: ${users.find(u => u.id === participantFilter)?.name || "Membro"}`}
              </span>
              <span className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">
                R$ {formatBRL(totalFilteredParticipations)}
              </span>
            </div>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nenhuma despesa encontrada</h4>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 max-w-xs">
              Nenhum registro correspondente para este ciclo. Tente modificar os filtros ou crie uma nova despesa.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
            {filteredExpenses.map((expense) => {
              const payerName = expense.payer?.name || "Desconhecido";

              return (
                <div key={expense.id} className="group relative flex items-center justify-between p-4 sm:p-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all">
                  <div className="flex items-start gap-4">
                    {/* Expense Icon / Indicator */}
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                      expense.expense_type === "Installment"
                        ? "bg-gradient-to-tr from-violet-500 to-fuchsia-500 shadow-md shadow-violet-500/10"
                        : expense.expense_type === "Fixed"
                        ? "bg-gradient-to-tr from-cyan-500 to-blue-500 shadow-md shadow-cyan-500/10"
                        : "bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/10"
                    }`}>
                      {expense.expense_type === "Installment" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                        </svg>
                      ) : expense.expense_type === "Fixed" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-1.921-.659-1.172-.879-1.172-2.303 0-3.182 1.171-.879 3.07-.879 4.242 0 .88.66.88 1.885 0 2.544" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{expense.title}</span>
                        
                        {/* Type Badges */}
                        {expense.expense_type === "Installment" && (
                          <span className="inline-flex items-center rounded-full bg-fuchsia-50 px-1.5 py-0.5 text-[10px] font-semibold text-fuchsia-700 ring-1 ring-inset ring-fuchsia-700/10 dark:bg-fuchsia-950/30 dark:text-fuchsia-400">
                            Parcela {expense.installment_number}/{expense.total_installments}
                          </span>
                        )}
                        {expense.expense_type === "Fixed" && (
                          <span className="inline-flex items-center rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-inset ring-cyan-700/10 dark:bg-cyan-950/30 dark:text-cyan-400">
                            Fixo Mensal
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 flex-wrap">
                        <span>Pago por <strong className="text-zinc-600 dark:text-zinc-300">{payerName}</strong></span>
                        <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                        <span>{formatDate(expense.date)}</span>
                        <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                        
                        {/* Participations Summary */}
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <span>Dividido com:</span>
                          {expense.participations.map((p, idx) => {
                            const name = p.user?.name || "Usuário";
                            const colors = [
                              "bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30",
                              "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30",
                              "bg-violet-50 text-violet-700 border-violet-200/50 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/30",
                              "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30",
                              "bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30",
                              "bg-sky-50 text-sky-700 border-sky-200/50 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/30",
                            ];
                            const charCodeSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
                            const colorClass = colors[charCodeSum % colors.length];

                            return (
                              <span
                                key={p.user_id || idx}
                                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs sm:text-sm font-semibold border ${colorClass}`}
                              >
                                {name}
                              </span>
                            );
                          })}
                        </span>
                      </div>

                      {/* Validation Indicator */}
                      {(() => {
                        const participationsSum = expense.participations.reduce(
                          (sum, p) => sum + Number(p.value || 0),
                          0
                        );
                        const totalAmount = Number(expense.total_amount);
                        const diff = Math.abs(totalAmount - participationsSum);
                        const isBalanced = diff <= 0.02;

                        return (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-xs">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isBalanced ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
                              }`}
                              title={isBalanced ? "Soma confere" : "Valor divergente"}
                            ></span>
                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                              Soma das participações:{" "}
                              <strong className={isBalanced ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                R$ {participationsSum.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </strong>{" "}
                              de R$ {totalAmount.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            {!isBalanced && (
                              <span className="text-[10px] text-rose-500 font-bold border border-rose-200/50 bg-rose-50/50 px-1 py-0.5 rounded dark:bg-rose-950/20 dark:border-rose-900/30">
                                Diferença: R$ {formatBRL(diff)}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Amount */}
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                        R$ {Number(expense.total_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(expense)}
                        disabled={loading}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:text-zinc-500 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 transition-all"
                        title="Editar Rateio"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleOpenDelete(expense)}
                        disabled={loading}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-650 dark:hover:bg-rose-950/20 dark:hover:text-rose-455 transition-all"
                        title="Excluir Rateio"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Custom Modal for editing expense */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 my-8">
            <h3 className="text-base font-semibold leading-6 text-zinc-900 dark:text-white mb-4">
              Editar Rateio: {editingExpense.title}
            </h3>

            {editError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/30 mb-4">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Título</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Valor Total</label>
                  <input
                    type="text"
                    required
                    value={editAmountStr}
                    onChange={handleAmountChange}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Data de Acerto do Rateio</label>
                  <input
                    type="text"
                    required
                    placeholder="dd-mm-aaaa"
                    value={editDateDisplay}
                    onChange={handleEditDateDisplayChange}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Payer */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Quem pagou</label>
                  <select
                    value={editPayerId}
                    onChange={(e) => setEditPayerId(e.target.value)}
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
                    { type: "Single", label: "Rateio Único" },
                    { type: "Fixed", label: "Rateio Fixo" },
                    { type: "Installment", label: "Parcelado" }
                  ].map((opt) => (
                    <label key={opt.type} className="inline-flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="editExpenseType"
                        checked={editExpenseType === opt.type}
                        onChange={() => setEditExpenseType(opt.type as any)}
                        className="accent-indigo-600"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>

                {editExpenseType === "Installment" && (
                  <div className="mt-4 max-w-xs">
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Número de Parcelas (Meses)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={editTotalInstallments}
                      onChange={(e) => setEditTotalInstallments(parseInt(e.target.value) || 1)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                    />
                  </div>
                )}
              </div>

              {/* Split Participants */}
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Participantes do Rateio</label>
                  
                  {/* Quick buttons */}
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
                          editSplitType === btn.preset
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900"
                            : "bg-white text-zinc-650 border-zinc-200 hover:bg-zinc-55 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-850"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom values total helper */}
                {editSplitType === "custom-value" && (
                  <div className={`text-xs font-semibold rounded-lg p-2 ${
                    Math.abs(editCustomValuesDiff) <= 0.02
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                  }`}>
                    <span>Total alocado: <strong>R$ {formatBRL(editCustomValuesSum)}</strong> / R$ {formatBRL(editTotalAmount)}</span>
                    {Math.abs(editCustomValuesDiff) > 0.02 && (
                      <span className="ml-2">({editCustomValuesDiff > 0 ? "Faltando" : "Excedendo"} R$ ${formatBRL(Math.abs(editCustomValuesDiff))})</span>
                    )}
                  </div>
                )}

                {/* Member split list */}
                <div className="space-y-2">
                  {users.map((user) => {
                    const isChecked = !!editCheckedUsers[user.id];

                    return (
                      <div key={user.id} className="flex items-center justify-between py-1.5 border-b border-zinc-200/40 dark:border-zinc-800/40">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={editSplitType === "only-me" && user.id !== editPayerId}
                            onChange={(e) => {
                              if (editSplitType === "only-me") return;
                              setEditCheckedUsers({ ...editCheckedUsers, [user.id]: e.target.checked });
                            }}
                            className="accent-indigo-600 rounded"
                          />
                          <span className="text-zinc-800 dark:text-zinc-200">{user.name}</span>
                        </label>

                        {isChecked && (editSplitType === "custom-weight" || editSplitType === "custom-value") && (
                          <div className="flex items-center gap-2 w-28">
                            {editSplitType === "custom-weight" ? (
                              <>
                                <span className="text-xs text-zinc-400">Peso:</span>
                                <input
                                  type="number"
                                  min="0.1"
                                  step="any"
                                  value={editWeights[user.id] || ""}
                                  onChange={(e) => setEditWeights({ ...editWeights, [user.id]: e.target.value })}
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
                                  value={editValues[user.id] || ""}
                                  onChange={(e) => setEditValues({ ...editValues, [user.id]: e.target.value })}
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

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-150/40 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-650 hover:bg-zinc-50 dark:border-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || (editSplitType === "custom-value" && Math.abs(editCustomValuesDiff) > 0.02)}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800"
                >
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
