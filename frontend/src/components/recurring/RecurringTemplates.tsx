"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";

const formatBRL = (val: number) => {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function RecurringTemplates() {
  const {
    users,
    recurringTemplates,
    createRecurringTemplate,
    deleteRecurringTemplate,
    generateRecurringExpenses,
    currentCycle,
    loading,
  } = useApp();

  const [title, setTitle] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [payerId, setPayerId] = useState("");
  
  // Custom Splits State
  const [splitType, setSplitType] = useState<"equal" | "custom-weight" | "custom-value">("equal");
  const [checkedUsers, setCheckedUsers] = useState<Record<string, boolean>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize defaults
  React.useEffect(() => {
    if (users.length > 0) {
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
    }
  }, [users, payerId]);

  const handleSplitPreset = (preset: "equal" | "custom-weight" | "custom-value") => {
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
    } else if (preset === "custom-weight") {
      const updatedWeights = { ...weights };
      users.forEach((u) => {
        if (checkedUsers[u.id] && (!updatedWeights[u.id] || parseFloat(updatedWeights[u.id]) <= 0)) {
          updatedWeights[u.id] = "1";
        }
      });
      setWeights(updatedWeights);
    } else if (preset === "custom-value") {
      const totalAmount = parseFloat(amountStr) || 0;
      const checkedCount = Object.values(checkedUsers).filter(Boolean).length;
      const share = checkedCount > 0 ? (totalAmount / checkedCount).toFixed(2) : "0.00";
      
      const updatedValues = { ...values };
      users.forEach((u) => {
        updatedValues[u.id] = checkedUsers[u.id] ? share : "0.00";
      });
      setValues(updatedValues);
    }
  };

  const totalAmount = parseFloat(amountStr) || 0;
  const customValuesSum = users.reduce((sum, u) => {
    if (checkedUsers[u.id]) {
      return sum + (parseFloat(values[u.id]) || 0);
    }
    return sum;
  }, 0);
  
  const customValuesDiff = totalAmount - customValuesSum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Por favor, insira um valor válido");
      return;
    }

    if (!title.trim()) {
      setError("Por favor, insira um título");
      return;
    }

    const checkedUserIds = Object.keys(checkedUsers).filter((id) => checkedUsers[id]);
    if (checkedUserIds.length === 0) {
      setError("Selecione pelo menos um participante");
      return;
    }

    const participations: any[] = [];

    if (splitType === "equal" || splitType === "custom-weight") {
      for (const id of checkedUserIds) {
        const weight = parseFloat(weights[id]);
        if (isNaN(weight) || weight <= 0) {
          setError("O peso de cada participante deve ser um número positivo.");
          return;
        }
        participations.push({ user_id: id, weight });
      }
    } else {
      // custom-value
      if (Math.abs(customValuesDiff) > 0.02) {
        setError(`A soma das parcelas (R$ ${customValuesSum.toFixed(2)}) deve ser igual ao valor total (R$ ${totalAmount.toFixed(2)}).`);
        return;
      }
      for (const id of checkedUserIds) {
        const val = parseFloat(values[id]);
        if (isNaN(val) || val < 0) {
          setError("Os valores das parcelas não podem ser negativos.");
          return;
        }
        participations.push({ user_id: id, value: val });
      }
    }

    try {
      await createRecurringTemplate({
        title,
        total_amount: parsedAmount,
        payer_id: payerId,
        is_active: true,
        participations,
      });

      setSuccess("Rateio Fixo adicionado!");
      setTitle("");
      setAmountStr("");
      // Reset values
      const resetValues: Record<string, string> = {};
      users.forEach((u) => {
        resetValues[u.id] = "0.00";
      });
      setValues(resetValues);
    } catch (err: any) {
      setError(err.message || "Falha ao criar rateio fixo");
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setSuccess(null);
    setIsGenerating(true);
    try {
      const result = await generateRecurringExpenses(currentCycle);
      setSuccess(`Geradas com sucesso ${result.length} despesas recorrentes para ${currentCycle}!`);
    } catch (err: any) {
      setError(err.message || "Falha ao gerar despesas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este modelo recorrente? Os ciclos futuros não irão gerar esta despesa automaticamente.")) {
      try {
        await deleteRecurringTemplate(id);
        setSuccess("Modelo excluído.");
      } catch (err: any) {
        setError(err.message || "Falha ao excluir modelo");
      }
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Templates List */}
      <div className="lg:col-span-2 rounded-2xl border border-zinc-200/50 bg-white/50 p-6 dark:border-zinc-800/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold leading-6 text-zinc-900 dark:text-white">Rateios Fixos Ativos</h3>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Rateios preenchidos automaticamente no início de cada mês.</p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || isGenerating || recurringTemplates.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/15 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Gerando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.656 48.656 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                </svg>
                Gerar para {currentCycle}
              </>
            )}
          </button>
        </div>

        {recurringTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nenhum modelo recorrente</h4>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 max-w-xs font-medium">
              Crie modelos mensais como assinaturas ou contas de consumo na barra lateral.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
            {recurringTemplates.map((template) => (
              <div key={template.id} className="flex justify-between items-center py-4 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 rounded-xl px-2 transition-all">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{template.title}</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Pago por <strong className="text-zinc-500">{template.payer?.name}</strong> • Dividido com{" "}
                    {template.participations.map((p) => p.user?.name).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    R$ {formatBRL(Number(template.total_amount))}/mês
                  </span>
                  
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-650 dark:hover:bg-rose-950/20 dark:hover:text-rose-455 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation form */}
      <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-6 dark:border-zinc-800/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
        <h3 className="text-base font-semibold leading-6 text-zinc-900 dark:text-white">Criar Rateio Fixo</h3>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Crie um novo rateio mensal fixo.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/25 dark:text-rose-455">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-455">
              {success}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Título</label>
            <input
              type="text"
              required
              placeholder="Ex: Assinatura da Netflix"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Valor (R$/mês)</label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              placeholder="0,00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Pago Por</label>
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

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30 space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Dividir Com</label>
              <div className="flex bg-zinc-100 dark:bg-zinc-850 p-0.5 rounded-lg text-2xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleSplitPreset("equal")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    splitType === "equal"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  Igual
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitPreset("custom-weight")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    splitType === "custom-weight"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  Pesos
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitPreset("custom-value")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    splitType === "custom-value"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  Valores
                </button>
              </div>
            </div>

            {splitType === "custom-value" && (
              <div className="text-2xs font-semibold text-zinc-550 dark:text-zinc-400 bg-white dark:bg-zinc-950 rounded-xl p-2 border border-zinc-200 dark:border-zinc-800 flex justify-between">
                <span>Distribuído: R$ {formatBRL(customValuesSum)} / R$ {formatBRL(totalAmount)}</span>
                <span className={Math.abs(customValuesDiff) > 0.02 ? "text-rose-500" : "text-emerald-500"}>
                  Diferença: R$ {formatBRL(customValuesDiff)}
                </span>
              </div>
            )}

            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between text-sm font-medium gap-4">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={!!checkedUsers[user.id]}
                      onChange={(e) => {
                        const newChecked = { ...checkedUsers, [user.id]: e.target.checked };
                        setCheckedUsers(newChecked);
                        if (!e.target.checked) {
                          if (splitType === "custom-value") {
                            setValues({ ...values, [user.id]: "0.00" });
                          }
                        }
                      }}
                      className="accent-indigo-600 rounded"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">{user.name}</span>
                  </label>

                  {checkedUsers[user.id] && splitType === "custom-weight" && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-450">Peso:</span>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={weights[user.id] || "1"}
                        onChange={(e) => setWeights({ ...weights, [user.id]: e.target.value })}
                        className="w-16 text-center rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </div>
                  )}

                  {checkedUsers[user.id] && splitType === "custom-value" && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-450">R$:</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={values[user.id] || "0.00"}
                        onChange={(e) => setValues({ ...values, [user.id]: e.target.value })}
                        className="w-24 text-right rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10"
          >
            Criar Rateio Fixo
          </button>
        </form>
      </div>
    </div>
  );
}
