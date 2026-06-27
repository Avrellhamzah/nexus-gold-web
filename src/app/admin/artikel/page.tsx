"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

export default function BuatArtikelPage() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from("articles")
        .insert([{ title, excerpt, content }]);

      if (error) throw error;

      setStatusMessage({ type: "success", text: "Riset finansial berhasil dipublikasikan ke publik." });
      setTitle("");
      setExcerpt("");
      setContent("");
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Gagal memublikasikan artikel: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F110F] text-zinc-100 p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <header className="flex justify-between items-center mb-8 border-b border-[#2E3730] pb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#C5A059] tracking-wider font-[family-name:var(--font-playfair)]">Penerbitan Wawasan Finansial</h1>
            <p className="text-xs text-zinc-500 mt-1">Tulis artikel analisis makro dan edukasi komoditas emas resmi.</p>
          </div>
          <Link href="/admin" className="px-4 py-2 bg-[#161B18] border border-[#2E3730] text-zinc-300 rounded hover:text-[#C5A059] transition-colors text-xs font-bold uppercase tracking-wider">
            Kembali
          </Link>
        </header>

        {statusMessage && (
          <div className={`p-4 rounded border mb-6 text-xs font-semibold tracking-wide transition-all ${
            statusMessage.type === "success" ? "bg-green-950/40 text-green-400 border-green-800/50" : "bg-red-950/40 text-red-400 border-red-800/50"
          }`}>
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#121412] border border-[#2E3730] rounded-lg p-6 space-y-6 shadow-xl">
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-2">Judul Artikel</label>
            <input 
              required 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cth: Analisis Teknikal Emas Jelang Kebijakan Suku Bunga" 
              className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none transition-colors text-zinc-100 placeholder-zinc-600"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-2">Ringkasan Pendek (Excerpt)</label>
            <input 
              required 
              type="text" 
              value={excerpt} 
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Garis besar artikel dalam 1-2 kalimat untuk tampilan kartu depan..." 
              className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none transition-colors text-zinc-100 placeholder-zinc-600"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-2">Isi Artikel Lengkap</label>
            <textarea 
              required 
              rows={12} 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis narasi, data, dan edukasi finansial secara mendalam di sini..." 
              className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none transition-colors text-zinc-100 placeholder-zinc-600 font-serif leading-relaxed"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#C5A059] text-[#0F110F] font-bold uppercase tracking-widest text-xs py-3.5 rounded hover:bg-[#B38F4B] transition-all cursor-pointer disabled:opacity-50 shadow-lg"
          >
            {loading ? "Menyandikan Artikel..." : "Publikasikan Naskah"}
          </button>
        </form>

      </div>
    </div>
  );
}