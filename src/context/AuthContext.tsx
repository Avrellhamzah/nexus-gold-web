"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean; // <-- State baru untuk validasi global
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
    // Fungsi untuk mengecek email di tabel admin_users
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
      
      setIsAdmin(!!data); // Jika data ada = true, jika tidak = false
    };

    // Mengecek sesi saat pertama kali dimuat
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      await checkAdminStatus(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Mendengarkan setiap perubahan status login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      await checkAdminStatus(session?.user ?? null);
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