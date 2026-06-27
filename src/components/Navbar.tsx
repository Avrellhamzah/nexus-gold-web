"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { createPortal } from "react-dom";

export default function Navbar({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kunci scroll hanya saat menu terbuka
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className={`w-full border-b backdrop-blur-md px-6 py-4 flex justify-between items-center transition-colors duration-700 ${isDark ? 'bg-[#0F110F]/90 border-[#2E3730]' : 'bg-[#FDFDFB]/95 border-[#E1E5E2]'}`}>
        <Link href="/" className="font-black text-sm tracking-[0.2em] text-[#C5A059] font-[family-name:var(--font-playfair)]">
          NEXUS GOLD
        </Link>
        
        {/* DESKTOP MENU */}
        <div className={`hidden md:flex items-center gap-6 text-xs uppercase tracking-wider font-bold ${isDark ? 'text-zinc-400' : 'text-[#3A4D40]'}`}>
          <Link href="/#hero" className="hover:text-[#C5A059] transition-colors">Visi</Link>
          <Link href="/katalog" className="hover:text-[#C5A059] transition-colors">Katalog</Link>
          <Link href="/#artikel" className="hover:text-[#C5A059] transition-colors">Wawasan</Link>
          <Link href={user ? "/akun" : "/masuk"} className="px-4 py-2 bg-[#C5A059] text-[#0F110F] rounded-sm text-[10px] tracking-widest font-bold hover:bg-[#B38F4B] transition-colors">
            {user ? "Portofolio" : "Daftar / Masuk"}
          </Link>
          <button onClick={toggleTheme} className="p-2 rounded-full border transition-colors hover:border-[#C5A059] ${isDark ? 'border-zinc-700' : 'border-[#E1E5E2]'}">
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>

        {/* TOMBOL HAMBURGER MOBILE */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-[#C5A059] p-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </nav>

      {/* MOBILE MENU PORTAL DENGAN ANIMASI SMOOTH */}
      {mounted && isMobileMenuOpen && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex justify-end overflow-hidden" style={{ isolation: 'isolate' }}>
          
          {/* Latar Belakang Blur (Animasi Fade In) */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}></div>
          
          {/* Laci Menu (Animasi Slide In Dari Kanan) */}
          <div className={`relative w-[85%] max-w-[320px] h-[100dvh] flex flex-col shadow-2xl animate-slide-in-right transform-gpu border-l ${isDark ? 'bg-[#0F110F] border-[#2E3730] text-zinc-100' : 'bg-[#FDFDFB] border-[#E1E5E2] text-[#1A241E]'}`}>
            
            {/* Header Menu */}
            <div className={`flex-none flex justify-between items-center p-6 border-b ${isDark ? 'border-[#2E3730]' : 'border-[#E1E5E2]'}`}>
              <span className="font-black text-sm tracking-[0.2em] text-[#C5A059] font-[family-name:var(--font-playfair)]">MENU</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className={`p-2 text-xl transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-[#3A4D40] hover:text-black'}`}>✕</button>
            </div>
            
            {/* Konten Link */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 text-xl uppercase tracking-widest font-bold">
              <Link href="/#hero" onClick={() => setIsMobileMenuOpen(false)} className="w-fit hover:text-[#C5A059] transition-colors">Visi</Link>
              <Link href="/katalog" onClick={() => setIsMobileMenuOpen(false)} className="w-fit hover:text-[#C5A059] transition-colors">Katalog</Link>
              <Link href="/#artikel" onClick={() => setIsMobileMenuOpen(false)} className="w-fit hover:text-[#C5A059] transition-colors">Wawasan</Link>
            </div>
            
            {/* Footer Tombol */}
            <div className={`flex-none p-8 border-t ${isDark ? 'border-[#2E3730]' : 'border-[#E1E5E2]'}`}>
              <Link 
                href={user ? "/akun" : "/masuk"} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center w-full py-4 bg-[#C5A059] text-[#0F110F] rounded text-xs font-bold uppercase tracking-widest hover:bg-[#B38F4B] transition-all shadow-[0_0_20px_rgba(197,160,89,0.15)]"
              >
                {user ? "Portofolio Anda" : "Daftar / Masuk"}
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}