"use client";

import { useState, useEffect } from "react";
import { supabase, logAdminAction } from "../../../lib/supabase";
import PaginatedTable, { TableColumn } from "../../../components/PaginatedTable";

export default function KategoriPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State Form & UI Drawer
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "success", trigger: 0 });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null as number | null });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type, trigger: Date.now() });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.trigger, toast.show]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    if (data) setCategories(data);
  };

  useEffect(() => { fetchCategories(); }, []);

  // --- DEFINISI KOLOM UNTUK TABEL REUSABLE ---
  const columns: TableColumn<any>[] = [
    {
      header: "Kategori",
      accessor: "category_name",
      render: (item) => <p className="font-bold text-zinc-200">{item.category_name}</p>
    },
    {
      header: "Deskripsi Spesifikasi",
      accessor: "description",
      render: (item) => <p className="text-zinc-400 max-w-xs truncate">{item.description || "-"}</p>
    },
    {
      header: "Aksi",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button onClick={() => { setEditId(item.id); setName(item.category_name); setDescription(item.description || ""); setIsDrawerOpen(true); }} className="text-[#C5A059] hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">Ubah</button>
          <span className="text-zinc-700">|</span>
          <button onClick={() => setDeleteModal({ isOpen: true, id: item.id })} className="text-red-500 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest transition-colors">Arsip</button>
        </div>
      )
    }
  ];

  const resetForm = () => {
    setEditId(null); setName(""); setDescription(""); setIsDrawerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email || "Unknown Admin";

      if (editId) {
        await supabase.from("categories").update({ category_name: name, description }).eq("id", editId);
        await logAdminAction(adminEmail, "SYSTEM", `Koreksi kategori ID: ${editId}`, "categories", editId.toString());
        showToast("Kategori diperbarui.");
      } else {
        await supabase.from("categories").insert([{ category_name: name, description }]);
        await logAdminAction(adminEmail, "SYSTEM", `Registrasi kategori baru: ${name}`, "categories");
        showToast("Kategori diregistrasi.");
      }
      resetForm();
      fetchCategories();
    } catch (err: any) { showToast("Gagal: " + err.message, "error"); } finally { setLoading(false); }
  };

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email || "Unknown Admin";
      await supabase.from("categories").update({ deleted_at: new Date().toISOString() }).eq("id", deleteModal.id);
      await logAdminAction(adminEmail, "SYSTEM", `Arsip kategori ID: ${deleteModal.id}`, "categories", deleteModal.id.toString());
      showToast("Kategori diarsipkan.");
      setDeleteModal({ isOpen: false, id: null });
      fetchCategories();
    } catch (err: any) { showToast("Gagal mengarsipkan.", "error"); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto relative overflow-x-hidden min-h-[80vh]">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Kategori Aset</h2>
          <p className="text-xs text-zinc-500 mt-1">Klasifikasi parameter komoditas.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsDrawerOpen(true); }}
          className="bg-[#C5A059] text-[#0F110F] px-6 py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#B38F4B] transition-colors shadow-lg shadow-[#C5A059]/10"
        >
          + Registrasi Kategori Baru
        </button>
      </div>

      {/* RENDER KOMPONEN TABEL */}
      <PaginatedTable data={categories} columns={columns} emptyMessage="Belum ada data kategori tercatat." />

      {/* --- OFF-CANVAS DRAWER --- */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetForm}></div>
        <div className={`absolute top-0 right-0 w-full md:w-[400px] h-full bg-[#121412] border-l border-[#2E3730] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="px-6 py-6 border-b border-[#2E3730] flex justify-between items-center bg-[#161B18]">
            <div>
              <h3 className="text-lg font-bold text-[#C5A059]">{editId ? "Koreksi Kategori" : "Registrasi Kategori"}</h3>
            </div>
            <button onClick={resetForm} className="text-zinc-500 hover:text-white text-xl">✕</button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            <form id="cat-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Nomenklatur</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Deskripsi (Opsional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none h-32 resize-none" />
              </div>
            </form>
          </div>
          <div className="p-6 border-t border-[#2E3730] bg-[#161B18]">
            <button type="submit" form="cat-form" disabled={loading} className="w-full bg-[#C5A059] text-[#0F110F] font-bold text-xs uppercase tracking-widest rounded py-4 hover:bg-[#B38F4B] disabled:opacity-50 transition-colors">
              {loading ? "Memproses..." : "Simpan Data"}
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL HAPUS --- */}
      <div className={`fixed inset-0 z-[110] flex items-center justify-center transition-all duration-300 ${deleteModal.isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteModal({ isOpen: false, id: null })}></div>
        <div className={`bg-[#121412] border border-[#2E3730] rounded shadow-2xl p-6 max-w-sm w-full relative transform transition-all duration-300 ease-out ${deleteModal.isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
          <h3 className="text-lg font-bold text-red-500 mb-2">Otorisasi Pengarsipan</h3>
          <p className="text-[10px] uppercase tracking-widest leading-relaxed text-zinc-400 mb-6">Arsip kategori ini? Anda tidak akan bisa membuat produk baru dengan kategori ini.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModal({ isOpen: false, id: null })} className="flex-1 bg-transparent border border-zinc-700 text-zinc-400 font-bold text-[10px] uppercase tracking-widest rounded py-3 hover:bg-zinc-900 transition-colors">Batal</button>
            <button onClick={executeDelete} disabled={loading} className="flex-1 bg-red-900/50 border border-red-800 text-red-400 font-bold text-[10px] uppercase tracking-widest rounded py-3 hover:bg-red-900 transition-colors">Arsipkan</button>
          </div>
        </div>
      </div>

      {/* --- TOAST --- */}
      <div className={`fixed bottom-8 right-8 z-[150] transition-all duration-300 ease-out transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none'}`}>
        <div className={`px-6 py-4 rounded shadow-2xl border-l-4 ${toast.type === 'success' ? 'bg-[#1C221E] border-[#C5A059]' : 'bg-[#221818] border-red-500'}`}>
          <p className="text-sm font-medium text-zinc-100 tracking-wide">{toast.message}</p>
        </div>
      </div>

    </div>
  );
}