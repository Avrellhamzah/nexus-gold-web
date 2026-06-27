"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";

export default function AdminCRMPage() {
  const { user: adminUser } = useAuth();
  const { showToast } = useToast();
  
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Client 360 State
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientNotes, setClientNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isNoteLoading, setIsNoteLoading] = useState(false);

  useEffect(() => {
    fetchClientDirectory();
  }, []);

  // Filter pencarian klien lokal
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredClients(
        clients.filter(c => 
          c.full_name.toLowerCase().includes(lowerQuery) || 
          c.email.toLowerCase().includes(lowerQuery)
        )
      );
    }
  }, [searchQuery, clients]);

  const fetchClientDirectory = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_crm_client_directory');
    
    if (error) {
      showToast("Gagal memuat direktori klien.", "error");
    } else if (data) {
      setClients(data);
      setFilteredClients(data);
    }
    setLoading(false);
  };

  const fetchClientNotes = async (clientId: string) => {
    setIsNoteLoading(true);
    const { data, error } = await supabase
      .from("crm_notes")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (data) setClientNotes(data);
    setIsNoteLoading(false);
  };

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    fetchClientNotes(client.user_id);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedClient || !adminUser) return;

    const { error } = await supabase.from("crm_notes").insert([{
      client_id: selectedClient.user_id,
      admin_email: adminUser.email,
      note_content: newNote
    }]);

    if (error) {
      showToast("Gagal menyimpan catatan.", "error");
    } else {
      showToast("Catatan internal ditambahkan.", "success");
      setNewNote("");
      fetchClientNotes(selectedClient.user_id); // Refresh daftar catatan
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[85vh] flex flex-col md:flex-row gap-6 font-sans">
      
      {/* PANEL KIRI: DIREKTORI KLIEN */}
      <div className="w-full md:w-1/3 bg-[#121412] border border-[#2E3730] rounded-xl flex flex-col overflow-hidden shadow-lg">
        <div className="p-5 border-b border-[#2E3730] bg-[#161B18] shrink-0">
          <h2 className="text-sm font-bold text-[#C5A059] uppercase tracking-widest mb-4">Direktori CRM</h2>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Cari nama atau email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F110F] border border-[#2E3730] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C5A059] transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#2E3730]">
          {loading ? (
            <p className="p-8 text-center text-xs text-zinc-500 animate-pulse uppercase tracking-widest">Memuat Basis Data...</p>
          ) : filteredClients.length === 0 ? (
            <p className="p-8 text-center text-xs text-zinc-500 uppercase tracking-widest">Data Tidak Ditemukan</p>
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.user_id}
                onClick={() => handleSelectClient(client)}
                className={`w-full text-left p-5 transition-all hover:bg-[#1C221E] group ${selectedClient?.user_id === client.user_id ? "bg-[#1C221E] border-l-4 border-[#C5A059]" : "border-l-4 border-transparent"}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-bold text-zinc-200 truncate pr-2 group-hover:text-[#C5A059] transition-colors">{client.full_name}</p>
                  <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${client.kyc_status === 'VERIFIED' ? 'bg-green-900/30 text-green-500 border border-green-900/50' : 'bg-yellow-900/30 text-yellow-500 border border-yellow-900/50'}`}>
                    {client.kyc_status === 'VERIFIED' ? 'KYC' : 'UNVERIFIED'}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-500 truncate mb-3">{client.email}</p>
                <div className="flex justify-between items-end">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Total AUM</p>
                  <p className="text-xs font-black font-mono text-zinc-300">Rp {new Intl.NumberFormat('id-ID').format(client.total_invested)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* PANEL KANAN: CLIENT 360 PROFILE */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        {!selectedClient ? (
          <div className="flex-1 bg-[#121412] border border-[#2E3730] rounded-xl flex items-center justify-center">
            <div className="text-center opacity-50">
              <svg className="w-16 h-16 mx-auto mb-4 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <p className="text-xs text-[#C5A059] uppercase tracking-widest font-bold">Pilih Klien Untuk Melihat Profil 360</p>
            </div>
          </div>
        ) : (
          <>
            {/* Kartu Identitas & Metrik Keuangan */}
            <div className="bg-[#121412] border border-[#2E3730] rounded-xl p-6 shadow-lg shrink-0">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black font-[family-name:var(--font-playfair)] text-zinc-100">{selectedClient.full_name}</h2>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${selectedClient.kyc_status === 'VERIFIED' ? 'bg-green-900/20 text-green-500 border-green-900/50' : 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50'}`}>
                      {selectedClient.kyc_status}
                    </span>
                  </div>
                  <p className="text-sm font-mono text-zinc-400 mb-4">{selectedClient.email}</p>
                  
                  <div className="flex gap-3">
                    <a href={`mailto:${selectedClient.email}`} className="flex items-center gap-2 px-4 py-2 bg-[#1C221E] border border-[#2E3730] rounded text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:border-[#C5A059] hover:text-[#C5A059] transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Kirim Email
                    </a>
                  </div>
                </div>

                <div className="bg-[#161B18] border border-[#2E3730] rounded-lg p-5 w-full lg:w-auto min-w-[250px]">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Total Assets Under Management</p>
                  <p className="text-3xl font-black font-mono text-[#C5A059] mb-4">Rp {new Intl.NumberFormat('id-ID').format(selectedClient.total_invested)}</p>
                  <div className="pt-4 border-t border-[#2E3730] flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Total Transaksi</span>
                    <span className="text-sm font-mono font-bold text-zinc-200">{selectedClient.total_transactions} Dokumen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Log Aktivitas & Catatan Internal */}
            <div className="flex-1 bg-[#121412] border border-[#2E3730] rounded-xl flex flex-col overflow-hidden shadow-lg">
              <div className="p-5 border-b border-[#2E3730] bg-[#161B18] shrink-0 flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#C5A059] uppercase tracking-widest">Catatan Internal Admin</h3>
                <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold bg-red-900/20 px-2 py-1 rounded border border-red-900/30">Hanya Terlihat Oleh Admin</span>
              </div>

              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4 bg-[#0F110F]">
                {isNoteLoading ? (
                  <p className="text-center text-xs text-zinc-500 uppercase tracking-widest animate-pulse mt-4">Memuat Rekam Jejak...</p>
                ) : clientNotes.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-[#2E3730] rounded-lg bg-[#161B18]">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Belum ada catatan untuk klien ini.</p>
                  </div>
                ) : (
                  clientNotes.map((note) => (
                    <div key={note.id} className="bg-[#161B18] border border-[#2E3730] p-4 rounded-lg relative group">
                      <p className="text-sm text-zinc-300 leading-relaxed mb-3 whitespace-pre-wrap">{note.note_content}</p>
                      <div className="flex justify-between items-center text-[9px] font-mono text-zinc-600 border-t border-[#2E3730]/50 pt-2">
                        <span>Ditulis oleh: {note.admin_email}</span>
                        <span>{new Date(note.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} className="p-4 border-t border-[#2E3730] bg-[#161B18] shrink-0">
                <textarea
                  required
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Tambahkan catatan rahasia baru tentang klien ini..."
                  className="w-full bg-[#0F110F] border border-[#2E3730] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] resize-none mb-3 custom-scrollbar"
                />
                <div className="flex justify-end">
                  <button type="submit" disabled={!newNote.trim()} className="bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] px-6 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest hover:shadow-lg disabled:opacity-50 transition-all">
                    Simpan Catatan
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

    </div>
  );
}