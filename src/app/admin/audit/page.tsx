"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import PaginatedTable, { TableColumn } from "../../../components/PaginatedTable";

export default function AuditTrailPage() {
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");

  // --- STATE UI/UX ---
  const [toast, setToast] = useState({ show: false, message: "", type: "success", trigger: 0 });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type, trigger: Date.now() });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.trigger, toast.show]);

  const fetchLogs = async () => {
    setLoading(true);
    // Kita tarik semua data tanpa filter .eq() di Supabase untuk menghindari error jika kolom tidak ada
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    
    if (error) {
      showToast("Gagal menarik data dari brankas enkripsi.", "error");
    } else if (data) {
      setAllLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // --- FUNGSI KECERDASAN NORMALISASI KATEGORI ---
  // Menyatukan variasi data dari berbagai modul ke dalam 4 pilar filter utama
  const getNormalizedCategory = (log: any) => {
    const rawAction = (log.action_type || log.action || "SYSTEM").toUpperCase();
    
    // Kelompokkan semua aksi finansial dan kliring ke TRANSACTION
    if (rawAction.includes("PEMBAYARAN") || rawAction.includes("KLIRING") || rawAction === "TRANSACTION") {
      return "TRANSACTION";
    }
    // Kelompokkan pengiriman, kurir, dan pemotongan stok ke INVENTORY
    if (rawAction.includes("LOGISTIK") || rawAction.includes("SELESAI") || rawAction === "INVENTORY") {
      return "INVENTORY";
    }
    if (rawAction === "PRICING") return "PRICING";
    
    return "SYSTEM"; // Fallback untuk aktivitas admin/auth lainnya
  };

  // --- EKSEKUSI FILTER DI SISI FRONTEND ---
  useEffect(() => {
    if (filterType === "ALL") {
      setFilteredLogs(allLogs);
    } else {
      setFilteredLogs(allLogs.filter(log => getNormalizedCategory(log) === filterType));
    }
  }, [filterType, allLogs]);

  const getActionColor = (type: string) => {
    switch (type) {
      case "PRICING": return "bg-blue-900/30 text-blue-400 border-blue-800";
      case "TRANSACTION": return "bg-green-900/30 text-green-400 border-green-800";
      case "INVENTORY": return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      case "SYSTEM": return "bg-red-900/30 text-red-400 border-red-800";
      default: return "bg-zinc-800/50 text-zinc-400 border-zinc-700";
    }
  };

  // --- DEFINISI KOLOM UNTUK PAGINATED TABLE ---
  const columns: TableColumn<any>[] = [
    {
      header: "Waktu Sistem (UTC)",
      width: "w-48",
      render: (log) => (
        <span className="text-xs text-zinc-500 font-mono">
          {new Date(log.created_at).toLocaleString('id-ID', { hour12: false })}
        </span>
      )
    },
    {
      header: "Otoritas (Admin)",
      render: (log) => (
        // Membaca admin_email, jika kosong berarti dieksekusi oleh sistem logistik otomatis
        <span className="text-xs font-bold text-zinc-300">
          {log.admin_email || "Sistem / Administrator"}
        </span>
      )
    },
    {
      header: "Kategori",
      align: "center",
      width: "w-32",
      render: (log) => {
        const category = getNormalizedCategory(log);
        const rawAction = log.action_type || log.action || "SYSTEM";
        return (
          <div className="flex flex-col items-center gap-1">
            <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap ${getActionColor(category)}`}>
              {category}
            </span>
            {/* Menampilkan kode aksi asli dari database sebagai referensi forensik */}
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest">{rawAction}</span>
          </div>
        );
      }
    },
    {
      header: "Deskripsi Forensik",
      render: (log) => {
        // Adaptasi pembacaan kolom description (format lama) dan details (format baru)
        const desc = log.description || log.details || "Detail tidak tersedia.";
        return (
          <span className="text-xs text-zinc-300 whitespace-normal block min-w-[300px] leading-relaxed">
            {desc}
          </span>
        );
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-[80vh] flex flex-col relative overflow-x-hidden">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Log Audit & Keamanan</h2>
          <p className="text-xs text-zinc-500 mt-1">Sistem pencatatan mutlak (append-only) untuk integritas operasional.</p>
        </div>
        
        <div className="flex bg-[#121412] p-1 rounded border border-[#2E3730] shadow-sm overflow-x-auto max-w-full custom-scrollbar">
          {["ALL", "PRICING", "TRANSACTION", "INVENTORY", "SYSTEM"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-5 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
                filterType === type ? "bg-[#C5A059] text-[#0F110F] shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {type}
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
            data={filteredLogs} 
            columns={columns} 
            itemsPerPage={15} 
            emptyMessage="Tidak ada catatan aktivitas yang ditemukan untuk kategori ini." 
          />
        )}
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