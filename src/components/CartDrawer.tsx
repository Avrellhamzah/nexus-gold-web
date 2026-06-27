"use client";

import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function CartDrawer() {
  const { cart, isOpen, setIsOpen, removeFromCart } = useCart();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  // Otomatis sinkronisasi dengan tema yang dipilih di Navbar
  useEffect(() => {
    const checkTheme = () => setIsDark(localStorage.getItem("nexus-theme") === "dark");
    checkTheme(); // Cek saat pertama kali dimuat
    
    // Dengarkan perubahan tema secara real-time
    window.addEventListener("theme-changed", checkTheme);
    return () => window.removeEventListener("theme-changed", checkTheme);
  }, []);

  // Palet warna yang 100% konsisten dengan Katalog & Homepage
  const theme = {
    bgDrawer: isDark ? "bg-[#0F110F]" : "bg-[#FDFDFB]",
    border: isDark ? "border-[#2E3730]" : "border-[#E1E5E2]",
    textPrimary: isDark ? "text-zinc-100" : "text-[#1A241E]",
    textSecondary: isDark ? "text-zinc-400" : "text-[#3A4D40]",
    textMuted: isDark ? "text-zinc-500" : "text-[#6A7C70]",
    bgItem: isDark ? "bg-[#161B18]" : "bg-[#F3F5F4]",
    bgImage: isDark ? "bg-[#1C221E]" : "bg-[#EEF0EC]",
  };

  const totalAmount = cart.reduce((total: number, item: any) => total + (item.base_price * item.cartQuantity), 0);



  return (
    <>
      {/* Latar Belakang Gelap (Overlay) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel Keranjang (Sidebar) */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md z-[9999] shadow-2xl transition-transform duration-500 transform flex flex-col border-l ${theme.bgDrawer} ${theme.border} ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className={`flex justify-between items-center p-6 border-b ${theme.border}`}>
          <h2 className={`text-xl font-bold font-[family-name:var(--font-playfair)] ${theme.textPrimary}`}>Portofolio Seleksi</h2>
          <button onClick={() => setIsOpen(false)} className={`text-2xl hover:rotate-90 transition-transform ${theme.textSecondary}`}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {cart.length === 0 ? (
            
            // --- DESAIN BARU BRANKAS KOSONG ---
            <div className={`flex flex-col items-center justify-center h-full text-center space-y-4 ${theme.textMuted} opacity-70`}>
              {/* Ikon Brankas Minimalis SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 9v3"></path>
              </svg>
              <div>
                <p className={`font-bold text-xs tracking-widest uppercase mb-2 ${theme.textPrimary}`}>Brankas Kosong</p>
                <p className="text-[11px] max-w-[200px] mx-auto leading-relaxed">Belum ada aset komoditas yang dialokasikan ke dalam portofolio Anda.</p>
              </div>
            </div>
          ) : (
            cart.map((item: any) => {
              const primaryImg = item.product_images?.find((img: any) => img.is_primary)?.image_url 
                  || item.product_images?.[0]?.image_url 
                  || "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=500&auto=format&fit=crop";
              return(
              <div key={item.id} className={`flex gap-4 p-3 rounded border ${theme.bgItem} ${theme.border}`}>
                <div className={`relative w-16 h-16 flex-shrink-0 rounded border flex items-center justify-center overflow-hidden ${theme.bgImage} ${theme.border}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image 
                    src={primaryImg} 
                    alt={item.name || "Aset Nexus Gold"} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-multiply dark:mix-blend-normal"
                  />
                </div>
                <div className="flex-grow flex flex-col justify-center">
                  <h4 className={`text-sm font-bold ${theme.textPrimary}`}>{item.name}</h4>
                  <div className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${theme.textMuted}`}>
                    {item.cartQuantity} unit x {item.weight_grams}g
                  </div>
                  <div className={`text-sm font-bold mt-1 ${isDark ? 'text-green-400' : 'text-[#27352A]'}`}>
                    Rp {new Intl.NumberFormat("id-ID").format(item.base_price * item.cartQuantity)}
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className={`text-xs px-2 hover:text-red-500 transition-colors ${theme.textMuted}`}
                >
                  Hapus
                </button>
              </div>
            );})
          )}
        </div>

        <div className={`p-6 border-t ${theme.border} ${theme.bgDrawer}`}>
          <div className="flex justify-between items-center mb-6">
            <span className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>Estimasi Total</span>
            <span className={`text-2xl font-black ${isDark ? 'text-green-400' : 'text-[#27352A]'}`}>
              Rp {new Intl.NumberFormat("id-ID").format(totalAmount)}
            </span>
          </div>
          <button 
            onClick={() => {
              setIsOpen(false);
              router.push("/checkout");
            }}
            disabled={cart.length === 0}
            className="w-full bg-[#C5A059] text-[#0F110F] font-bold py-4 rounded hover:bg-[#B38F4B] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(197,160,89,0.15)]"
          >
            {cart.length === 0 ? "Portofolio Kosong" : "Proses Transaksi"}
          </button>
        </div>
      </div>
    </>
  );
}