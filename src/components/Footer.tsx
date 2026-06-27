"use client";

import Link from "next/link";

export default function Footer({ isDark }: { isDark: boolean }) {
  const theme = {
    bgFooter: isDark ? "bg-[#121412]" : "bg-[#1A241E]",
    textFooter: isDark ? "text-zinc-500" : "text-[#A2B5A9]",
    border: isDark ? "border-[#2E3730]" : "border-[#E1E5E2]",
    divider: isDark ? "border-zinc-800" : "border-[#27352A]",
  };

  return (
    <footer className={`border-t py-12 text-center text-xs tracking-wider transition-colors duration-700 ${theme.bgFooter} ${theme.border}`}>
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-xl font-black tracking-[0.3em] text-[#C5A059] uppercase mb-4 font-[family-name:var(--font-playfair)]">NEXUS GOLD</h2>
        <p className={`mb-8 ${theme.textFooter}`}>Sistem Perdagangan Komoditas Fisik & Penyimpanan Bernilai Tinggi.</p>
        <p className={`hover:text-[#C5A059] transition-colors mb-8 ${theme.textFooter}`}><Link href="/syarat-ketentuan" className="hover:text-[#C5A059] transition-colors">
         Syarat & Ketentuan Layanan
        </Link></p>
        <div className={`pt-8 border-t ${theme.divider} ${theme.textFooter}`}>
          &copy; 2026 NEXUS GOLD • Hak Cipta Dilindungi Undang-Undang Solusi Finansial Makro.
        </div>
      </div>
    </footer>
  );
}