"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"profil" | "keamanan" | "platform">("profil");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [buybackSpread, setBuybackSpread] = useState("5");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isFetchingPlatform, setIsFetchingPlatform] = useState(true);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      const { data } = await supabase
        .from("global_settings")
        .select("*")
        .eq("id", 1)
        .single();
        
      if (data) {
        setBuybackSpread(data.buyback_margin.toString());
        setMaintenanceMode(data.maintenance_mode);
      }
      setIsFetchingPlatform(false);
    };
    fetchGlobalSettings();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    if (error) showToast(error.message, "error");
    else showToast("Profil berhasil diperbarui.", "success");
    setIsSubmitting(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Konfirmasi kata sandi tidak cocok.", "error"); return;
    }
    if (newPassword.length < 6) {
      showToast("Kata sandi minimal 6 karakter.", "error"); return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) showToast(error.message, "error");
    else {
      showToast("Kata sandi berhasil diamankan.", "success");
      setNewPassword(""); setConfirmPassword("");
    }
    setIsSubmitting(false);
  };

  const handleUpdatePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const numericMargin = parseFloat(buybackSpread);
    
    const { error } = await supabase
      .from("global_settings")
      .update({
        buyback_margin: isNaN(numericMargin) ? 5.0 : numericMargin,
        maintenance_mode: maintenanceMode,
        updated_at: new Date().toISOString()
      })
      .eq("id", 1);

    if (error) {
      showToast("Gagal menyimpan ke database.", "error");
    } else {
      showToast("Konfigurasi platform berhasil disinkronkan secara global.", "success");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans">
      <div className="border-b border-[#2E3730] pb-6">
        <h2 className="text-2xl font-bold text-zinc-100 font-[family-name:var(--font-playfair)]">Pengaturan Sistem</h2>
        <p className="text-xs text-zinc-500 mt-1">Konfigurasi preferensi administratif, keamanan akses, dan variabel operasional.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <button onClick={() => setActiveTab("profil")} className={`w-full text-left px-5 py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${activeTab === "profil" ? "bg-[#1C221E] border-[#C5A059] text-[#C5A059]" : "bg-[#121412] border-[#2E3730] text-zinc-400 hover:text-zinc-200"}`}>Profil Admin</button>
          <button onClick={() => setActiveTab("keamanan")} className={`w-full text-left px-5 py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${activeTab === "keamanan" ? "bg-[#1C221E] border-[#C5A059] text-[#C5A059]" : "bg-[#121412] border-[#2E3730] text-zinc-400 hover:text-zinc-200"}`}>Akses & Keamanan</button>
          <button onClick={() => setActiveTab("platform")} className={`w-full text-left px-5 py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border flex justify-between items-center ${activeTab === "platform" ? "bg-[#1C221E] border-[#C5A059] text-[#C5A059]" : "bg-[#121412] border-[#2E3730] text-zinc-400 hover:text-zinc-200"}`}>
            Platform Global <span className={`w-1.5 h-1.5 rounded-full ${maintenanceMode ? 'bg-red-500 animate-pulse' : 'bg-[#C5A059]'}`}></span>
          </button>
        </div>

        <div className="flex-1 bg-[#121412] border border-[#2E3730] rounded-xl shadow-lg p-6 md:p-8 animate-fade">
          {activeTab === "profil" && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center gap-6 mb-8 border-b border-[#2E3730] pb-8">
                <div className="w-20 h-20 bg-[#161B18] border border-[#C5A059]/30 rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-2xl font-black text-[#C5A059] font-[family-name:var(--font-playfair)]">{fullName.charAt(0) || "A"}</span>
                </div>
                <div>
                  <h3 className="text-zinc-100 font-bold mb-1">Identitas Kredensial</h3>
                  <p className="text-xs text-zinc-500">Ubah nama tampilan administratif Anda.</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Email Operasional (Locked)</label>
                <input type="text" value={email} disabled className="w-full bg-[#0F110F] border border-[#2E3730] rounded-lg px-4 py-3 text-sm text-zinc-500 cursor-not-allowed font-mono" />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Nama Representatif</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-colors" />
              </div>
              <div className="pt-6 mt-6 border-t border-[#2E3730] flex justify-end">
                <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-50 transition-all">Simpan Profil</button>
              </div>
            </form>
          )}

          {activeTab === "keamanan" && (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="mb-8 border-b border-[#2E3730] pb-6">
                <h3 className="text-zinc-100 font-bold mb-1">Kunci Brankas Administrasi</h3>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Kata Sandi Baru</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-colors font-mono tracking-widest" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Verifikasi Kata Sandi</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-colors font-mono tracking-widest" placeholder="••••••••" />
              </div>
              <div className="pt-6 mt-6 border-t border-[#2E3730] flex justify-end">
                <button type="submit" disabled={isSubmitting || !newPassword || !confirmPassword} className="bg-red-900/30 text-red-500 border border-red-900/50 px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all">Ubah Kata Sandi</button>
              </div>
            </form>
          )}

          {activeTab === "platform" && (
            <form onSubmit={handleUpdatePlatform} className="space-y-8">
              <div className="mb-6 border-b border-[#2E3730] pb-6">
                <h3 className="text-zinc-100 font-bold mb-1">Konfigurasi Variabel Operasional</h3>
                <p className="text-xs text-zinc-500">Kendalikan metrik inti yang memengaruhi front-end dan kalkulasi aset klien.</p>
              </div>

              {isFetchingPlatform ? (
                <div className="animate-pulse flex gap-4">
                  <div className="h-20 bg-[#1C221E] rounded-lg w-full"></div>
                  <div className="h-20 bg-[#1C221E] rounded-lg w-full"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest border-b border-[#2E3730] pb-2">Mesin Finansial</h4>
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Margin Buyback & Likuidasi (%)</label>
                      <div className="relative">
                        <input type="number" step="0.1" value={buybackSpread} onChange={(e) => setBuybackSpread(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] rounded-lg px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:border-[#C5A059] font-mono transition-colors" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">%</span>
                      </div>
                      <p className="text-[9px] text-zinc-600 mt-2 leading-relaxed">Persentase selisih harga dari Spot Global untuk kalkulasi nilai likuidasi klien.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest border-b border-[#2E3730] pb-2">Kontrol Lalu Lintas</h4>
                    <div className={`flex items-start justify-between border rounded-lg p-4 transition-colors ${maintenanceMode ? 'bg-red-950/20 border-red-900/50' : 'bg-[#161B18] border-[#2E3730]'}`}>
                      <div>
                        <label className="block text-xs font-bold text-zinc-200 mb-1">Mode Pemeliharaan</label>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Bekukan Front-End Klien</p>
                      </div>
                      <button type="button" onClick={() => setMaintenanceMode(!maintenanceMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-red-500' : 'bg-zinc-700'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    {maintenanceMode && (
                      <p className="text-[9px] text-red-500 uppercase tracking-widest font-bold animate-pulse text-right">
                        Peringatan: Klien tidak bisa mengakses brankas!
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-[#2E3730] flex justify-end">
                <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-50 transition-all">
                  {isSubmitting ? "Menerapkan Konfigurasi..." : "Otorisasi Perubahan"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}