"use client";

import { useEffect } from "react";

interface SoftNotificationProps {
  message: string;
  onClose: () => void;
}

export default function SoftNotification({ message, onClose }: SoftNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500); // Otomatis hilang dalam 3.5 detik
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[200] animate-slide-up">
      <div className="bg-[#1A241E]/90 dark:bg-[#0F110F]/90 border border-[#C5A059]/40 backdrop-blur-md px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 text-zinc-100">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C5A059]"></span>
        </span>
        <p className="text-xs font-bold tracking-wide uppercase font-sans">{message}</p>
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-xs ml-2">✕</button>
      </div>
    </div>
  );
}