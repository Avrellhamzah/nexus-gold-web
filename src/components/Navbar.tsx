"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { supabase } from "../lib/supabase"; // <-- Tambahkan import ini untuk fitur Logout

export default function Navbar({ isDark, toggleTheme }: { isDark: boolean, toggleTheme: () => void }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { user, isAdmin } = useAuth();

  // Jika berada di dalam Back-Office, sembunyikan Navbar Publik ini
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className={`w-full border-b backdrop-blur-md transition-colors duration-500 z-50 ${isDark ? 'bg-[#0F110F]/80 border-[#2E3730]' : 'bg-[#FDFDFB]/80 border-[#E1E5E2]'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C5A059] flex items-center justify-center rounded-sm">
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
          
          <div className={`w-px h-5 ${isDark ? 'bg-[#2E3730]' : 'bg-zinc-300'}`}></div>

          {user ? (
            <div className="flex items-center gap-4">
              
              {/* PINTASAN ADMIN */}
              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-2 bg-[#1C221E] border border-[#C5A059]/50 text-[#C5A059] px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#0F110F] transition-all shadow-sm">
                  Panel Eksekutif
                </Link>
              )}
              
              {/* MODUL PROFIL KLIEN (USER HUB) */}
              <div className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${isDark ? 'bg-black/20 border-transparent hover:border-[#2E3730]' : 'bg-black/5 border-transparent hover:border-zinc-200'}`}>
                
                {/* Info Identitas (Sembunyi di layar kecil) */}
                <div className="text-right hidden lg:block px-2">
                  <p className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {user?.user_metadata?.full_name?.split(' ')[0] || "Klien"}
                  </p>
                  <p className="text-[8px] text-[#C5A059] uppercase tracking-widest font-bold">Premium Account</p>
                </div>

                {/* Tombol Dasbor */}
                <Link href="/akun" className="bg-[#C5A059] text-[#0F110F] px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#B38F4B] transition-colors shadow-sm">
                  Dasbor
                </Link>

                {/* Tombol Pengaturan Akun */}
                <Link 
                  href="/akun/pengaturan" 
                  title="Pengaturan Akun"
                  className={`p-2 rounded-lg transition-all group ${isDark ? 'bg-[#161B18] text-zinc-400 hover:text-[#C5A059] border border-[#2E3730] hover:border-[#C5A059]/50' : 'bg-white text-zinc-500 hover:text-[#C5A059] border border-zinc-200 hover:border-[#C5A059]/50'}`}
                >
                  <svg className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>

                {/* Tombol Logout */}
                <button 
                  onClick={async () => await supabase.auth.signOut()}
                  title="Keluar / Logout"
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-900/30 text-red-500' : 'hover:bg-red-50 text-red-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
                
              </div>
            </div>
          ) : (
            <Link href="/masuk" className={`border px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${isDark ? 'border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10' : 'border-[#1A241E] text-[#1A241E] hover:bg-zinc-100'}`}>
              Masuk / Registrasi
            </Link>
          )}

          {/* SAKELAR TEMA (DARK/LIGHT) */}
          <button onClick={toggleTheme} className={`p-2.5 rounded-full transition-colors ${isDark ? 'bg-[#1C221E] text-[#C5A059] hover:bg-[#27302A]' : 'bg-[#F3F5F4] text-[#1A241E] hover:bg-[#E1E5E2]'}`}>
            {isDark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>

        {/* TOMBOL MENU MOBILE */}
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
        <div className={`md:hidden px-6 py-4 border-t shadow-2xl ${isDark ? 'border-[#2E3730] bg-[#0F110F]' : 'border-[#E1E5E2] bg-[#FDFDFB]'}`}>
          <div className="flex flex-col gap-4">
            <Link href="/katalog" onClick={() => setIsMobileMenuOpen(false)} className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Katalog</Link>
            <Link href="/syarat-ketentuan" onClick={() => setIsMobileMenuOpen(false)} className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Kepatuhan Legal</Link>
            
            {user ? (
              <div className={`mt-2 pt-4 border-t flex flex-col gap-4 ${isDark ? 'border-[#2E3730]' : 'border-zinc-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-full flex justify-center items-center text-[#C5A059] font-bold font-[family-name:var(--font-playfair)]">
                    {user?.user_metadata?.full_name?.charAt(0) || "K"}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{user?.user_metadata?.full_name || "Klien Premium"}</p>
                    <p className="text-[9px] text-[#C5A059] uppercase tracking-widest font-bold">Premium Account</p>
                  </div>
                </div>
                
                {isAdmin && (
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Panel Eksekutif</Link>
                )}
                
                <Link href="/akun" onClick={() => setIsMobileMenuOpen(false)} className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Dasbor Portofolio</Link>
                <Link href="/akun/pengaturan" onClick={() => setIsMobileMenuOpen(false)} className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Pengaturan Akun
                </Link>
                
                <button onClick={async () => { setIsMobileMenuOpen(false); await supabase.auth.signOut(); }} className="text-left text-xs font-bold uppercase tracking-widest text-red-500 pt-2">
                  Keluar (Logout)
                </button>
              </div>
            ) : (
              <div className={`mt-2 pt-4 border-t ${isDark ? 'border-[#2E3730]' : 'border-zinc-200'}`}>
                <Link href="/masuk" onClick={() => setIsMobileMenuOpen(false)} className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Masuk / Registrasi</Link>
              </div>
            )}
            
            <button onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }} className={`text-left text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'} pt-4`}>
              Ubah Tema ({isDark ? 'Mode Gelap Aktif' : 'Mode Terang Aktif'})
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}