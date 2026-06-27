"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SoftNotification from "../../components/softNotification";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      
      setNotification("Otorisasi berhasil. Membuka akses brankas...");
      // Arahkan ke beranda atau katalog setelah berhasil login
      setTimeout(() => router.push("/katalog"), 1500); 
    } catch (err: any) {
      setNotification("Kredensial tidak valid. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0F110F] text-zinc-100 bg-[url('https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat bg-blend-overlay animate-page-enter">
      <Link href="/" className="mb-8 font-black text-xl tracking-[0.3em] text-[#C5A059] font-[family-name:var(--font-playfair)] drop-shadow-lg">NEXUS GOLD</Link>
      
      <div className="w-full max-w-md bg-[#121412]/95 backdrop-blur-xl border border-[#2E3730] p-8 rounded-lg shadow-2xl">
        <div className="text-center mb-8 border-b border-[#2E3730] pb-6">
          <h1 className="text-2xl font-[family-name:var(--font-playfair)] mb-2">Otorisasi Identitas</h1>
          <p className="text-xs text-zinc-400">Masuk untuk mengelola portofolio komoditas Anda.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Alamat Email</label>
            <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none transition-colors" placeholder="email@domain.com" />
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Kata Sandi</label>
            </div>
            <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none transition-colors" placeholder="••••••••" />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-[#C5A059] text-[#0F110F] font-bold uppercase tracking-wider text-xs py-4 rounded mt-4 hover:bg-[#B38F4B] transition-all disabled:opacity-50">
            {loading ? "Memverifikasi..." : "Akses Brankas"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 mt-6 pt-6 border-t border-[#2E3730]">
          Belum tergabung sebagai klien? <Link href="/daftar" className="text-[#C5A059] font-bold hover:underline">Registrasi identitas.</Link>
        </p>
      </div>

      {notification && <SoftNotification message={notification} onClose={() => setNotification(null)} />}
    </div>
  );
}