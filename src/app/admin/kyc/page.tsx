"use client";

import { useState, useEffect } from "react";
import { supabase, logAdminAction } from "../../../lib/supabase";
import PaginatedTable, { TableColumn } from "../../../components/PaginatedTable";

export default function KYCDashboardPage() {
  const [kycList, setKycList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  // --- STATE UI/UX BARU ---
  const [toast, setToast] = useState({ show: false, message: "", type: "success", trigger: 0 });
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // State untuk Review Modal
  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type, trigger: Date.now() });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.trigger, toast.show]);

  const fetchKYC = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kyc_submissions")
      .select("*")
      .eq("status", filter)
      .order("created_at", { ascending: false });

    if (!error && data) setKycList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchKYC();
  }, [filter]);

  // FUNGSI KEAMANAN: Mengambil Signed URL sementara (kadaluarsa dalam 60 detik)
  const handleReview = async (kyc: any) => {
    setSelectedKyc(kyc);
    setIsReviewOpen(true); // Membuka modal dengan animasi
    setRejectReason("");
    setIdCardUrl(null);
    setSelfieUrl(null);

    const { data: idData } = await supabase.storage.from("kyc_documents").createSignedUrl(kyc.id_card_path, 60);
    if (idData) setIdCardUrl(idData.signedUrl);

    const { data: selfieData } = await supabase.storage.from("kyc_documents").createSignedUrl(kyc.selfie_path, 60);
    if (selfieData) setSelfieUrl(selfieData.signedUrl);
  };

  const closeReviewModal = () => {
    setIsReviewOpen(false);
    // Tunda penghapusan data agar animasi keluar tidak patah karena data hilang duluan
    setTimeout(() => {
      if (!isReviewOpen) setSelectedKyc(null); 
    }, 300); 
  };

  const handleAction = async (status: "VERIFIED" | "REJECTED") => {
    if (status === "REJECTED" && !rejectReason) {
      showToast("Mohon sertakan alasan penolakan agar klien bisa memperbaikinya.", "error");
      return;
    }

    if (!window.confirm(`Anda yakin ingin menandai identitas ini sebagai ${status}?`)) return;
    
    setIsProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email || "Unknown Admin";

      const { error } = await supabase
        .from("kyc_submissions")
        .update({ 
          status: status, 
          rejection_reason: status === "REJECTED" ? rejectReason : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedKyc.id);

      if (error) throw error;

      // CATAT KE AUDIT TRAIL
      await logAdminAction(
        adminEmail, 
        "SYSTEM", 
        `${status === "VERIFIED" ? "Menyetujui" : "Menolak"} dokumen KYC untuk NIK: ${selectedKyc.id_number} (${selectedKyc.full_name}).`, 
        "kyc_submissions", 
        selectedKyc.id
      );

      showToast(`Status KYC berhasil diubah menjadi ${status}.`);
      closeReviewModal();
      fetchKYC();

    } catch (err: any) {
      console.error(err);
      showToast("Kesalahan Sistem: " + err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- DEFINISI KOLOM UNTUK PAGINATED TABLE ---
  const columns: TableColumn<any>[] = [
    {
      header: "Waktu Pengajuan",
      render: (kyc) => (
        <span className="text-xs text-zinc-400">
          {new Date(kyc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      header: "Identitas Klien",
      render: (kyc) => <span className="font-bold text-zinc-200">{kyc.full_name}</span>
    },
    {
      header: "No. Identitas (NIK)",
      render: (kyc) => <span className="font-mono text-zinc-400 text-xs tracking-wider">{kyc.id_number}</span>
    },
    {
      header: "Status",
      align: "center",
      render: (kyc) => {
        const statusClasses = kyc.status === 'VERIFIED' 
          ? 'bg-green-900/30 text-green-400 border-green-800' 
          : kyc.status === 'REJECTED' 
          ? 'bg-red-900/30 text-red-400 border-red-800' 
          : 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
        return (
          <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border ${statusClasses}`}>
            {kyc.status}
          </span>
        );
      }
    },
    {
      header: "Aksi",
      align: "right",
      render: (kyc) => (
        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => handleReview(kyc)}
            className="text-[#C5A059] hover:text-[#B38F4B] text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Tinjau
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 min-h-[80vh] flex flex-col relative overflow-x-hidden">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Otorisasi KYC Klien</h2>
          <p className="text-xs text-zinc-500 mt-1">Modul kepatuhan Anti-Money Laundering (AML) & Verifikasi Identitas.</p>
        </div>
        <div className="flex bg-[#121412] p-1 rounded border border-[#2E3730] shadow-sm">
          {["PENDING", "VERIFIED", "REJECTED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                filter === f ? "bg-[#C5A059] text-[#0F110F] shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER KOMPONEN TABEL */}
      <div className="flex-1">
        {loading ? (
          <div className="bg-[#121412] rounded border border-[#2E3730] h-64 flex items-center justify-center">
            <span className="text-zinc-500 text-xs uppercase tracking-widest animate-pulse">Menarik data dari brankas enkripsi...</span>
          </div>
        ) : (
          <PaginatedTable 
            data={kycList} 
            columns={columns} 
            itemsPerPage={10} 
            emptyMessage={`Tidak ada dokumen dengan status ${filter}.`} 
          />
        )}
      </div>

      {/* --- MODAL TINJAUAN KYC FORENSIK (DENGAN ANIMASI FADE & SCALE) --- */}
      <div className={`fixed inset-0 z-[110] flex items-center justify-center transition-all duration-300 ${isReviewOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isProcessing && closeReviewModal()}></div>
        
        <div className={`relative bg-[#121412] border border-[#2E3730] w-full max-w-4xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] transform transition-all duration-300 ease-out ${isReviewOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
          
          {selectedKyc && (
            <>
              <div className="px-6 py-4 border-b border-[#2E3730] bg-[#161B18] flex justify-between items-center rounded-t-lg">
                <div>
                  <h3 className="font-bold text-[#C5A059] text-lg font-[family-name:var(--font-playfair)]">Investigasi Identitas Klien</h3>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{selectedKyc.full_name} • NIK: {selectedKyc.id_number}</p>
                </div>
                <button onClick={() => !isProcessing && closeReviewModal()} className="text-zinc-500 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar">
                {/* KOLOM KTP */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Dokumen KTP Nasional</p>
                  <div className="bg-[#0F110F] border border-[#2E3730] rounded h-64 flex items-center justify-center overflow-hidden relative group">
                    {idCardUrl ? (
                      <img src={idCardUrl} alt="KTP Klien" className="max-w-full max-h-full object-contain hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <span className="text-xs text-zinc-600 animate-pulse">Mendekripsi URL Pribadi...</span>
                    )}
                  </div>
                </div>

                {/* KOLOM SELFIE */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Verifikasi Wajah (Liveness)</p>
                  <div className="bg-[#0F110F] border border-[#2E3730] rounded h-64 flex items-center justify-center overflow-hidden relative group">
                    {selfieUrl ? (
                      <img src={selfieUrl} alt="Selfie Klien" className="max-w-full max-h-full object-contain hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <span className="text-xs text-zinc-600 animate-pulse">Mendekripsi URL Pribadi...</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedKyc.status === "PENDING" && (
                <div className="p-6 border-t border-[#2E3730] bg-[#161B18] rounded-b-lg">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Alasan Penolakan (Wajib jika menolak)</label>
                      <input 
                        type="text" 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Misal: Foto KTP buram, wajah tidak terbaca..." 
                        className="w-full bg-[#0F110F] border border-[#2E3730] text-zinc-200 text-sm rounded px-3 py-3 focus:outline-none focus:border-red-500/50 transition-colors"
                      />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => handleAction("REJECTED")}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none bg-transparent border border-red-900/50 text-red-500 font-bold text-[10px] uppercase tracking-widest px-6 py-3.5 rounded hover:bg-red-900/20 transition-colors"
                      >
                        Tolak
                      </button>
                      <button 
                        onClick={() => handleAction("VERIFIED")}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none bg-[#C5A059] text-[#0F110F] font-bold text-[10px] uppercase tracking-widest px-8 py-3.5 rounded hover:bg-[#B38F4B] transition-colors"
                      >
                        {isProcessing ? "Memverifikasi..." : "Validasi & Setujui KYC"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- TOAST NOTIFICATION --- */}
      <div className={`fixed bottom-8 right-8 z-[150] transition-all duration-300 ease-out transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none'}`}>
        <div className={`px-6 py-4 rounded shadow-2xl border-l-4 ${toast.type === 'success' ? 'bg-[#1C221E] border-[#C5A059]' : 'bg-[#221818] border-red-500'}`}>
          <p className="text-sm font-medium text-zinc-100 tracking-wide">{toast.message}</p>
        </div>
      </div>

    </div>
  );
}