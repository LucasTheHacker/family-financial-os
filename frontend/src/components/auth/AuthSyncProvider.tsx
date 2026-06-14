"use client";

import React, { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Listen to Supabase auth events and synchronize the session token to a cookie.
    // This cookie is read by the Next.js middleware to handle route protection.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const maxAge = session.expires_in || 3600;
        document.cookie = `sb-token=${session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
      } else {
        document.cookie = "sb-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax; Secure";
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
