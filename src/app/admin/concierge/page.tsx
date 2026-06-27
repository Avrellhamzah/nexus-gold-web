"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../context/ToastContext";

export default function AdminConciergePage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchConversations();
    
    // Dengarkan jika ada klien baru yang mengirim pesan pertama kali
    const channel = supabase
      .channel("admin:concierge_list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "concierge_messages" }, () => {
        fetchConversations(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchConversations = async () => {
    // MEMANGGIL FUNGSI RPC YANG BARU SAJA KITA BUAT DI SUPABASE
    const { data, error } = await supabase.rpc('get_concierge_conversations');
    
    if (error) {
      console.error("Gagal menarik antrean:", error.message);
      return;
    }

    if (data) {
      setConversations(data);
    }
  };

  useEffect(() => {
    if (!selectedUser) return;

    const fetchUserMessages = async () => {
      const { data } = await supabase
        .from("concierge_messages")
        .select("*")
        .eq("user_id", selectedUser.user_id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };

    fetchUserMessages();

    const channel = supabase
      .channel(`admin:chat:${selectedUser.user_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "concierge_messages", filter: `user_id=eq.${selectedUser.user_id}` },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some(m => m.id === payload.new.id);
            return exists ? prev : [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUser) return;

    const textToSend = replyText;
    setReplyText("");

    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: tempId, user_id: selectedUser.user_id, sender_type: "concierge", content: textToSend, created_at: new Date().toISOString() }
    ]);

    const { error } = await supabase.from("concierge_messages").insert([{
      user_id: selectedUser.user_id,
      sender_type: "concierge",
      content: textToSend
    }]);

    if (error) {
      showToast("Gagal mengirim transmisi.", "error");
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[80vh] flex flex-col md:flex-row gap-6">
      
      {/* SIDEBAR: DAFTAR KLIEN */}
      <div className="w-full md:w-1/3 bg-[#121412] border border-[#2E3730] rounded-xl flex flex-col overflow-hidden">
        <div className="p-5 border-b border-[#2E3730] bg-[#161B18]">
          <h2 className="text-sm font-bold text-[#C5A059] uppercase tracking-widest">Antrean VIP</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Daftar klien yang membutuhkan asistensi.</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#2E3730]">
          {conversations.length === 0 ? (
             <p className="p-5 text-xs text-zinc-500 text-center">Belum ada transmisi masuk.</p>
          ) : conversations.map((conv, idx) => {
            const isSelected = selectedUser?.user_id === conv.user_id;

            return (
              <button
                key={idx}
                onClick={() => setSelectedUser(conv)}
                className={`w-full text-left p-4 transition-all hover:bg-[#1C221E] ${isSelected ? "bg-[#1C221E] border-l-4 border-[#C5A059]" : "border-l-4 border-transparent"}`}
              >
                <p className="text-sm font-bold text-zinc-200 truncate">{conv.client_name}</p>
                <p className="text-[10px] font-mono text-zinc-500 truncate">{conv.client_email}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* AREA UTAMA: JENDELA OBROLAN */}
      <div className="w-full md:w-2/3 bg-[#121412] border border-[#2E3730] rounded-xl flex flex-col overflow-hidden relative">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs uppercase tracking-widest">
            Pilih Klien untuk Memulai Komunikasi
          </div>
        ) : (
          <>
            {/* Header Chat Admin */}
            <div className="p-5 border-b border-[#2E3730] bg-[#161B18] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">{selectedUser.client_name}</h3>
                <p className="text-[10px] text-zinc-500 font-mono">{selectedUser.client_email}</p>
              </div>
              <span className="bg-green-900/30 text-green-500 border border-green-900/50 px-2 py-1 rounded text-[9px] uppercase tracking-widest font-bold">Terhubung</span>
            </div>

            {/* Ruang Pesan */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4 bg-[#0F110F]">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.sender_type === "concierge" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] p-3 text-sm rounded-xl ${
                    msg.sender_type === "concierge" 
                      ? "bg-[#C5A059] text-[#0F110F] rounded-tr-sm" 
                      : "bg-[#1C221E] text-zinc-200 border border-[#2E3730] rounded-tl-sm"
                  }`}>
                    {msg.content}
                    <div className={`text-[9px] font-mono mt-1 ${msg.sender_type === "concierge" ? "text-[#0F110F]/60 text-right" : "text-zinc-500 text-left"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Admin */}
            <form onSubmit={handleReply} className="p-4 border-t border-[#2E3730] bg-[#161B18] flex gap-3 shrink-0">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Ketik balasan untuk klien..."
                className="flex-1 bg-[#0F110F] border border-[#2E3730] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059]"
              />
              <button type="submit" disabled={!replyText.trim()} className="bg-[#C5A059] text-[#0F110F] px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-[#B38F4B] disabled:opacity-50 transition-colors">
                Kirim
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}