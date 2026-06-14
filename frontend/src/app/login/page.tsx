"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setMessage({
        text: "Link de login enviado! Verifique sua caixa de entrada.",
        type: "success",
      });
    } catch (err: any) {
      setMessage({
        text: err.message || "Erro ao enviar Magic Link. Tente novamente.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setMessage({
        text: err.message || "Erro ao conectar ao Google. Tente novamente.",
        type: "error",
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-200/50 bg-white/70 p-8 shadow-xl backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70 transition-all duration-300">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Central Financeira
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Faça login para gerenciar as finanças da Família Batista
          </p>
        </div>

        {/* Alerts */}
        {message && (
          <div
            className={`rounded-lg p-4 text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-400 border border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Email Magic Link Form */}
        <form className="mt-8 space-y-6" onSubmit={handleMagicLink}>
          <div>
            <label htmlFor="email-address" className="sr-only">
              Endereço de e-mail
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-zinc-950 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:placeholder-zinc-500 text-sm transition-all"
              placeholder="Digite seu e-mail"
              disabled={loading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !email}
              className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Enviando..." : "Entrar com Link Mágico"}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">ou</span>
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>

        {/* Social Authentication */}
        <div>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v2.7h5.38C17.15,14.88,15.79,16.5,13.8,17.4l2.16,1.8C18.6,17.2,21.35,14.4,21.35,11.1z" fill="#4285F4" />
                <path d="M12,20.4c2.7,0,4.96-0.9,6.6-2.4l-2.16-1.8c-1.2,0.8-2.74,1.3-4.44,1.3c-3.42,0-6.3-2.31-7.33-5.4l-2.22,1.7C4.14,17.2,7.74,20.4,12,20.4z" fill="#34A853" />
                <path d="M4.67,14.1c-0.27-0.8-0.42-1.66-0.42-2.55s0.15-1.75,0.42-2.55L2.45,7.3C1.52,9.15,1,11.2,1,13.4s0.52,4.25,1.45,6.1L4.67,14.1z" fill="#FBBC05" />
                <path d="M12,6.6c1.8,0,3.24,0.63,4.5,1.8l2.25-2.25C17.15,4.7,14.7,3.6,12,3.6C7.74,3.6,4.14,6.8,2.45,10.3l2.22,1.7C5.7,8.91,8.58,6.6,12,6.6z" fill="#EA4335" />
              </g>
            </svg>
            Entrar com o Google
          </button>
        </div>

      </div>
    </div>
  );
}
