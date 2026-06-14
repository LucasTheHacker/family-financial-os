"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import ProfileView from "./ProfileView";
import { useRouter } from "next/navigation";

export default function MemberManager() {
  const { users, createUser, loading } = useApp();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const router = useRouter();

  // User creation form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pixKey, setPixKey] = useState("");
  
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Por favor, insira um nome");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Por favor, insira um endereço de e-mail válido");
      return;
    }

    try {
      await createUser({
        name: name.trim(),
        email: email.trim(),
        pix_key: pixKey.trim() || undefined,
      });

      setSuccess(`Membro da família "${name}" cadastrado com sucesso!`);
      setName("");
      setEmail("");
      setPixKey("");
    } catch (err: any) {
      setError(err.message || "Falha ao cadastrar membro da família");
    }
  };

  if (selectedUserId) {
    return (
      <ProfileView
        userId={selectedUserId}
        onBack={() => setSelectedUserId(null)}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Members List */}
      <div className="lg:col-span-2 rounded-2xl border border-zinc-200/50 bg-white/50 p-6 dark:border-zinc-800/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-semibold leading-6 text-zinc-900 dark:text-white">Participantes</h3>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Clique em qualquer membro para inspecionar seus gastos e consumos.</p>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nenhum membro encontrado</h4>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 max-w-xs font-medium">
              Crie o perfil da sua família cadastrando o primeiro membro no formulário lateral.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => router.push(`/profile/${user.id}`)}
                className="flex items-center gap-4 rounded-xl bg-zinc-50/50 p-4 border border-zinc-100/50 hover:bg-zinc-100/50 dark:bg-zinc-900/30 dark:border-zinc-800/30 dark:hover:bg-zinc-900/70 transition-all text-left w-full group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-md shadow-indigo-500/10">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                
                <div className="truncate flex-1">
                  <h4 className="text-sm font-semibold text-zinc-850 dark:text-zinc-250 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {user.name}
                  </h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{user.email}</p>
                  
                  {user.pix_key ? (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                      Pix: {user.pix_key}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                      Sem chave Pix cadastrada
                    </span>
                  )}
                </div>

                <div className="text-zinc-400 group-hover:text-indigo-500 transition-colors px-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Creation form */}
      <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-6 dark:border-zinc-800/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
        <h3 className="text-base font-semibold leading-6 text-zinc-900 dark:text-white">Cadastrar Membro da Família</h3>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Adicione um novo participante para acompanhar e dividir despesas.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/20 dark:text-rose-455">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-455">
              {success}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Nome Completo</label>
            <input
              type="text"
              required
              placeholder="Ex: Lucas Santos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Endereço de E-mail</label>
            <input
              type="email"
              required
              placeholder="Ex: lucas@familia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Chave Pix (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: CPF, Telefone ou E-mail"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">Usada para facilitar reembolsos no painel de acerto de contas.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10"
          >
            Cadastrar Membro
          </button>
        </form>
      </div>
    </div>
  );
}
