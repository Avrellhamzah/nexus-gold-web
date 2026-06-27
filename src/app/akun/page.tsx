"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import LiveTicker from "../../components/LiveTicker";
import CertificateGenerator from "../../components/CertificateGenerator";
import { createPortal } from "react-dom";
import VIPConcierge from "../../components/VIPConcierge";
import TradingViewChart from "../../components/TradingViewChart";
import PriceAlertWidget from "../../components/PriceAlertWidget";

export default function AkunPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"portofolio" | "riwayat" | "kyc">("portofolio");
  
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [productDb, setProductDb] = useState<any[]>([]); 
  const [goldAnalysis, setGoldAnalysis] = useState<any>(null);
  const [isChartOpen, setIsChartOpen] = useState(false);

  // --- STATE UI CEREMONY ---
  const [certModal, setCertModal] = useState({ isOpen: false, invoice: null as any });
  const [animateTab, setAnimateTab] = useState(false);

  // --- STATE KYC & UNBOXING ---
  const [kycRecord, setKycRecord] = useState<any | null>(null);
  const [kycFullName, setKycFullName] = useState("");
  const [kycIdNumber, setKycIdNumber] = useState("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  const [selectedInvoiceForUnboxing, setSelectedInvoiceForUnboxing] = useState<any | null>(null);
  const [unboxingFile, setUnboxingFile] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // --- STATE PEMBAYARAN MANUAL (BUKTI TRANSFER) ---
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  useEffect(() => {
    setAnimateTab(true);
    const timer = setTimeout(() => setAnimateTab(false), 500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // --- FUNGSI SCROLL LOCK YANG LEBIH KUAT (TERMASUK MODAL PEMBAYARAN) ---
  useEffect(() => {
    if (certModal.isOpen || selectedInvoiceForUnboxing || selectedInvoiceForPayment) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "unset";
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.documentElement.style.overflow = "unset";
      document.body.style.overflow = "unset";
    };
  }, [certModal.isOpen, selectedInvoiceForUnboxing, selectedInvoiceForPayment]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try { const res = await fetch("/api/harga-emas"); setGoldAnalysis(await res.json()); } catch (err) {}
    };
    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyData = async () => {
    setIsLoading(true);
    try {
      const { data: invData } = await supabase.from("invoices").select("*, invoice_items(*)").eq("user_id", user?.id).order("created_at", { ascending: false });
      setTransactions(invData || []);

      const { data: kycData } = await supabase.from("kyc_submissions").select("*").eq("user_id", user?.id).single();
      if (kycData) { setKycRecord(kycData); setKycFullName(kycData.full_name); setKycIdNumber(kycData.id_number); }

      const { data: prodData } = await supabase.from("products").select("id, weight_grams");
      if (prodData) setProductDb(prodData);

      const { data: bankData } = await supabase.from("bank_accounts").select("*").eq("is_active", true);
      if (bankData) setBankAccounts(bankData);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("nexus-theme");
    if (savedTheme === "dark") setIsDark(true);
  }, []);

  useEffect(() => { if (mounted && !authLoading && !user) router.push("/masuk"); }, [user, authLoading, mounted, router]);
  useEffect(() => { if (user) fetchMyData(); }, [user]);

  // --- FUNGSI TEMA BANK DINAMIS ---
  const getBankStyle = (bankName: string) => {
    const name = bankName.toLowerCase();
    if (name.includes('bca')) {
      return { border: 'group-hover:border-blue-500/50', bgIcon: 'bg-blue-500/10', textIcon: 'text-blue-500', badge: 'bg-blue-900/30 text-blue-400 border-blue-900/50', logoText: 'BCA' };
    }
    if (name.includes('mandiri')) {
      return { border: 'group-hover:border-yellow-500/50', bgIcon: 'bg-yellow-500/10', textIcon: 'text-yellow-500', badge: 'bg-yellow-900/30 text-yellow-500 border-yellow-900/50', logoText: 'MANDIRI' };
    }
    if (name.includes('bni')) {
      return { border: 'group-hover:border-orange-500/50', bgIcon: 'bg-orange-500/10', textIcon: 'text-orange-500', badge: 'bg-orange-900/30 text-orange-400 border-orange-900/50', logoText: 'BNI' };
    }
    if (name.includes('bri')) {
      return { border: 'group-hover:border-blue-400/50', bgIcon: 'bg-blue-400/10', textIcon: 'text-blue-400', badge: 'bg-blue-900/30 text-blue-400 border-blue-900/50', logoText: 'BRI' };
    }
    // Default Style (Nexus Gold)
    return { border: 'group-hover:border-[#C5A059]/50', bgIcon: 'bg-[#C5A059]/10', textIcon: 'text-[#C5A059]', badge: 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20', logoText: 'BANK' };
  };

  const { portfolio, totalInvested, totalGrams, currentLiquidationValue, unrealizedProfit, roiPercentage } = useMemo(() => {
    let invested = 0; let grams = 0; const ownedAssetsMap = new Map();
    const spotPricePerGram = goldAnalysis?.rawGramPrice || 1361639;
    const spreadBuyback = 0.95; 
    const actualBuybackPrice = spotPricePerGram * spreadBuyback;

    transactions.forEach((inv) => {
      if (inv.status === "SELESAI") { 
        inv.invoice_items?.forEach((item: any) => {
          invested += (item.price * item.quantity);
          const prodRef = productDb.find(p => p.id === item.product_id);
          const weight = prodRef?.weight_grams || (parseFloat(item.product_name.match(/(\d+(?:\.\d+)?)g/i)?.[1]) || 0);
          grams += (weight * item.quantity);

          if (ownedAssetsMap.has(item.product_name)) {
            const existing = ownedAssetsMap.get(item.product_name);
            existing.quantity += item.quantity;
            existing.totalWeight += (weight * item.quantity);
          } else {
            ownedAssetsMap.set(item.product_name, { id: item.id, name: item.product_name, quantity: item.quantity, totalWeight: (weight * item.quantity) });
          }
        });
      }
    });

    const currentVal = grams * actualBuybackPrice;
    return {
      portfolio: Array.from(ownedAssetsMap.values()), totalInvested: invested, totalGrams: grams,
      currentLiquidationValue: currentVal, unrealizedProfit: currentVal - invested, roiPercentage: invested > 0 ? ((currentVal - invested) / invested) * 100 : 0,
    };
  }, [transactions, productDb, goldAnalysis]);

  const toggleTheme = () => { const newTheme = !isDark; setIsDark(newTheme); localStorage.setItem("nexus-theme", newTheme ? "dark" : "light"); };
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };
  
  // --- FUNGSI UNGGAH BUKTI TRANSFER MANUAL ---
  const handleUploadPaymentProof = async () => {
    if (!selectedInvoiceForPayment || !paymentProofFile) return;

    if (paymentProofFile.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB.");
      return;
    }

    setIsUploadingPayment(true);
    try {
      const fileExt = paymentProofFile.name.split('.').pop();
      const fileName = `${user?.id}_${selectedInvoiceForPayment.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from("payment_proofs").upload(fileName, paymentProofFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("payment_proofs").getPublicUrl(fileName);

      const { error: updateError } = await supabase.from("invoices")
        .update({ 
          payment_proof_url: publicUrlData.publicUrl,
          status: "PROSES VERIFIKASI"
        })
        .eq("id", selectedInvoiceForPayment.id);
        
      if (updateError) throw updateError;

      // Update UI seketika tanpa harus refresh
      setTransactions(transactions.map(inv => 
        inv.id === selectedInvoiceForPayment.id 
          ? { ...inv, status: 'PROSES VERIFIKASI', payment_proof_url: publicUrlData.publicUrl } 
          : inv
      ));
      
      setSelectedInvoiceForPayment(null);
      setPaymentProofFile(null);
      alert("Bukti transfer berhasil dikirim. Menunggu verifikasi Admin.");

    } catch (err) {
      console.error(err);
      alert("Sistem gagal mengunggah dokumen. Pastikan koneksi stabil.");
    } finally {
      setIsUploadingPayment(false);
    }
  };

  const handleUploadUnboxing = async () => {
    if (!selectedInvoiceForUnboxing || !unboxingFile) return;

    if (unboxingFile.size > 50 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal unggahan adalah 50MB.");
      return;
    }

    setIsUploadingProof(true);
    try {
      const fileExt = unboxingFile.name.split('.').pop();
      const fileName = `${selectedInvoiceForUnboxing.invoice_number}-unboxing-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('delivery_proofs').upload(fileName, unboxingFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('delivery_proofs').getPublicUrl(fileName);

      const { error: updateError } = await supabase.from('invoices')
        .update({ status: 'MENUNGGU TINJAUAN', unboxing_proof_url: publicUrlData.publicUrl })
        .eq('id', selectedInvoiceForUnboxing.id);
      if (updateError) throw updateError;

      setTransactions(transactions.map(inv => 
        inv.id === selectedInvoiceForUnboxing.id 
          ? { ...inv, status: 'MENUNGGU TINJAUAN', unboxing_proof_url: publicUrlData.publicUrl } 
          : inv
      ));
      setSelectedInvoiceForUnboxing(null);
      setUnboxingFile(null);
      alert("Terima kasih. Bukti serah-terima telah diamankan di brankas digital.");

    } catch (err) {
      console.error(err);
      alert("Sistem gagal mengunggah bukti.");
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if ((!kycRecord || kycRecord.status === 'REJECTED') && (!idCardFile || !selfieFile)) {
      alert("Mohon unggah foto KTP dan Selfie Verifikasi Anda.");
      return;
    }

    if ((idCardFile && idCardFile.size > 10 * 1024 * 1024) || (selfieFile && selfieFile.size > 10 * 1024 * 1024)) {
      alert("Ukuran maksimal setiap file adalah 10MB.");
      return;
    }

    setIsSubmittingKyc(true);
    try {
      let finalIdCardPath = kycRecord?.id_card_path;
      let finalSelfiePath = kycRecord?.selfie_path;

      if (idCardFile) {
        const idExt = idCardFile.name.split('.').pop();
        const idName = `${user.id}-ktp-${Date.now()}.${idExt}`;
        const { error: idErr } = await supabase.storage.from('kyc_documents').upload(idName, idCardFile);
        if (idErr) throw idErr;
        finalIdCardPath = idName;
      }

      if (selfieFile) {
        const selfieExt = selfieFile.name.split('.').pop();
        const selfieName = `${user.id}-selfie-${Date.now()}.${selfieExt}`;
        const { error: selfieErr } = await supabase.storage.from('kyc_documents').upload(selfieName, selfieFile);
        if (selfieErr) throw selfieErr;
        finalSelfiePath = selfieName;
      }

      const { error: dbError } = await supabase.from('kyc_submissions').upsert({
        user_id: user.id,
        full_name: kycFullName,
        id_number: kycIdNumber,
        id_card_path: finalIdCardPath,
        selfie_path: finalSelfiePath,
        status: 'PENDING',
        rejection_reason: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (dbError) throw dbError;

      alert("Dokumen KYC berhasil dikirim. Tim Kepatuhan akan segera meninjau pengajuan Anda.");
      fetchMyData();

    } catch (err: any) {
      console.error(err);
      alert("Gagal mengirim dokumen: " + err.message);
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "MENUNGGU PEMBAYARAN": return isDark ? "text-yellow-500 border-yellow-700/50 bg-yellow-900/10" : "text-yellow-700 border-yellow-300 bg-yellow-50";
      case "PROSES VERIFIKASI": return isDark ? "text-blue-400 border-blue-700/50 bg-blue-900/10" : "text-blue-700 border-blue-300 bg-blue-50";
      case "DIKIRIM": return isDark ? "text-purple-400 border-purple-700/50 bg-purple-900/10" : "text-purple-700 border-purple-300 bg-purple-50";
      case "LUNAS":
      case "SELESAI": return isDark ? "text-green-400 border-green-700/50 bg-green-900/10" : "text-green-700 border-green-300 bg-green-50";
      case "BATAL": return isDark ? "text-red-400 border-red-700/50 bg-red-900/10" : "text-red-700 border-red-300 bg-red-50";
      default: return isDark ? "text-zinc-400 border-zinc-600 bg-zinc-800/20" : "text-zinc-600 border-zinc-300 bg-zinc-50";
    }
  };

  // --- FUNGSI COPY TO CLIPBOARD (BULLETPROOF HYBRID) ---
  const copyToClipboard = async (text: string, label: string) => {
    try {
      // 1. Coba gunakan API Modern (Jika HTTPS / Aman)
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // 2. Fallback Klasik (Jika HTTP / Browser ketat)
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; // Mencegah layar bergeser
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) throw new Error("Gagal menyalin");
      }
      showToast(`Nomor Rekening ${label} berhasil disalin!`, "success");
    } catch (err) {
      console.error("Copy error:", err);
      showToast("Sistem peramban menolak. Silakan blok teks dan salin manual.", "error");
    }
  };

  const theme = {
    bgMain: isDark ? "bg-[#0F110F]" : "bg-[#FDFDFB]", bgCard: isDark ? "bg-[#161B18]" : "bg-white",
    bgSection: isDark ? "bg-[#121412]" : "bg-[#F3F5F4]", textPrimary: isDark ? "text-zinc-100" : "text-[#1A241E]", 
    textSecondary: isDark ? "text-zinc-400" : "text-[#3A4D40]", textMuted: isDark ? "text-zinc-500" : "text-[#6A7C70]",
    border: isDark ? "border-[#2E3730]" : "border-[#E1E5E2]",
  };

  if (!mounted || authLoading || !user) return <div className="min-h-screen bg-[#0F110F] flex items-center justify-center text-[#C5A059] text-xs uppercase tracking-widest animate-pulse">Menghubungkan ke Brankas...</div>;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-700 ${theme.bgMain} ${theme.textPrimary} relative`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-tab-content { animation: fadeSlideUp 0.5s ease-out forwards; }
      `}} />

      <LiveTicker />
      <div className="sticky top-0 z-[80] w-full"><Navbar isDark={isDark} toggleTheme={toggleTheme} /></div>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16 min-h-[70vh]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 animate-tab-content">
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>Dasbor Kekayaan Pribadi</span>
            <div className="flex items-center gap-3 mt-2">
              <h1 className="text-3xl md:text-4xl font-black font-[family-name:var(--font-playfair)]">Wealth Analytics</h1>
              {kycRecord?.status === "VERIFIED" && <span className="bg-[#C5A059] text-[#0F110F] text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 uppercase tracking-widest shadow-[0_0_10px_rgba(197,160,89,0.3)]">Terverifikasi</span>}
            </div>
            <p className={`text-sm mt-2 font-bold ${theme.textSecondary}`}>{user.user_metadata?.full_name || "Klien Premium"} <span className="font-normal opacity-70">({user.email})</span></p>
          </div>
          <button onClick={handleLogout} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded border transition-colors ${isDark ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-red-200 text-red-600 hover:bg-red-50'}`}>Akhiri Sesi</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10 animate-tab-content" style={{ animationDelay: '0.1s' }}>
{/* KOLOM KIRI (METRIK & KOMPOSISI ASET) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 1. Baris Atas: Kartu Metrik (Kompak & Padat) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-5 rounded-xl border shadow-sm ${theme.bgCard} ${theme.border} hover:shadow-lg transition-all`}>
                <div className="flex justify-between items-start mb-3">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>Total Modal Diinvestasikan</p>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${theme.bgSection} ${theme.textSecondary}`}>{totalGrams.toFixed(2)} Gram</span>
                </div>
                <p className="text-2xl font-black font-mono tracking-tight text-zinc-100">Rp {new Intl.NumberFormat("id-ID").format(totalInvested)}</p>
              </div>

              <div className={`p-5 rounded-xl border shadow-sm relative overflow-hidden transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-[#161B18] to-[#121814] border-[#2E3730]' : 'bg-gradient-to-br from-white to-[#F3F5F4] border-[#E1E5E2]'}`}>
                <div className={`absolute top-0 right-0 w-1.5 h-full ${roiPercentage >= 0 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                <div className="flex justify-between items-start mb-3">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>Nilai Likuidasi Terkini</p>
                  <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm ${roiPercentage >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{roiPercentage >= 0 ? '▲' : '▼'} {Math.abs(roiPercentage).toFixed(2)}%</div>
                </div>
                <p className={`text-2xl font-black font-mono tracking-tight ${roiPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>Rp {new Intl.NumberFormat("id-ID").format(currentLiquidationValue)}</p>
                <div className="mt-2 text-[9px] font-bold font-mono">
                  <span className={theme.textMuted}>Unrealized P/L: </span>
                  <span className={roiPercentage >= 0 ? 'text-green-500' : 'text-red-500'}>{roiPercentage >= 0 ? '+' : '-'} Rp {new Intl.NumberFormat("id-ID").format(Math.abs(unrealizedProfit))}</span>
                </div>
              </div>
            </div>

            {/* 2. Baris Bawah: Fitur Baru (Distribusi & Komposisi Brankas) */}
            <div className={`flex-1 p-6 rounded-xl border shadow-sm ${theme.bgCard} ${theme.border} flex flex-col justify-between`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary}`}>Komposisi Portofolio Fisik</h3>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${theme.bgSection} ${theme.textMuted}`}>{portfolio.length} Entitas Aset</span>
              </div>
              
              {portfolio.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono">BRANKAS_KOSONG</div>
              ) : (
                <div className="space-y-5 flex-1">
                  {portfolio.slice(0, 3).map((item, idx) => {
                    // Kalkulasi rasio persentase gramasi emas terhadap total keseluruhan
                    const weightRatio = totalGrams > 0 ? (item.totalWeight / totalGrams) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-end text-xs">
                          <div>
                            <span className={`font-bold ${theme.textPrimary} block`}>{item.name}</span>
                            <span className={`text-[9px] uppercase tracking-widest ${theme.textMuted}`}>{item.quantity} Keping Aktif</span>
                          </div>
                          <span className={`font-mono font-bold ${theme.textSecondary}`}>{item.totalWeight}g <span className="opacity-50 text-[10px]">({weightRatio.toFixed(1)}%)</span></span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#1C221E]' : 'bg-zinc-100'}`}>
                          <div className="h-full bg-gradient-to-r from-[#C5A059] to-[#8C6D31] rounded-full" style={{ width: `${weightRatio}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {portfolio.length > 3 && (
                    <p className={`text-[10px] text-center pt-2 italic ${theme.textMuted}`}>
                      + {portfolio.length - 3} aset spesifik lainnya tersimpan di brankas...
                    </p>
                  )}
                </div>
              )}
            </div>
            
          </div>
            {/* Radar Market & Price Alerts */}
            <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Kotak Harga Market */}
            <div className={`p-6 rounded-xl border shadow-sm ${theme.bgCard} ${theme.border} flex flex-col`}>
                <div className="flex justify-between items-center mb-4">
                <h3 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${theme.textSecondary}`}><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Market Radar</h3>
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-4">
                <div className={`p-4 rounded-lg border ${theme.bgSection} ${theme.border}`}>
                    <p className={`text-[9px] uppercase tracking-widest mb-1 ${theme.textMuted}`}>Spot Global / Gram</p>
                    <p className={`text-xl font-bold font-mono ${theme.textPrimary}`}>Rp {new Intl.NumberFormat("id-ID").format(goldAnalysis?.rawGramPrice || 1361639)}</p>
                </div>
                </div>
            </div>

            {/* Widget Sistem Alarm Harga (Otomatis menyesuaikan tinggi) */}
            <div className="flex-1 min-h-[250px]">
                <PriceAlertWidget 
                currentSpotPrice={goldAnalysis?.rawGramPrice || 0} 
                isDark={isDark} 
                />
            </div>
            </div>
        </div>

        {/* ===================================================================== */}
        {/* TERMINAL GRAFIK PASAR INTERAKTIF (COLLAPSIBLE / DROPDOWN) */}
        {/* ===================================================================== */}
        <div className={`w-full mb-10 rounded-xl border shadow-sm flex flex-col ${theme.bgCard} ${theme.border} animate-tab-content`} style={{ animationDelay: '0.15s' }}>
          
          {/* Tombol Pemicu Buka/Tutup */}
          <button 
            onClick={() => setIsChartOpen(!isChartOpen)}
            className="flex justify-between items-center p-5 w-full text-left transition-colors hover:bg-black/5 rounded-xl group"
          >
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${isChartOpen ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`}></span>
              <h3 className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary} group-hover:text-[#C5A059] transition-colors`}>
                Terminal Analisis XAU/USD (Live)
              </h3>
              <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${isDark ? 'bg-[#1C221E] border-[#2E3730] text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
                OANDA DATA SOURCE
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-[9px] font-bold uppercase tracking-widest ${theme.textMuted}`}>
                {isChartOpen ? 'Tutup Terminal' : 'Buka Terminal'}
              </span>
              <svg 
                className={`w-4 h-4 transform transition-transform duration-300 ${isChartOpen ? 'rotate-180 text-[#C5A059]' : theme.textMuted}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Area Grafik (Hanya dirender saat isChartOpen = true) */}
          {isChartOpen && (
            <div className={`w-full h-[450px] p-5 pt-0 border-t animate-slide-up ${theme.border}`}>
               <div className={`w-full h-full rounded-lg overflow-hidden border mt-4 ${theme.border}`}>
                 <TradingViewChart isDark={isDark} />
               </div>
            </div>
          )}
          
        </div>
        {/* ===================================================================== */}

        {/* TAB NAVIGASI */}
        <div className={`flex gap-8 border-b mb-8 overflow-x-auto custom-scrollbar ${theme.border} animate-tab-content`} style={{ animationDelay: '0.2s' }}></div>

        <div className={`flex gap-8 border-b mb-8 overflow-x-auto custom-scrollbar ${theme.border} animate-tab-content`} style={{ animationDelay: '0.2s' }}>
          <button onClick={() => setActiveTab("portofolio")} className={`pb-4 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === "portofolio" ? 'border-[#C5A059] text-[#C5A059]' : `border-transparent ${theme.textMuted} hover:${theme.textPrimary}`}`}>Aset Terverifikasi</button>
          <button onClick={() => setActiveTab("riwayat")} className={`pb-4 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === "riwayat" ? 'border-[#C5A059] text-[#C5A059]' : `border-transparent ${theme.textMuted} hover:${theme.textPrimary}`}`}>Riwayat Transaksi</button>
          <button onClick={() => setActiveTab("kyc")} className={`pb-4 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-colors border-b-2 flex items-center gap-2 ${activeTab === "kyc" ? 'border-[#C5A059] text-[#C5A059]' : `border-transparent ${theme.textMuted} hover:${theme.textPrimary}`}`}>
            Keamanan (KYC) {kycRecord?.status === "REJECTED" && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
          </button>
        </div>

        <div className={animateTab ? "opacity-0" : "animate-tab-content"}>
          {isLoading ? (
            <div className={`text-center py-20 text-xs uppercase tracking-widest animate-pulse ${theme.textMuted}`}>Menyinkronkan Data Brankas...</div>
          ) : (
            <>
              {/* TAB PORTOFOLIO */}
              {activeTab === "portofolio" && (
                portfolio.length === 0 ? (
                  <div className={`text-center py-20 border rounded-xl border-dashed ${theme.border} ${theme.bgCard}`}>
                    <p className={`text-sm mb-4 ${theme.textSecondary}`}>Portofolio Anda masih kosong. Akuisisi aset untuk memulai perlindungan kekayaan Anda.</p>
                    <a href="/katalog" className="text-[#C5A059] text-xs font-bold uppercase tracking-wider hover:underline">Eksplorasi Katalog →</a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolio.map((item) => (
                      <div key={item.id} className={`flex gap-4 p-5 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDark ? 'bg-gradient-to-br from-[#161B18] to-[#121412] border-[#2E3730] hover:border-[#C5A059]/50' : 'bg-white border-[#E1E5E2] hover:border-[#C5A059]'}`}>
                        <div className={`w-16 h-16 flex-shrink-0 rounded-lg flex items-center justify-center font-[family-name:var(--font-playfair)] text-2xl font-black text-[#C5A059] shadow-inner ${isDark ? 'bg-[#0F110F]' : 'bg-[#FDFDFB]'}`}>N</div>
                        <div className="flex flex-col justify-center">
                          <h4 className={`text-sm font-bold leading-tight ${theme.textPrimary}`}>{item.name}</h4>
                          <div className="flex gap-3 mt-2">
                            <p className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>{item.quantity} Unit</p>
                            <p className={`text-[10px] font-mono uppercase tracking-widest ${theme.textSecondary}`}>∑ {item.totalWeight}g</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* TAB RIWAYAT */}
              {activeTab === "riwayat" && (
                transactions.length === 0 ? (
                  <div className={`text-center py-20 border rounded-xl border-dashed ${theme.border} ${theme.bgCard}`}>
                    <p className={`text-sm mb-4 ${theme.textSecondary}`}>Belum ada riwayat transaksi.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {transactions.map((inv) => (
                      <div key={inv.id} className={`border rounded-xl overflow-hidden transition-all shadow-sm ${theme.bgCard} ${theme.border} hover:border-[#C5A059]/30`}>
                        <div className={`px-6 py-5 border-b flex flex-wrap justify-between items-center gap-4 ${isDark ? 'bg-gradient-to-r from-[#161B18] to-[#121412]' : 'bg-gradient-to-r from-[#F3F5F4] to-white'} ${theme.border}`}>
                          <div><p className={`text-[10px] uppercase tracking-widest mb-1 ${theme.textMuted}`}>Nomor Referensi</p><p className="font-bold font-mono text-[#C5A059] tracking-wider">{inv.invoice_number}</p></div>
                          <div><p className={`text-[10px] uppercase tracking-widest mb-1 ${theme.textMuted}`}>Tanggal Eksekusi</p><p className={`text-sm font-medium ${theme.textPrimary}`}>{new Date(inv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                          <div><p className={`text-[10px] uppercase tracking-widest mb-1 ${theme.textMuted}`}>Total Nilai</p><p className={`font-bold font-mono ${theme.textPrimary}`}>Rp {new Intl.NumberFormat("id-ID").format(inv.total_amount)}</p></div>
                          
                          <div className="flex flex-col items-end gap-3">
                            <span className={`px-3 py-1.5 rounded text-[10px] font-bold border uppercase tracking-wider shadow-sm ${getStatusColor(inv.status)}`}>{inv.status}</span>
                            
                            {inv.status === "SELESAI" && (
                              <button onClick={() => setCertModal({ isOpen: true, invoice: inv })} className="text-[#C5A059] hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 border border-[#C5A059]/50 hover:bg-[#C5A059]/10 px-3 py-1.5 rounded">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Lihat Sertifikat
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className={`px-6 py-4 divide-y ${isDark ? 'divide-[#2E3730]' : 'divide-[#E1E5E2]'}`}>
                          {inv.invoice_items?.map((item: any) => (
                            <div key={item.id} className="py-3 flex justify-between items-center group">
                              <div>
                                <p className={`text-sm font-bold ${theme.textPrimary}`}>{item.product_name}</p>
                                <p className={`text-xs mt-1 font-mono ${theme.textMuted}`}>{item.quantity} Unit x Rp {new Intl.NumberFormat("id-ID").format(item.price)}</p>
                              </div>
                              <p className={`text-sm font-bold font-mono transition-colors group-hover:text-[#C5A059] ${theme.textSecondary}`}>Rp {new Intl.NumberFormat("id-ID").format(item.price * item.quantity)}</p>
                            </div>
                          ))}
                        </div>

                        {/* --- AREA TOMBOL AKSI BERDASARKAN STATUS --- */}

                        {/* Aksi 1: Pembayaran Manual */}
                        {inv.status === "MENUNGGU PEMBAYARAN" && (
                          <div className={`px-6 py-4 border-t flex justify-end ${theme.border} ${theme.bgCard}`}>
                            <button onClick={() => setSelectedInvoiceForPayment(inv)} className="bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] text-xs font-bold uppercase tracking-widest px-6 py-3 rounded shadow-md hover:shadow-lg transition-all">
                              Konfirmasi Pembayaran
                            </button>
                          </div>
                        )}

                        {/* Notifikasi: Proses Verifikasi */}
                        {inv.status === "PROSES VERIFIKASI" && (
                          <div className={`px-6 py-4 border-t flex justify-center md:justify-end ${theme.border} ${theme.bgCard}`}>
                            <div className="bg-blue-900/10 border border-blue-900/30 text-blue-400 px-6 py-3 rounded text-center">
                              <p className="text-[10px] uppercase tracking-widest font-bold">Bukti Sedang Ditinjau Tim Verifikasi</p>
                            </div>
                          </div>
                        )}

                        {/* Logistik Note (Jika Ada) */}
                        {inv.proof_of_delivery_url && inv.status !== "SELESAI" && (
                          <div className={`px-6 py-4 border-t ${theme.border} bg-blue-900/10`}>
                            <p className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-2">Pemberitahuan Logistik Nexus</p>
                            <p className={`text-xs mb-3 ${theme.textPrimary}`}>{inv.admin_delivery_note || "Paket Anda telah tiba di tujuan."}</p>
                            <a href={inv.proof_of_delivery_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-500 hover:underline">Lihat Foto Bukti Pengantaran →</a>
                          </div>
                        )}

                        {/* Aksi 2: Konfirmasi Penerimaan (Unboxing) */}
                        {(inv.status === "DIKIRIM" || inv.status === "TIBA DI TUJUAN") && (
                          <div className={`px-6 py-4 border-t flex justify-end ${theme.border} ${theme.bgCard}`}>
                            <button onClick={() => setSelectedInvoiceForUnboxing(inv)} className="bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] text-xs font-bold uppercase tracking-widest px-6 py-3 rounded shadow-md hover:shadow-lg transition-all">
                              Konfirmasi Penerimaan Aset
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* TAB KYC */}
              {activeTab === "kyc" && (
                <div className={`border rounded-xl shadow-sm p-6 md:p-10 ${theme.bgCard} ${theme.border}`}>
                  {kycRecord?.status === 'VERIFIED' ? (
                    <div className="text-center py-10">
                      <div className="w-20 h-20 bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <h3 className="text-2xl font-[family-name:var(--font-playfair)] font-bold text-[#C5A059] mb-2">Identitas Terverifikasi</h3>
                      <p className={`text-sm max-w-md mx-auto ${theme.textSecondary}`}>Terima kasih, dokumen KYC Anda telah divalidasi. Anda kini memiliki akses tak terbatas untuk transaksi komoditas bernilai tinggi.</p>
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto">
                      <div className="text-center mb-10">
                        <h3 className="text-2xl font-[family-name:var(--font-playfair)] font-bold text-[#C5A059] mb-2">Kepatuhan Anti-Pencucian Uang</h3>
                        <p className={`text-sm ${theme.textSecondary}`}>Sesuai regulasi perdagangan komoditas fisik, kami mewajibkan verifikasi identitas (KTP) untuk transaksi bernilai tinggi.</p>
                      </div>
                      <form onSubmit={handleSubmitKyc} className="space-y-6">
                        <div><label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${theme.textMuted}`}>Nama Lengkap (Sesuai KTP)</label><input type="text" required value={kycFullName} onChange={(e) => setKycFullName(e.target.value)} className={`w-full p-4 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#C5A059] ${isDark ? 'bg-[#0F110F] border-[#2E3730]' : 'bg-[#F3F5F4] border-[#E1E5E2]'} border`} /></div>
                        <div><label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${theme.textMuted}`}>Nomor Induk Kependudukan (NIK)</label><input type="text" required value={kycIdNumber} onChange={(e) => setKycIdNumber(e.target.value)} className={`w-full p-4 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#C5A059] ${isDark ? 'bg-[#0F110F] border-[#2E3730]' : 'bg-[#F3F5F4] border-[#E1E5E2]'} border`} /></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          <div className={`p-6 border-2 border-dashed rounded text-center transition-colors ${isDark ? 'border-[#2E3730] hover:border-[#C5A059]' : 'border-[#E1E5E2] hover:border-[#C5A059]'}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${theme.textMuted}`}>Foto KTP Asli</p>
                            <label className="cursor-pointer">
                              <span className="bg-[#C5A059] text-[#0F110F] text-xs font-bold px-4 py-2 rounded inline-block mb-3">Pilih File</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => setIdCardFile(e.target.files?.[0] || null)} />
                              <p className={`text-xs truncate px-4 ${theme.textPrimary}`}>{idCardFile ? idCardFile.name : "Belum ada file dipilih"}</p>
                            </label>
                          </div>
                          <div className={`p-6 border-2 border-dashed rounded text-center transition-colors ${isDark ? 'border-[#2E3730] hover:border-[#C5A059]' : 'border-[#E1E5E2] hover:border-[#C5A059]'}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${theme.textMuted}`}>Selfie Sambil Pegang KTP</p>
                            <label className="cursor-pointer">
                              <span className="bg-[#C5A059] text-[#0F110F] text-xs font-bold px-4 py-2 rounded inline-block mb-3">Pilih File</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} />
                              <p className={`text-xs truncate px-4 ${theme.textPrimary}`}>{selfieFile ? selfieFile.name : "Belum ada file dipilih"}</p>
                            </label>
                          </div>
                        </div>
                        <div className="pt-6 border-t border-[#2E3730]">
                          <button type="submit" disabled={isSubmittingKyc} className="w-full bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] font-bold text-xs uppercase tracking-widest py-4 rounded hover:shadow-lg disabled:opacity-50 transition-all">
                            {isSubmittingKyc ? "Mengenkripsi Dokumen..." : "Kirim Dokumen Verifikasi"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      {/* ===================================================================== */}
      {/* PORTAL PELINDUNG MODAL (TETAP MENUTUP DOKUMEN HTML UTAMA SAAT AKTIF) */}
      {/* ===================================================================== */}
      {mounted && createPortal(
        <>
          {/* 1. CEREMONY MODAL: E-CERTIFICATE PREVIEW */}
          <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${certModal.isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCertModal({ isOpen: false, invoice: null })}></div>
            <div className={`relative bg-[#121412] border border-[#C5A059]/30 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(197,160,89,0.15)] p-8 text-center overflow-hidden transform transition-all duration-500 ease-out ${certModal.isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#C5A059] blur-[100px] opacity-20 pointer-events-none"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#C5A059] to-[#8C6D31] rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(197,160,89,0.4)] relative z-10">
                <svg className="w-8 h-8 text-[#0F110F]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#C5A059] mb-2 relative z-10">Certificate of Authenticity</h3>
              <p className="text-xs text-zinc-400 mb-8 relative z-10 leading-relaxed">
                Dokumen legal kepemilikan aset fisik siap diunduh.<br/>
                Referensi: <span className="font-mono text-zinc-200">{certModal.invoice?.invoice_number}</span>
              </p>
              <div className="flex flex-col gap-3 relative z-10">
                {certModal.invoice && (
                  <div onClick={() => setTimeout(() => setCertModal({isOpen: false, invoice: null}), 3000)}>
                    <CertificateGenerator invoice={certModal.invoice} userName={user.user_metadata?.full_name || user.email} />
                  </div>
                )}
                <button onClick={() => setCertModal({ isOpen: false, invoice: null })} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white py-3 transition-colors">Tutup Jendela</button>
              </div>
            </div>
          </div>

          {/* 2. MODAL UNBOXING ASET */}
          <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${selectedInvoiceForUnboxing ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isUploadingProof && setSelectedInvoiceForUnboxing(null)}></div>
            <div className={`relative bg-[#121412] border border-[#C5A059]/30 w-full max-w-md rounded-2xl shadow-[0_0_40px_rgba(197,160,89,0.1)] p-8 overflow-hidden transform transition-all duration-300 ease-out ${selectedInvoiceForUnboxing ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#C5A059] mb-2">Otorisasi Serah-Terima</h3>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">Untuk alasan asuransi & keamanan, mohon unggah video unboxing paket (tidak terpotong) sebagai bukti bahwa aset tiba dengan kondisi utuh.</p>
              
              <div className="mb-8">
                <label className={`block border-2 border-dashed ${unboxingFile ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-[#2E3730] bg-[#0F110F]'} rounded-xl p-10 text-center hover:border-[#C5A059] cursor-pointer transition-colors`}>
                  <input type="file" accept="image/*,video/mp4" className="hidden" onChange={(e) => setUnboxingFile(e.target.files?.[0] || null)} />
                  {unboxingFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-sm font-bold text-[#C5A059] truncate max-w-full px-4">{unboxingFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pilih File Video/Foto</span>
                    </div>
                  )}
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button disabled={isUploadingProof} onClick={() => setSelectedInvoiceForUnboxing(null)} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white px-4 py-3 transition-colors">Batal</button>
                <button disabled={!unboxingFile || isUploadingProof} onClick={handleUploadUnboxing} className="bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] font-bold text-[10px] uppercase tracking-widest px-6 py-3 rounded shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
                  {isUploadingProof ? "Mengenkripsi..." : "Kirim & Selesaikan"}
                </button>
              </div>
            </div>
          </div>

            {/* 3. MODAL TERINTEGRASI: INFO BANK & UNGGAH BUKTI */}
          <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${selectedInvoiceForPayment ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isUploadingPayment && setSelectedInvoiceForPayment(null)}></div>
            <div className={`relative bg-[#121412] border border-[#C5A059]/30 w-full max-w-3xl rounded-2xl shadow-[0_0_40px_rgba(197,160,89,0.1)] overflow-hidden transform transition-all duration-300 ease-out flex flex-col max-h-[90vh] ${selectedInvoiceForPayment ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
              
              <div className="bg-[#161B18] px-8 py-5 border-b border-[#2E3730] flex justify-between items-center shrink-0">
                <h3 className="text-sm font-bold text-[#C5A059] uppercase tracking-widest">Penyelesaian Akuisisi Fisik</h3>
                <button onClick={() => !isUploadingPayment && setSelectedInvoiceForPayment(null)} className="text-zinc-500 hover:text-white text-xl">✕</button>
              </div>
              
              {/* Area Scrollable */}
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                
                {/* Info Tagihan */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#1C221E] border border-[#2E3730] p-6 rounded-xl shadow-inner">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Referensi Tagihan</p>
                    <p className="text-lg font-mono text-zinc-200">{selectedInvoiceForPayment?.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Nominal Transfer Mutlak</p>
                    <p className="text-2xl font-black font-mono text-[#C5A059]">Rp {selectedInvoiceForPayment && new Intl.NumberFormat('id-ID').format(selectedInvoiceForPayment.total_amount)}</p>
                  </div>
                </div>

                {/* Info Rekening Bank Dinamis */}
                <div>
                  <p className="text-[10px] text-[#C5A059] uppercase tracking-widest font-bold mb-4">Pilihan Rekening Korporasi Kami</p>
                    <div className="grid grid-cols-1 gap-4">
                    {bankAccounts.map((bank) => {
                      const style = getBankStyle(bank.bank_name);
                        function showToast(arg0: string, arg1: string) {
                            throw new Error("Function not implemented.");
                        }

                      return (
                        <div key={bank.id} className={`bg-[#161B18] border border-[#2E3730] rounded-xl p-5 relative group transition-all duration-300 ${style.border} hover:shadow-lg`}>
                          
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              {/* Logo Bank Buatan */}
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black italic text-xs ${style.bgIcon} ${style.textIcon} border border-white/5`}>
                                {style.logoText}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-zinc-100 block mb-1">{bank.bank_name}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 border rounded ${style.badge}`}>
                                  {bank.currency || 'IDR'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                              <p className="text-2xl font-mono text-zinc-300 tracking-wider mb-1 group-hover:text-white transition-colors">{bank.account_number}</p>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">A.N {bank.account_name}</p>
                            </div>

                            {/* Tombol Salin Interaktif */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            // Gunakan fungsi kebal yang baru saja kita buat
                            copyToClipboard(bank.account_number, style.logoText);
                          }} 
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all w-full md:w-auto
                            bg-[#1C221E] border border-[#2E3730] text-zinc-400
                            group-hover:${style.bgIcon} group-hover:${style.textIcon} group-hover:border-transparent`}
                        >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Salin Rekening
                            </button>
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-yellow-600 mt-3">*Pastikan nominal transfer sesuai hingga digit terakhir untuk mempercepat validasi otomatis.</p>
                </div>

                {/* Form Upload Bukti */}
                <div className="border-t border-[#2E3730] pt-8">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-4 text-center">Konfirmasi Transaksi Selesai</p>
                  <label className={`block border-2 border-dashed ${paymentProofFile ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-[#2E3730] bg-[#0F110F]'} rounded-xl p-8 text-center hover:border-[#C5A059] cursor-pointer transition-colors max-w-md mx-auto`}>
                    <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)} />
                    {paymentProofFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-sm font-bold text-[#C5A059] truncate max-w-full px-4">{paymentProofFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pilih Struk / Bukti Transfer (JPG/PNG)</span>
                      </div>
                    )}
                  </label>
                </div>
                
              </div>

              {/* Action Buttons */}
              <div className="bg-[#161B18] px-8 py-5 border-t border-[#2E3730] flex justify-end gap-4 shrink-0">
                <button disabled={isUploadingPayment} onClick={() => setSelectedInvoiceForPayment(null)} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white px-4 py-3 transition-colors">Batal</button>
                <button disabled={!paymentProofFile || isUploadingPayment} onClick={handleUploadPaymentProof} className="bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] font-bold text-[10px] uppercase tracking-widest px-8 py-3 rounded shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2">
                  {isUploadingPayment && <svg className="w-3 h-3 animate-spin text-[#0F110F]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  {isUploadingPayment ? "Mengunggah..." : "Kirim Bukti Validasi"}
                </button>
              </div>
            </div>
          </div>
                {mounted && <VIPConcierge isDark={isDark} />}
        </>,
        document.body
      )}



      <Footer isDark={isDark} />
    </div>
  );
}

function showToast(arg0: string, arg1: string) {
    throw new Error("Function not implemented.");
}
