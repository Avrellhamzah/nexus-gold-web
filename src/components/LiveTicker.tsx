"use client";

import { useState, useEffect } from "react";

export default function LiveTicker() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/harga-emas");
        const data = await res.json();
        // Kita tampilkan Harga Spot Murni (XAU) ke pengguna publik
        setPrice(data.rawGramPrice); 
      } catch (err) {
        console.error("Gagal menarik data ticker", err);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Update setiap 1 menit
    return () => clearInterval(interval);
  }, []);

  if (!price) return null; // Sembunyikan jika data belum siap

  return (
    <div className="bg-[#0F110F] border-b border-[#2E3730] text-[9px] py-2 px-6 flex justify-center md:justify-between items-center text-zinc-400 uppercase tracking-widest font-bold z-50 relative">
      <div className="hidden md:flex items-center gap-4">
        <span>Bursa Komoditas Global</span>
        <span className="text-zinc-700">|</span>
        <span>Mata Uang: IDR (Rupiah)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
        </span>
        <span className="text-green-500 tracking-[0.2em]">
          LIVE SPOT XAU/GR: Rp {new Intl.NumberFormat("id-ID").format(price)}
        </span>
      </div>
    </div>
  );
}