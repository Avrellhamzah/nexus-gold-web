"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isAdmin: false 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async (currentUser: User | null) => {
      if (!currentUser?.email) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', currentUser.email)
        .single();
      
      setIsAdmin(!!data);
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      await checkAdminStatus(session?.user ?? null);
      
      // --- SINKRONISASI COOKIE (SAAT WEB DIMUAT) ---
      if (session) {
        document.cookie = "sb-auth-token=true; path=/; max-age=86400; SameSite=Lax;";
      }

      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      await checkAdminStatus(session?.user ?? null);
      
      // --- SINKRONISASI COOKIE (SAAT LOGIN / LOGOUT) ---
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Beritahu Middleware bahwa user sudah masuk
        document.cookie = "sb-auth-token=true; path=/; max-age=86400; SameSite=Lax;";
      } else if (event === 'SIGNED_OUT') {
        // Hapus token agar Middleware tahu user sudah keluar
        document.cookie = "sb-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      }

      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);