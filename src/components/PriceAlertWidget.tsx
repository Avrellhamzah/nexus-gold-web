"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function PriceAlertWidget({ currentSpotPrice, isDark = true }: { currentSpotPrice: number, isDark?: boolean }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [alerts, setAlerts] = useState<any[]>([]);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAlerts();

    // Radar Realtime: Update daftar jika ada perubahan dari background task
    const channel = supabase
      .channel("realtime:price_alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "price_alerts", filter: `user_id=eq.${user.id}` }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_active", true) // Hanya tampilkan alarm yang masih aktif
      .order("created_at", { ascending: false });
    
    if (data) setAlerts(data);
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !targetPrice) return;

    const numericPrice = parseInt(targetPrice.replace(/\D/g, ""), 10);
    if (isNaN(numericPrice) || numericPrice < 100000) {
      showToast("Masukkan nominal target yang valid.", "error");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("price_alerts").insert([{
      user_id: user.id,
      target_price: numericPrice,
      condition: condition
    }]);

    if (error) {
      showToast("Gagal memasang radar harga.", "error");
    } else {
      showToast("Sistem Peringatan Harga berhasil diaktifkan.", "success");
      setTargetPrice("");
    }
    setIsSubmitting(false);
  };

  const handleDeleteAlert = async (id: string) => {
    const { error } = await supabase.from("price_alerts").delete().eq("id", id);
    if (error) showToast("Gagal menghapus peringatan.", "error");
    else showToast("Peringatan harga dinonaktifkan.", "success");
  };

  // Tema Dinamis
  const theme = {
    bgCard: isDark ? "bg-[#161B18]" : "bg-white",
    bgInput: isDark ? "bg-[#121412]" : "bg-zinc-50",
    border: isDark ? "border-[#2E3730]" : "border-[#E1E5E2]",
    textPrimary: isDark ? "text-zinc-100" : "text-zinc-900",
    textMuted: isDark ? "text-zinc-500" : "text-zinc-400",
  };

  return (
    <div className={`p-5 rounded-xl border shadow-sm flex flex-col h-full ${theme.bgCard} ${theme.border}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${theme.textPrimary}`}>
          <svg className="w-3.5 h-3.5 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          Sistem Alarm Harga
        </h3>
        <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${isDark ? 'bg-[#1C221E] border-[#2E3730] text-[#C5A059]' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
          Terkoneksi
        </span>
      </div>

      {/* Form Tambah Alarm */}
      <form onSubmit={handleAddAlert} className="space-y-3 mb-5">
        <div className="flex gap-2">
          <select 
            value={condition} 
            onChange={(e) => setCondition(e.target.value as "ABOVE" | "BELOW")}
            className={`w-1/3 text-xs font-bold rounded-lg border focus:outline-none focus:border-[#C5A059] px-2 ${theme.bgInput} ${theme.border} ${theme.textPrimary}`}
          >
            <option value="ABOVE">Naik (≥)</option>
            <option value="BELOW">Turun (≤)</option>
          </select>
          <div className="relative w-2/3">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold ${theme.textMuted}`}>Rp</span>
            <input 
              type="text" 
              placeholder="Target..." 
              value={targetPrice}
              onChange={(e) => {
                // Format input ke Rupiah saat mengetik
                const val = e.target.value.replace(/\D/g, "");
                setTargetPrice(val ? new Intl.NumberFormat("id-ID").format(parseInt(val)) : "");
              }}
              className={`w-full pl-9 pr-3 py-2.5 text-sm font-mono font-bold rounded-lg border focus:outline-none focus:border-[#C5A059] ${theme.bgInput} ${theme.border} ${theme.textPrimary}`}
            />
          </div>
        </div>
        <button type="submit" disabled={isSubmitting || !targetPrice} className="w-full bg-[#1C221E] border border-[#C5A059]/50 text-[#C5A059] text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg hover:bg-[#C5A059] hover:text-[#0F110F] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? "Menyinkronkan..." : "+ Pasang Radar"}
        </button>
      </form>

      {/* Daftar Alarm Aktif */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
        {alerts.length === 0 ? (
          <p className={`text-[10px] text-center mt-4 uppercase tracking-widest ${theme.textMuted}`}>Belum ada radar aktif.</p>
        ) : alerts.map((alert) => {
          const isAbove = alert.condition === "ABOVE";
          return (
            <div key={alert.id} className={`flex justify-between items-center p-3 rounded-lg border ${theme.bgInput} ${theme.border} group`}>
              <div>
                <p className={`text-[9px] uppercase tracking-widest font-bold mb-0.5 ${isAbove ? 'text-green-500' : 'text-red-500'}`}>
                  {isAbove ? '▲ JIKA MENYENTUH' : '▼ JIKA TURUN KE'}
                </p>
                <p className={`text-sm font-black font-mono ${theme.textPrimary}`}>
                  Rp {new Intl.NumberFormat("id-ID").format(alert.target_price)}
                </p>
              </div>
              <button 
                onClick={() => handleDeleteAlert(alert.id)} 
                className="w-7 h-7 flex items-center justify-center rounded bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                title="Hapus Radar"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}