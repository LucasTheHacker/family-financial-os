import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Central Financeira - Família Batista",
  description: "Gerencie as finanças, contas recorrentes e rateios da família.",
};

import { AuthSyncProvider } from "@/components/auth/AuthSyncProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-300">
        <AuthSyncProvider>
          <AppProvider>
          <Suspense fallback={
            <div className="h-16 border-b border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70"></div>
          }>
            <Navbar />
          </Suspense>
          
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
            {children}
          </main>

          <footer className="border-t border-zinc-200/30 bg-white/40 dark:border-zinc-800/30 dark:bg-zinc-950/40 py-6 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              <p>© {new Date().getFullYear()} Central Financeira - Família Batista. Todos os direitos reservados.</p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-indigo-500 transition-colors">Política de Privacidade</a>
                <span>•</span>
                <a href="#" className="hover:text-indigo-500 transition-colors">Termos de Serviço</a>
              </div>
            </div>
          </footer>
        </AppProvider>
      </AuthSyncProvider>
      </body>
    </html>
  );
}

