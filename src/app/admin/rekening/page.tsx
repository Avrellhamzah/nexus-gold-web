"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../context/ToastContext";

export default function AdminRekeningPage() {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({ bank_name: "", account_number: "", account_name: "" });

  useEffect(() => { fetchBanks(); }, []);

  const fetchBanks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("bank_accounts").select("*").eq("is_active", true).order("created_at", { ascending: true });
    if (!error && data) setBanks(data);
    setLoading(false);
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("bank_accounts").insert([formData]);
    if (error) {
      showToast("Gagal menambah rekening", "error");
    } else {
      showToast("Rekening berhasil ditambahkan", "success");
      setFormData({ bank_name: "", account_number: "", account_name: "" });
      fetchBanks();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus rekening ini dari sistem?")) return;
    // Kita gunakan soft-delete (is_active = false) untuk menjaga integritas data historis
    const { error } = await supabase.from("bank_accounts").update({ is_active: false }).eq("id", id);
    if (error) showToast("Gagal menghapus", "error");
    else { showToast("Rekening dihapus", "success"); fetchBanks(); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="border-b border-[#2E3730] pb-6">
        <h2 className="text-2xl font-bold text-zinc-100 font-[family-name:var(--font-playfair)]">Manajemen Rekening Kas</h2>
        <p className="text-xs text-zinc-500 mt-1">Daftar bank penerima dana yang akan tampil di halaman klien.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-[#121412] border border-[#2E3730] rounded-xl p-6 h-fit">
          <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-widest mb-4 border-b border-[#2E3730] pb-2">Tambah Rekening Baru</h3>
          <form onSubmit={handleAddBank} className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest">Nama Bank</label>
              <input required type="text" value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} placeholder="Cth: BCA Prioritas" className="w-full bg-[#161B18] border border-[#2E3730] rounded p-2 text-sm mt-1 text-white" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest">Nomor Rekening</label>
              <input required type="text" value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} placeholder="Cth: 872019..." className="w-full bg-[#161B18] border border-[#2E3730] rounded p-2 text-sm mt-1 text-white font-mono" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest">Nama Pemilik (A.N)</label>
              <input required type="text" value={formData.account_name} onChange={(e) => setFormData({...formData, account_name: e.target.value})} placeholder="Cth: PT Nexus Gold" className="w-full bg-[#161B18] border border-[#2E3730] rounded p-2 text-sm mt-1 text-white" />
            </div>
            <button type="submit" className="w-full bg-[#C5A059] text-[#0F110F] text-xs font-bold uppercase tracking-widest py-3 rounded hover:bg-[#B38F4B] mt-2">Simpan Rekening</button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          {loading ? <p className="text-zinc-500 text-sm">Memuat data bank...</p> : banks.map((bank) => (
            <div key={bank.id} className="bg-[#161B18] border border-[#2E3730] rounded-lg p-5 flex justify-between items-center group">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-zinc-100">{bank.bank_name}</span>
                  <span className="text-[9px] px-2 py-0.5 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 rounded">AKTIF</span>
                </div>
                <p className="text-lg font-mono text-zinc-300">{bank.account_number}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">A.N {bank.account_name}</p>
              </div>
              <button onClick={() => handleDelete(bank.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 border border-red-900/50 rounded bg-red-900/10">Hapus</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}