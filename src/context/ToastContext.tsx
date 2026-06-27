"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as ToastType, trigger: 0 });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ show: true, message, type, trigger: Date.now() });
  };

  useEffect(() => {
    if (toast.show) {
      // Notifikasi akan otomatis hilang setelah 4 detik
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.trigger, toast.show]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* UI NOTIFIKASI MEWAH (TOAST) */}
      <div className={`fixed bottom-8 right-8 z-[99999] transition-all duration-500 ease-out transform ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className={`px-6 py-4 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] border-l-4 flex items-center gap-4 min-w-[320px] max-w-md backdrop-blur-md ${
          toast.type === 'success' ? 'bg-[#1C221E]/95 border-[#C5A059] text-zinc-100' : 
          toast.type === 'error' ? 'bg-[#221818]/95 border-red-500 text-zinc-100' : 
          'bg-[#121412]/95 border-blue-500 text-zinc-100'
        }`}>
          
          {/* Ikon Dinamis */}
          {toast.type === 'success' && (
            <div className="w-8 h-8 rounded-full bg-[#C5A059]/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
          )}
          {toast.type === 'error' && (
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
          )}
          {toast.type === 'info' && (
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          )}

          <div className="flex flex-col">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${toast.type === 'success' ? 'text-[#C5A059]' : toast.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
              {toast.type === 'success' ? 'Sistem Dikonfirmasi' : toast.type === 'error' ? 'Otorisasi Gagal' : 'Informasi Sistem'}
            </span>
            <p className="text-sm font-medium tracking-wide mt-0.5 leading-snug">{toast.message}</p>
          </div>
          
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast harus digunakan di dalam ToastProvider");
  return context;
};