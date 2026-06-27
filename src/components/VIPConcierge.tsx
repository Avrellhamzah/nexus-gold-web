"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function VIPConcierge({ isDark = true }: { isDark?: boolean }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Tarik Data Historis & Aktifkan Radar Realtime
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("concierge_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel("realtime:concierge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "concierge_messages", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setMessages((prev) => {
            const isDuplicate = prev.some((msg) => msg.id === payload.new.id);
            return isDuplicate ? prev : [...prev, payload.new];
          });
          // Matikan indikator mengetik saat balasan dari admin masuk
          if (payload.new.sender_type === "concierge") setIsTyping(false); 
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // 2. Auto-scroll presisi ke pesan terbaru
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isTyping]);

  // 3. Mesin Pengirim Pesan (Optimistic UI)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const tempMessage = newMessage;
    setNewMessage(""); 

    // Tampilkan di layar pengguna sebelum server merespons (menghindari jeda/lag)
    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev, 
      { id: tempId, user_id: user.id, sender_type: "client", content: tempMessage, created_at: new Date().toISOString() }
    ]);

    // Beri ilusi bahwa Concierge sedang bersiap membalas
    setTimeout(() => setIsTyping(true), 1000);

    const { error } = await supabase.from("concierge_messages").insert([{
      user_id: user.id,
      sender_type: "client",
      content: tempMessage,
    }]);

    if (error) {
      console.error("Gagal mengirim pesan", error);
      setIsTyping(false);
      // Tarik kembali pesan dari layar jika transmisi gagal
      setMessages((prev) => prev.filter(msg => msg.id !== tempId)); 
    }
  };

  // Sembunyikan sepenuhnya dari tamu yang belum login
  if (!user) return null;

  const theme = {
    bgApp: isDark ? "bg-[#121412]/95" : "bg-white/95",
    border: isDark ? "border-[#2E3730]" : "border-[#E1E5E2]",
    clientBubble: "bg-[#C5A059] text-[#0F110F]",
    conciergeBubble: isDark ? "bg-[#1C221E] text-zinc-200" : "bg-zinc-100 text-zinc-800",
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      
      {/* KOTAK PERCAKAPAN */}
      <div className={`absolute bottom-20 right-0 w-[340px] h-[480px] backdrop-blur-xl border rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? "scale-100 opacity-100 visible" : "scale-50 opacity-0 invisible"} ${theme.bgApp} ${theme.border}`}>
        
        {/* Header (Top Bar) */}
        <div className={`p-4 flex justify-between items-center border-b rounded-t-2xl bg-gradient-to-r from-[#161B18] to-[#121412] ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center font-[family-name:var(--font-playfair)] text-[#C5A059] font-black text-lg">N</div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#121412] rounded-full"></div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">VIP Concierge</h4>
              <p className="text-[9px] uppercase tracking-widest text-[#C5A059] font-bold">Online • Enkripsi E2E</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white text-lg">✕</button>
        </div>

        {/* Ruang Pesan (Body) */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
          <div className="flex justify-start">
            <div className={`max-w-[85%] p-3 rounded-2xl rounded-tl-sm text-sm ${theme.conciergeBubble}`}>
              Salam sejahtera, {user.user_metadata?.full_name?.split(' ')[0] || 'Klien Premium'}. Saya adalah Wealth Advisor pribadi Anda. Ada yang bisa saya bantu terkait akuisisi aset Anda hari ini?
            </div>
          </div>

          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`flex ${msg.sender_type === "client" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.sender_type === "client" ? `rounded-tr-sm ${theme.clientBubble}` : `rounded-tl-sm ${theme.conciergeBubble}`}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Animasi Mengetik */}
          {isTyping && (
            <div className="flex justify-start animate-fade">
              <div className={`p-4 rounded-2xl rounded-tl-sm flex gap-1 items-center ${theme.conciergeBubble}`}>
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Kolom Input Text */}
        <form onSubmit={handleSendMessage} className={`p-3 border-t flex gap-2 ${theme.border}`}>
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Kirim instruksi Anda..." 
            className={`flex-1 bg-transparent border ${theme.border} rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#C5A059] ${isDark ? "text-white" : "text-black"}`} 
          />
          <button type="submit" disabled={!newMessage.trim()} className="bg-[#C5A059] text-[#0F110F] px-4 py-2 rounded-lg font-bold hover:bg-[#B38F4B] disabled:opacity-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </form>
      </div>

      {/* TOMBOL PEMICU WIDGET */}
      <button onClick={() => setIsOpen(!isOpen)} className="w-14 h-14 bg-gradient-to-r from-[#C5A059] to-[#8C6D31] rounded-full shadow-[0_0_20px_rgba(197,160,89,0.3)] flex items-center justify-center hover:scale-105 transition-transform z-50 relative">
        {isOpen ? (
          <svg className="w-6 h-6 text-[#0F110F]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6 text-[#0F110F]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>
    </div>
  );
}