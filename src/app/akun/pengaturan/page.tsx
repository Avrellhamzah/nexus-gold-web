"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

export default function ClientSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"profil" | "keamanan" | "notifikasi">("profil");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Profil
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // State Keamanan
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State Preferensi
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setPhone(user.user_metadata?.phone || "");
      setEmail(user.email || "");
      
      // Load preferensi jika ada
      if (user.user_metadata?.preferences) {
        setEmailAlerts(user.user_metadata.preferences.email_alerts ?? true);
        setWhatsappAlerts(user.user_metadata.preferences.whatsapp_alerts ?? false);
      }
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone: phone }
    });

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Identitas portofolio berhasil diperbarui.", "success");
    }
    setIsSubmitting(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Konfirmasi kata sandi tidak cocok.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Kata sandi minimal 6 karakter.", "error");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Kunci brankas Anda berhasil diubah.", "success");
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsSubmitting(false);
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.auth.updateUser({
      data: { 
        preferences: { email_alerts: emailAlerts, whatsapp_alerts: whatsappAlerts } 
      }
    });

    if (error) {
      showToast("Gagal menyimpan preferensi.", "error");
    } else {
      showToast("Preferensi komunikasi berhasil disinkronkan.", "success");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0F110F] text-zinc-100 font-sans selection:bg-[#C5A059] selection:text-[#0F110F]">
      
      {/* Top Navigation */}
      <nav className="border-b border-[#2E3730] bg-[#121412]/80 backdrop-blur-md px-6 py-5 sticky top-0 z-50 flex justify-between items-center">
        <Link href="/akun" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-[#C5A059] flex items-center gap-2 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali ke Brankas
        </Link>
        <div className="font-black text-lg tracking-[0.2em] text-[#C5A059] font-[family-name:var(--font-playfair)] flex items-center gap-3">
          NEXUS GOLD
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="border-b border-[#2E3730] pb-6 mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 font-[family-name:var(--font-playfair)]">Pengaturan Akun</h1>
          <p className="text-sm text-zinc-500 mt-2">Kelola identitas kepemilikan, keamanan akses, dan preferensi komunikasi Anda.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* SIDEBAR NAVIGASI TAB */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab("profil")}
              className={`w-full text-left px-5 py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${activeTab === "profil" ? "bg-[#1C221E] border-[#C5A059] text-[#C5A059]" : "bg-[#121412] border-[#2E3730] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"}`}
            >
              Identitas Personal
            </button>
            <button 
              onClick={() => setActiveTab("keamanan")}
              className={`w-full text-left px-5 py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${activeTab === "keamanan" ? "bg-[#1C221E] border-[#C5A059] text-[#C5A059]" : "bg-[#121412] border-[#2E3730] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"}`}
            >
              Kunci Brankas (Akses)
            </button>
            <button 
              onClick={() => setActiveTab("notifikasi")}
              className={`w-full text-left px-5 py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${activeTab === "notifikasi" ? "bg-[#1C221E] border-[#C5A059] text-[#C5A059]" : "bg-[#121412] border-[#2E3730] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"}`}
            >
              Preferensi Komunikasi
            </button>
          </div>

          {/* AREA KONTEN UTAMA */}
          <div className="flex-1 bg-[#121412] border border-[#2E3730] rounded-xl shadow-lg p-6 md:p-8 animate-fade">
            
            {/* TAB: PROFIL PRIBADI */}
            {activeTab === "profil" && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="mb-8 border-b border-[#2E3730] pb-6">
                  <h3 className="text-zinc-100 font-bold mb-1">Identitas Kepemilikan Aset</h3>
                  <p className="text-xs text-zinc-500">Nama yang tercantum di sini akan digunakan untuk penerbitan E-Certificate kepemilikan emas Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Alamat Email (Permanen)</label>
                    <input 
                      type="email" 
                      value={email} 
                      disabled 
                      className="w-full bg-[#0F110F] border border-[#2E3730] rounded-lg px-4 py-3 text-sm text-zinc-500 cursor-not-allowed font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Nama Lengkap (Sesuai KTP)</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#161B18] border border-[#2E3730] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-colors"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Nomor WhatsApp Aktif</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#161B18] border border-[#2E3730] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-colors"
                      placeholder="0812..."
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#2E3730] flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-50 transition-all">
                    {isSubmitting ? "Menyinkronkan..." : "Simpan Identitas"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB: KEAMANAN AKSES */}
            {activeTab === "keamanan" && (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="mb-8 border-b border-[#2E3730] pb-6">
                  <h3 className="text-zinc-100 font-bold mb-1">Keamanan Brankas Digital</h3>
                  <p className="text-xs text-zinc-500">Pastikan Anda menggunakan kata sandi yang kuat untuk melindungi portofolio aset Anda.</p>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Kata Sandi Baru</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#161B18] border border-[#2E3730] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-colors font-mono tracking-widest"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Konfirmasi Kata Sandi Baru</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#161B18] border border-[#2E3730] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-colors font-mono tracking-widest"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-6 mt-6 border-t border-[#2E3730] flex justify-end">
                  <button type="submit" disabled={isSubmitting || !newPassword || !confirmPassword} className="bg-[#1C221E] text-zinc-300 border border-[#2E3730] hover:border-[#C5A059] hover:text-[#C5A059] px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-all">
                    {isSubmitting ? "Mengamankan..." : "Ubah Kunci Akses"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB: PREFERENSI NOTIFIKASI */}
            {activeTab === "notifikasi" && (
              <form onSubmit={handleUpdatePreferences} className="space-y-6">
                <div className="mb-8 border-b border-[#2E3730] pb-6">
                  <h3 className="text-zinc-100 font-bold mb-1">Preferensi Saluran Komunikasi</h3>
                  <p className="text-xs text-zinc-500">Pilih bagaimana Nexus Gold menghubungi Anda untuk peringatan harga dan pembaruan portofolio.</p>
                </div>

                <div className="space-y-4">
                  {/* Toggle Email */}
                  <div className="flex items-start justify-between bg-[#161B18] border border-[#2E3730] rounded-lg p-5">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200 mb-1">Notifikasi Email</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Peringatan harga (Price Alerts) & Faktur Pembelian</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEmailAlerts(!emailAlerts)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailAlerts ? 'bg-[#C5A059]' : 'bg-[#2E3730]'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Toggle WhatsApp */}
                  <div className="flex items-start justify-between bg-[#161B18] border border-[#2E3730] rounded-lg p-5 opacity-75">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-zinc-200">Notifikasi WhatsApp</h4>
                        <span className="text-[8px] uppercase tracking-widest font-bold bg-[#C5A059]/10 text-[#C5A059] px-2 py-0.5 rounded border border-[#C5A059]/20">Eksklusif VIP</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Akses prioritas dari Concierge & Notifikasi Likuidasi</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setWhatsappAlerts(!whatsappAlerts)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${whatsappAlerts ? 'bg-[#C5A059]' : 'bg-[#2E3730]'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${whatsappAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#2E3730] flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-50 transition-all">
                    {isSubmitting ? "Menyinkronkan..." : "Simpan Preferensi"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}