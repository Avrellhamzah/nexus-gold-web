"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from "../../components/LogoutButton";
import { useState, useEffect } from 'react';

// --- IKON SVG UNTUK SIDEBAR ---
const Icons = {
  Dashboard: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  CRM: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Concierge: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  Category: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  Product: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Order: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
  Invoice: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Bank: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  KYC: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Audit: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
};

// --- STRUKTUR NAVIGASI BARU (DENGAN CRM, CONCIERGE, DAN REKENING BANK) ---
const navigationGroups = [
  { title: "Tinjauan Eksekutif", items: [
    { name: "Dasbor Utama", path: "/admin", icon: Icons.Dashboard }
  ] },
  { title: "Relasi Klien", items: [
    { name: "Direktori CRM", path: "/admin/crm", icon: Icons.CRM },
    { name: "VIP Concierge", path: "/admin/concierge", icon: Icons.Concierge }
  ] },
  { title: "Manajemen Inventaris", items: [
    { name: "Kategori Komoditas", path: "/admin/kategori", icon: Icons.Category }, 
    { name: "Katalog Master", path: "/admin/produk", icon: Icons.Product }
  ] },
  { title: "Finansial & Logistik", items: [
    { name: "Rekening Kas", path: "/admin/rekening", icon: Icons.Bank },
    { name: "Buku Besar (Invoice)", path: "/admin/transaksi", icon: Icons.Invoice },
    { name: "Pusat Logistik", path: "/admin/pesanan", icon: Icons.Order }
  ] },
  { title: "Kepatuhan & Keamanan", items: [
    { name: "Verifikasi KYC", path: "/admin/kyc", icon: Icons.KYC }, 
    { name: "Log Audit Sistem", path: "/admin/audit", icon: Icons.Audit }
  ] }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // STATE UNTUK DROPDOWN PROFIL

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isSidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen bg-[#0F110F] text-zinc-100 font-sans antialiased overflow-hidden">
      
      {/* OVERLAY UNTUK MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* SIDEBAR STRUKTURAL */}
      <aside className={`fixed md:relative top-0 left-0 h-full w-64 bg-[#121412] border-r border-[#2E3730] flex flex-col justify-between shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="h-20 flex items-center justify-between px-6 border-b border-[#2E3730] bg-[#161B18] sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#C5A059] rounded-sm flex items-center justify-center">
                <span className="text-[#0F110F] font-black text-xs font-[family-name:var(--font-playfair)]">N</span>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#C5A059]">NEXUS GOLD</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <nav className="p-4 space-y-6">
            {navigationGroups.map((group, idx) => (
              <div key={idx}>
                <div className="text-[9px] uppercase tracking-widest text-zinc-600 px-4 mb-2 font-bold">{group.title}</div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link 
                        key={item.path} href={item.path} onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-md transition-all duration-200 border-l-2
                          ${isActive ? 'bg-[#1C221E] text-[#C5A059] border-[#C5A059] shadow-inner' : 'border-transparent text-zinc-400 hover:bg-[#161B18] hover:text-zinc-200'}`}
                      >
                        <span className={isActive ? 'text-[#C5A059]' : 'text-zinc-500'}>{item.icon}</span>
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#2E3730] bg-[#161B18] flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Sistem Stabil</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">{currentTime}</span>
          </div>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 w-full">
        
        {/* TOPBAR / ATASAN KERJA */}
        <header className="h-20 bg-[#121412]/90 backdrop-blur-md border-b border-[#2E3730] flex items-center justify-between px-4 md:px-8 z-20">
          
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-zinc-400 hover:text-[#C5A059] transition-colors p-2 -ml-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="hidden md:inline-block text-[10px] uppercase tracking-widest text-zinc-500 font-bold border border-[#2E3730] px-2.5 py-1 rounded bg-[#161B18]">
              Environment: Production
            </span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <button className="text-zinc-500 hover:text-[#C5A059] transition-colors relative hidden md:block">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="hidden md:block h-5 w-px bg-[#2E3730]"></div>

            {/* --- DROPDOWN PROFIL ADMIN --- */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 focus:outline-none group"
              >
                <div className="hidden md:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">Admin Utama</span>
                  <span className="text-[9px] text-[#C5A059] uppercase tracking-widest group-hover:text-[#B38F4B] transition-colors">Akses Penuh</span>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded bg-[#1C221E] border border-[#C5A059]/30 flex items-center justify-center text-xs md:text-sm font-bold text-[#C5A059] shadow-sm group-hover:bg-[#C5A059]/10 group-hover:border-[#C5A059] transition-all">
                  A
                </div>
                <svg className={`hidden md:block w-3.5 h-3.5 text-zinc-500 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-4 w-52 bg-[#161B18] border border-[#2E3730] rounded-lg shadow-2xl z-50 py-1.5 transform origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Muncul hanya di Mobile agar konteks akun jelas */}
                    <div className="px-4 py-3 border-b border-[#2E3730] md:hidden">
                       <p className="text-xs font-bold text-zinc-200">Admin Utama</p>
                       <p className="text-[9px] text-[#C5A059] uppercase tracking-widest mt-0.5">Akses Penuh</p>
                    </div>
                    
                    <div className="px-4 py-2.5 text-[11px] font-bold text-zinc-400 hover:text-zinc-200 hover:bg-[#1C221E] transition-colors cursor-not-allowed flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Pengaturan Sistem
                    </div>
                    
                    <div className="w-full h-px bg-[#2E3730] my-1"></div>

                    {/* Pembungkus Logout yang Memanipulasi Desain Komponen Asli */}
                    <div className="px-4 py-2 hover:bg-red-900/20 transition-colors group cursor-pointer">
                      <div className="[&>button]:w-full [&>button]:text-left [&>button]:text-[11px] [&>button]:font-bold [&>button]:text-red-500 [&>button]:group-hover:text-red-400 [&>button]:py-1">
                        <LogoutButton />
                      </div>
                    </div>

                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#0F110F] custom-scrollbar w-full">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500 w-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}