"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { User } from "@/types";
import ProfileView from "../members/ProfileView";
import { UserAvatar } from "../expenses/ExpenseForm";

export default function ParticipantManager() {
  const { users, createUser, updateUser, deleteUser, loading } = useApp();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPixKey, setEditPixKey] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  // Creation State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Alerts
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
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
        avatar_url: avatarUrl.trim() || undefined,
      });

      setSuccess(`Participante "${name}" cadastrado com sucesso!`);
      setName("");
      setEmail("");
      setPixKey("");
      setAvatarUrl("");
    } catch (err: any) {
      setError(err.message || "Falha ao cadastrar participante");
    }
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPixKey(user.pix_key || "");
    setEditAvatarUrl(user.avatar_url || "");
    setError(null);
    setSuccess(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    setSuccess(null);

    if (!editName.trim()) {
      setError("O nome não pode ficar vazio.");
      return;
    }

    if (!editEmail.trim() || !editEmail.includes("@")) {
      setError("O e-mail inserido é inválido.");
      return;
    }

    try {
      await updateUser(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        pix_key: editPixKey.trim() || "",
        avatar_url: editAvatarUrl.trim() || "",
      });

      setSuccess(`Cadastro de "${editName}" atualizado com sucesso!`);
      setEditingUser(null);
      setEditAvatarUrl("");
    } catch (err: any) {
      setError(err.message || "Falha ao atualizar dados do participante");
    }
  };

  const handleDelete = async (user: User) => {
    setError(null);
    setSuccess(null);

    if (
      confirm(
        `Tem certeza que deseja excluir o participante "${user.name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      try {
        await deleteUser(user.id);
        setSuccess(`Participante "${user.name}" excluído com sucesso.`);
      } catch (err: any) {
        setError(
          err.message ||
            `Não foi possível excluir "${user.name}". Certifique-se de que ele não possui rateios vinculados.`
        );
      }
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
      {/* Participants List */}
      <div className="lg:col-span-2 glass-panel p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-semibold leading-6 text-zinc-900 dark:text-white">
            Participantes
          </h3>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Veja, edite ou remova os participantes cadastrados. <strong>Você pode clicar em qualquer participante para visualizar seu balanço e participações individuais em tempo real.</strong>
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/30">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/30">
            {success}
          </div>
        )}

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Nenhum participante encontrado
            </h4>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 max-w-xs font-medium">
              Cadastre o primeiro participante no formulário lateral.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl bg-zinc-50/50 p-4 border border-zinc-100/50 hover:bg-zinc-100/30 dark:bg-zinc-900/30 dark:border-zinc-800/30 dark:hover:bg-zinc-900/50 transition-all text-left w-full group relative"
              >
                <button
                  onClick={() => setSelectedUserId(user.id)}
                  className="flex items-center gap-4 text-left flex-1 min-w-0 pr-12 cursor-pointer"
                >
                  <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="w-12 h-12" />

                  <div className="truncate">
                    <h4 className="text-sm font-semibold text-zinc-855 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {user.name}
                    </h4>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                      {user.email}
                    </p>

                    {user.pix_key ? (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-zinc-450 dark:text-zinc-500 truncate">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                        Pix: {user.pix_key}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                        Sem chave Pix cadastrada
                      </span>
                    )}
                  </div>
                </button>

                {/* Edit & Delete Actions overlay/aligned on the right */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(user)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:text-zinc-500 dark:hover:text-indigo-400 dark:hover:bg-zinc-800 transition-all"
                    title="Editar dados"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(user)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-zinc-800 transition-all"
                    title="Excluir participante"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation form */}
      <div className="glass-panel p-6 shadow-sm">
        <h3 className="text-base font-semibold leading-6 text-zinc-900 dark:text-white">
          Cadastrar Participante
        </h3>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Adicione um novo integrante ao sistema de rateios.
        </p>

        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Carlos Batista"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Endereço de E-mail
            </label>
            <input
              type="email"
              required
              placeholder="Ex: carlos@batista.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Chave Pix (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: CPF, celular ou e-mail"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              Chave para realização das transferências.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              URL da Foto de Perfil (Opcional)
            </label>
            <input
              type="url"
              placeholder="Ex: https://link.com/imagem.png"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              Deixe em branco para usar um avatar automático baseado no nome.
            </p>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10 disabled:bg-zinc-300 dark:disabled:bg-zinc-800"
          >
            {loading ? "Cadastrando..." : "Cadastrar Participante"}
          </button>
        </form>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl glass-panel p-6 shadow-xl">
            <h3 className="text-base font-semibold leading-6 text-zinc-900 dark:text-white mb-4">
              Editar Dados de {editingUser.name}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Endereço de E-mail
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Chave Pix (Opcional)
                </label>
                <input
                  type="text"
                  value={editPixKey}
                  onChange={(e) => setEditPixKey(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  URL da Foto de Perfil (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="Ex: https://link.com/imagem.png"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>


              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-650 hover:bg-zinc-50 dark:border-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10"
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
