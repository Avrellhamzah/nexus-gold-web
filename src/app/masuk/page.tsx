"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

    try {
      // 1. Eksekusi Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. Validasi Peran (RBAC) langsung ke Database
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', data.user.email)
        .single();

      // 3. Smart Routing
      if (adminData) {
        // Jika tercatat di database admin_users, arahkan ke Back-Office
        router.push("/admin");
      } else {
        // Jika tidak, arahkan ke Dasbor Klien reguler
        router.push("/akun");
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Gagal melakukan autentikasi. Periksa kembali kredensial Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F110F] text-zinc-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Ornamen Latar Belakang */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#C5A059] blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#121412] border border-[#2E3730] rounded-2xl shadow-2xl p-8 md:p-10 relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-12 h-12 bg-[#C5A059] flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(197,160,89,0.3)]">
            <span className="text-[#0F110F] font-black text-2xl font-[family-name:var(--font-playfair)]">N</span>
          </div>
          <h1 className="text-2xl font-black tracking-widest text-[#C5A059] uppercase">Nexus Gold</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] mt-2 font-bold">Terminal Autentikasi</p>
        </div>

        {errorMsg && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-500 text-xs p-4 rounded-lg mb-6 text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Alamat Surel</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-lg bg-[#0F110F] border border-[#2E3730] text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059] transition-colors"
              placeholder="klien@korporat.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Kata Sandi</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-lg bg-[#0F110F] border border-[#2E3730] text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] font-bold text-xs uppercase tracking-widest py-4 rounded-lg hover:shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? "Memverifikasi Kredensial..." : "Otorisasi Akses"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500">
          Belum memiliki portofolio? <Link href="/daftar" className="text-[#C5A059] font-bold hover:underline">Registrasi Klien</Link>
        </div>
      </div>
    </div>
  );
}