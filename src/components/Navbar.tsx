"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar({ isDark, toggleTheme }: { isDark: boolean, toggleTheme: () => void }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Mengambil state 'user' dan status 'isAdmin' yang sudah diolah oleh Context
  const { user, isAdmin } = useAuth();

  // Jika berada di dalam Back-Office, sembunyikan Navbar Publik ini
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className={`w-full border-b backdrop-blur-md transition-colors duration-500 z-50 ${isDark ? 'bg-[#0F110F]/80 border-[#2E3730]' : 'bg-[#FDFDFB]/80 border-[#E1E5E2]'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C5A059] flex items-center justify-center">
            <span className="text-[#0F110F] font-black text-lg font-[family-name:var(--font-playfair)]">N</span>
          </div>
          <span className={`text-xs md:text-sm font-black tracking-[0.2em] uppercase ${isDark ? 'text-[#C5A059]' : 'text-[#1A241E]'}`}>
            Nexus Gold
          </span>
        </Link>

        {/* MENU DESKTOP */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/katalog" className={`text-xs font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Katalog</Link>
          <Link href="/syarat-ketentuan" className={`text-xs font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Kepatuhan Legal</Link>
          
          <div className="w-px h-5 bg-zinc-700/30"></div>

          {user ? (
            <div className="flex items-center gap-4">
              
              {/* TOMBOL PINTASAN ADMIN (DITAMPILKAN SECARA DINAMIS) */}
              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-2 bg-[#1C221E] border border-[#C5A059]/50 text-[#C5A059] px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#0F110F] transition-all shadow-sm">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Panel Eksekutif
                </Link>
              )}
              
              <Link href="/akun" className="bg-[#C5A059] text-[#0F110F] px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-[#B38F4B] transition-colors">
                Dasbor Klien
              </Link>
            </div>
          ) : (
            <Link href="/masuk" className={`border px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-colors ${isDark ? 'border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10' : 'border-[#1A241E] text-[#1A241E] hover:bg-zinc-100'}`}>
              Masuk / Registrasi
            </Link>
          )}

          <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-[#1C221E] text-[#C5A059] hover:bg-[#27302A]' : 'bg-[#F3F5F4] text-[#1A241E] hover:bg-[#E1E5E2]'}`}>
            {isDark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>

        {/* TOMBOL MENU MOBILE (OPSIONAL) */}
        <button 
          className="md:hidden p-2 text-zinc-500 hover:text-[#C5A059]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

      </div>

      {/* DROPDOWN MENU MOBILE */}
      {isMobileMenuOpen && (
        <div className={`md:hidden px-6 py-4 border-t ${isDark ? 'border-[#2E3730] bg-[#0F110F]' : 'border-[#E1E5E2] bg-[#FDFDFB]'}`}>
          <div className="flex flex-col gap-4">
            <Link href="/katalog" className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Katalog</Link>
            <Link href="/syarat-ketentuan" className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Kepatuhan Legal</Link>
            
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Panel Eksekutif</Link>
                )}
                <Link href="/akun" className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Dasbor Klien</Link>
              </>
            ) : (
              <Link href="/masuk" className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Masuk / Registrasi</Link>
            )}
            
            <button onClick={toggleTheme} className="text-left text-xs font-bold uppercase tracking-widest text-zinc-500">
              Ubah Tema ({isDark ? 'Gelap' : 'Terang'})
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}