"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Akses ditolak: Kredensial tidak valid.");
      setLoading(false);
    } else {
      // 1. Suntikkan tiket ke Cookie HANYA JIKA BERHASIL LOGIN
      document.cookie = "sb-auth-token=true; path=/; max-age=86400"; 
      
      // 2. Arahkan ke dasbor admin dengan aman tanpa reload paksa
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F110F] px-4 font-sans antialiased">
      <div className="max-w-md w-full bg-[#121412] rounded border border-[#2E3730] shadow-2xl p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-[#C5A059] tracking-[0.2em] uppercase">Nexus Gold</h1>
          <p className="text-xs text-zinc-500 mt-2 uppercase tracking-wider">Secure Back-Office Access</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-[#221818] text-red-400 text-xs text-center border border-red-900/50 rounded-sm uppercase tracking-wide">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">ID Otorisasi (Email)</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] focus:outline-none transition-colors"
              placeholder="admin@nexusgold.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Kunci Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C5A059] text-[#0F110F] font-bold text-xs uppercase tracking-wider rounded py-3.5 mt-4 hover:bg-[#B38F4B] disabled:bg-[#2E3730] disabled:text-zinc-500 transition-colors"
          >
            {loading ? "Memverifikasi Enkripsi..." : "Akses Ruang Kendali"}
          </button>
        </form>
      </div>
    </div>
  );
}