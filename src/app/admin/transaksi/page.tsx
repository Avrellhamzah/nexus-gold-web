"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";

export default function AdminKliringPage() {
  const { showToast } = useToast();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectMode, setIsRejectMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTransactions();
    
    const channel = supabase
      .channel("kliring_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_admin_invoices');

    if (error) {
      showToast("Gagal menarik data buku besar.", "error");
    } else if (data) {
      setTransactions(data);
      if (selectedTx) {
        const updated = data.find((tx: any) => tx.id === selectedTx.id);
        if (updated) setSelectedTx(updated);
      }
    }
    setIsLoading(false);
  };

// --- FITUR 1: EXPORT KE EXCEL (CSV) ---
  const handleExportExcel = () => {
    if (transactions.length === 0) {
      showToast("Tidak ada data untuk diunduh.", "error");
      return;
    }

    // Mengubah ID Transaksi menjadi Invoice Pembayaran & Menambahkan kolom URL Bukti Transfer
    const headers = [
      "Invoice Pembayaran", 
      "Tanggal", 
      "Klien", 
      "Email", 
      "Total Tagihan (Rp)", 
      "Status", 
      "URL Bukti Transfer", 
      "Catatan Internal"
    ];
    
    const csvRows = transactions.map(tx => {
      // Format ID UUID menjadi format INV yang mudah dibaca
      const invoiceNumber = `INV-${tx.id.split('-')[0].toUpperCase()}`;
      
      return [
        `"${invoiceNumber}"`,
        `"${new Date(tx.created_at).toLocaleString('id-ID')}"`,
        `"${tx.client_name}"`,
        `"${tx.client_email}"`,
        tx.total_amount,
        `"${tx.status}"`,
        `"${tx.payment_proof_url ? tx.payment_proof_url : 'Belum Terlampir'}"`, // Menyisipkan link gambar
        `"${tx.admin_notes || '-'}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Buku_Besar_Nexus_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

// --- FITUR 2: ADMIN UPLOAD MANUAL VIA WHATSAPP ---
  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTx) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `admin_upload_${selectedTx.id}_${Date.now()}.${fileExt}`;
    const filePath = `manual_inserts/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("invoices")
        .update({ 
          payment_proof_url: publicUrlData.publicUrl,
          status: 'MENUNGGU_VALIDASI',
          admin_notes: 'Dokumen diunggah manual oleh Admin (WhatsApp/Jalur Pribadi).'
        })
        .eq("id", selectedTx.id);

      if (updateError) throw updateError;

      // PENCATATAN KE LOG AUDIT SISTEM
      // Sesuaikan nama tabel dan kolom dengan struktur tabel audit database Anda
      await supabase.from("audit_logs").insert([{
        action: "MANUAL_PAYMENT_UPLOAD",
        details: `Unggah bukti transfer manual untuk Invoice INV-${selectedTx.id.split('-')[0].toUpperCase()}`,
        // admin_email: user?.email // Hapus komentar ini jika Anda menarik auth state 'user' di halaman ini
      }]);

      showToast("Bukti transfer manual berhasil diunggah.", "success");
      fetchTransactions();
    } catch (error: any) {
      showToast(error.message || "Gagal mengunggah dokumen.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

const handleApprove = async () => {
    if (!selectedTx) return;
    setIsProcessing(true);

    const { error } = await supabase
      .from("invoices")
      .update({ 
        status: 'DIPROSES', 
        admin_notes: 'Dana tervalidasi. Siap dilanjutkan ke logistik pengiriman.' 
      })
      .eq("id", selectedTx.id);

    if (error) {
      showToast("Gagal memvalidasi dokumen.", "error");
    } else {
      // PENCATATAN KE LOG AUDIT SISTEM
      await supabase.from("audit_logs").insert([{
        action: "VALIDASI_PEMBAYARAN",
        details: `Otorisasi dana masuk untuk tagihan INV-${selectedTx.id.split('-')[0].toUpperCase()} senilai Rp ${selectedTx.total_amount}`,
      }]);

      showToast("Dana divalidasi. Aset siap dikirim.", "success");
      setSelectedTx({ ...selectedTx, status: 'DIPROSES' });
      fetchTransactions(); 
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedTx || !rejectionReason.trim()) return;
    setIsProcessing(true);

    const { error } = await supabase
      .from("invoices")
      .update({ 
        status: 'MENUNGGU_PEMBAYARAN', 
        payment_proof_url: null,
        admin_notes: `DITOLAK: ${rejectionReason}`
      })
      .eq("id", selectedTx.id);

    if (error) {
      showToast("Gagal menolak dokumen.", "error");
    } else {
      // PENCATATAN KE LOG AUDIT SISTEM
      await supabase.from("audit_logs").insert([{
        action: "TOLAK_PEMBAYARAN",
        details: `Penolakan bukti transfer INV-${selectedTx.id.split('-')[0].toUpperCase()}. Alasan: ${rejectionReason}`,
      }]);

      showToast("Dokumen ditolak.", "success");
      setIsRejectMode(false); 
      setRejectionReason(""); 
      fetchTransactions(); 
    }
    setIsProcessing(false);
  };

  const pendingValidations = transactions.filter(tx => tx.status === 'MENUNGGU_VALIDASI');
  const otherTransactions = transactions.filter(tx => tx.status !== 'MENUNGGU_VALIDASI');

  return (
    <div className="max-w-7xl mx-auto h-[85vh] flex flex-col md:flex-row gap-6 font-sans">
      
      {/* PANEL KIRI: BUKU BESAR */}
      <div className="w-full md:w-1/3 bg-[#121412] border border-[#2E3730] rounded-xl flex flex-col overflow-hidden shadow-lg shrink-0">
        <div className="p-5 border-b border-[#2E3730] bg-[#161B18] shrink-0 flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#C5A059] uppercase tracking-widest">Pusat Kliring</h2>
          <button 
            onClick={handleExportExcel}
            className="bg-[#1C221E] hover:bg-[#C5A059] hover:text-[#0F110F] text-zinc-400 border border-[#2E3730] px-3 py-1.5 rounded flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest transition-all shadow-sm"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Unduh CSV
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <p className="p-8 text-center text-xs text-zinc-500 animate-pulse uppercase tracking-widest">Sinkronisasi...</p>
          ) : transactions.length === 0 ? (
            <p className="p-8 text-center text-xs text-zinc-500 uppercase tracking-widest">Buku Besar Kosong</p>
          ) : (
            <div className="divide-y divide-[#2E3730]">
              {pendingValidations.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => { setSelectedTx(tx); setIsRejectMode(false); }}
                  className={`w-full text-left p-4 transition-all hover:bg-[#1C221E] group relative ${selectedTx?.id === tx.id ? "bg-[#1C221E] border-l-4 border-yellow-500" : "border-l-4 border-transparent"}`}
                >
                  <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-bl-lg shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-zinc-200 truncate pr-2">{tx.client_name}</p>
                    <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-yellow-900/30 text-yellow-500 border border-yellow-900/50">CEK MUTASI</span>
                  </div>
                  <p className="text-sm font-black font-mono text-[#C5A059] mb-1">Rp {new Intl.NumberFormat('id-ID').format(tx.total_amount)}</p>
                </button>
              ))}

              {otherTransactions.length > 0 && (
                <div className="px-4 py-2 bg-[#0F110F] text-[9px] uppercase tracking-widest text-zinc-600 font-bold border-y border-[#2E3730]">Riwayat Diproses</div>
              )}
              {otherTransactions.map((tx) => {
                let statusColor = "text-zinc-500";
                if (tx.status === 'DIPROSES' || tx.status === 'DIKIRIM' || tx.status === 'SELESAI') statusColor = "text-green-500";
                if (tx.status === 'DITOLAK' || tx.status === 'DIBATALKAN') statusColor = "text-red-500";

                return (
                  <button
                    key={tx.id}
                    onClick={() => { setSelectedTx(tx); setIsRejectMode(false); }}
                    className={`w-full text-left p-4 transition-all hover:bg-[#1C221E] group ${selectedTx?.id === tx.id ? "bg-[#1C221E] border-l-4 border-[#C5A059]" : "border-l-4 border-transparent"}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-zinc-400 truncate pr-2">{tx.client_name}</p>
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${statusColor}`}>{tx.status}</span>
                    </div>
                    <p className="text-xs font-black font-mono text-zinc-300">Rp {new Intl.NumberFormat('id-ID').format(tx.total_amount)}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* PANEL KANAN: INSPEKSI & UPLOAD */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        {!selectedTx ? (
          <div className="flex-1 bg-[#121412] border border-[#2E3730] rounded-xl flex items-center justify-center">
            <div className="text-center opacity-50">
              <svg className="w-16 h-16 mx-auto mb-4 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-xs text-[#C5A059] uppercase tracking-widest font-bold">Pilih Dokumen Untuk Inspeksi</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-[#121412] border border-[#2E3730] rounded-xl flex flex-col overflow-hidden shadow-lg">
            
            <div className="p-6 border-b border-[#2E3730] bg-[#161B18] shrink-0 flex justify-between items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-zinc-100">INV-{selectedTx.id.split('-')[0].toUpperCase()}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${selectedTx.status === 'MENUNGGU_VALIDASI' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50' : selectedTx.status === 'DIPROSES' ? 'bg-green-900/20 text-green-500 border-green-900/50' : 'bg-zinc-900 text-zinc-400 border-zinc-700'}`}>
                    {selectedTx.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Klien: <span className="text-zinc-200 font-bold">{selectedTx.client_name}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Ekstraksi</p>
                <p className="text-2xl font-black font-mono text-[#C5A059]">Rp {new Intl.NumberFormat('id-ID').format(selectedTx.total_amount)}</p>
              </div>
            </div>

            <div className="flex-1 p-6 bg-[#0F110F] overflow-y-auto flex flex-col items-center justify-center relative">
              {selectedTx.payment_proof_url ? (
                <div className="w-full max-w-sm relative group">
                  <img src={selectedTx.payment_proof_url} alt="Bukti Transfer" className="w-full rounded-lg border border-[#2E3730] shadow-2xl object-contain bg-[#161B18] max-h-[400px]" />
                  {selectedTx.admin_notes && (
                     <div className="mt-4 p-3 bg-[#1C221E] border border-[#2E3730] rounded text-[10px] text-zinc-400 font-mono">
                       <span className="font-bold text-[#C5A059]">Log:</span> {selectedTx.admin_notes}
                     </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-10 border border-dashed border-[#2E3730] rounded-xl bg-[#161B18] w-full max-w-md">
                  <svg className="w-10 h-10 mx-auto mb-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">Belum Ada Dokumen Mutasi Terlampir</p>
                  
                  {/* TOMBOL UPLOAD MANUAL ADMIN */}
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleManualUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-[#1C221E] border border-[#C5A059]/50 text-[#C5A059] px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#0F110F] transition-all disabled:opacity-50 mx-auto flex items-center gap-2"
                  >
                    {isUploading ? "MENGUNGGAH..." : "+ Lampirkan Struk WhatsApp"}
                  </button>
                  <p className="text-[9px] text-zinc-600 mt-3 font-bold">*Fitur ini digunakan jika klien mentransfer langsung via jalur pribadi.</p>
                </div>
              )}
            </div>

            {selectedTx.status === 'MENUNGGU_VALIDASI' && (
              <div className="p-6 border-t border-[#2E3730] bg-[#161B18] shrink-0">
                {!isRejectMode ? (
                  <div className="flex gap-4">
                    <button onClick={() => setIsRejectMode(true)} className="flex-1 bg-red-900/10 text-red-500 border border-red-900/30 px-6 py-4 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                      Tolak Dokumen
                    </button>
                    <button onClick={handleApprove} disabled={isProcessing} className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 transition-all flex justify-center gap-2">
                      {isProcessing ? "MENGOTORISASI..." : "OTORISASI & VALIDASI DANA MASUK"}
                    </button>
                  </div>
                ) : (
                  <div className="animate-fade-in space-y-4">
                    <input type="text" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Alasan penolakan..." className="w-full bg-[#0F110F] border border-red-900/50 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors" autoFocus />
                    <div className="flex gap-4">
                      <button onClick={() => setIsRejectMode(false)} className="flex-1 bg-[#1C221E] text-zinc-400 border border-[#2E3730] px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all">Batal</button>
                      <button onClick={handleReject} disabled={!rejectionReason.trim() || isProcessing} className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-all">KONFIRMASI PENOLAKAN</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}