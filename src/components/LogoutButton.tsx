"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase"; // Sesuaikan path ini jika posisi file berbeda

export default function LogoutButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Hapus sesi di server Supabase
      await supabase.auth.signOut();
      
      // 2. Hancurkan tiket (Cookie)
      document.cookie = "sb-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // 3. Arahkan ke halaman Login
      router.push("/masuk");
    } catch (error) {
      console.error("Kesalahan sistem saat logout:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* --- TOMBOL LOGOUT DI SIDEBAR/HEADER --- */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-zinc-400 rounded transition-all duration-200 hover:bg-red-950/30 hover:text-red-400 group"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" height="18" 
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-zinc-500 group-hover:text-red-400 transition-colors"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Akhiri Sesi
      </button>

      {/* --- CARD WARNING (MODAL KONFIRMASI) --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-500 ease-out">
          <div className="bg-[#121412] border border-[#2E3730] rounded-lg shadow-2xl p-6 max-w-sm w-full transform transition-all duration-300 scale-100 opacity-100">
            
            {/* Header Modal */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-950/50 border border-red-900 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Otorisasi Keluar</h3>
            </div>

            {/* Body Text */}
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Anda akan keluar dari Dasbor Nexus Gold. Anda memerlukan kredensial otorisasi untuk dapat mengakses kembali sistem manajemen ini.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setIsOpen(false)} 
                disabled={isLoggingOut}
                className="flex-1 bg-transparent border border-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded py-3 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Kembali
              </button>
              <button 
                onClick={handleLogout} 
                disabled={isLoggingOut}
                className="flex-1 bg-red-900/80 text-red-50 font-bold text-xs uppercase tracking-wider rounded py-3 hover:bg-red-800 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {isLoggingOut ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memutus...
                  </>
                ) : (
                  "Ya, Akhiri Sesi"
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}