"use client";

import React, { useEffect, useRef, memo } from 'react';

function TradingViewChart({ isDark }: { isDark: boolean }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Membersihkan kontainer agar grafik tidak ganda saat halaman dimuat ulang (React Strict Mode)
    if (container.current) {
      container.current.innerHTML = '';
    }

    // 2. Membangun skrip widget TradingView
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // 3. Konfigurasi XAU/USD dengan tema dinamis yang merespons mode gelap/terang aplikasi Anda
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": "OANDA:XAUUSD",
      "interval": "60", // Grafik per 1 jam
      "timezone": "Asia/Jakarta",
      "theme": isDark ? "dark" : "light",
      "style": "1", // Gaya Candlestick
      "locale": "id",
      "enable_publishing": false,
      "backgroundColor": isDark ? "#121412" : "#FDFDFB", // Selaras dengan palet Nexus Gold
      "gridColor": isDark ? "#2E3730" : "#E1E5E2",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "allow_symbol_change": false,
      "support_host": "https://www.tradingview.com"
    });

    // 4. Menyuntikkan skrip ke dalam HTML
    if (container.current) {
      container.current.appendChild(script);
    }
  }, [isDark]);

  return (
    <div className="w-full h-full rounded overflow-hidden" ref={container}></div>
  );
}

// Menggunakan memo agar komponen tidak dirender ulang kecuali mode gelap/terang berubah
export default memo(TradingViewChart);