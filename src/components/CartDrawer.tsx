"use client";

import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function CartDrawer() {
  const { cart, isOpen, setIsOpen, removeFromCart } = useCart();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  // Otomatis sinkronisasi setiap kali laci keranjang dibuka
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(localStorage.getItem("nexus-theme") === "dark");
    };
    
    checkTheme(); // Cek saat komponen dimuat atau laci dibuka
    
    // Dengarkan perubahan penyimpanan (berguna jika admin mengubah tema di tab lain)
    window.addEventListener("storage", checkTheme);
    // Custom event pendengar (jika Anda memasang dispatch event di Navbar)
    window.addEventListener("theme-changed", checkTheme);
    
    return () => {
      window.removeEventListener("storage", checkTheme);
      window.removeEventListener("theme-changed", checkTheme);
    };
  }, [isOpen]); 

  // Palet warna yang 100% konsisten dengan Katalog & Homepage
  const theme = {
    bgDrawer: isDark ? "bg-[#121412]" : "bg-white",
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel Keranjang (Sidebar) */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md z-[9999] shadow-[0_0_40px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-out transform flex flex-col border-l ${theme.bgDrawer} ${theme.border} ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className={`flex justify-between items-center p-6 border-b ${theme.border}`}>
          <h2 className={`text-xl font-bold font-[family-name:var(--font-playfair)] ${theme.textPrimary}`}>
            Portofolio Seleksi
          </h2>
          <button 
            onClick={() => setIsOpen(false)} 
            className={`text-2xl hover:rotate-90 transition-transform duration-300 ${theme.textSecondary} hover:text-red-500`}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {cart.length === 0 ? (
            // --- DESAIN BRANKAS KOSONG ---
            <div className={`flex flex-col items-center justify-center h-full text-center space-y-4 ${theme.textMuted} opacity-80`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2 transition-transform hover:scale-110 duration-500">
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
              
              return (
                <div key={item.id} className={`flex gap-4 p-3 rounded-lg border transition-all duration-300 hover:shadow-md hover:border-[#C5A059]/40 ${theme.bgItem} ${theme.border}`}>
                  <div className={`relative w-16 h-16 flex-shrink-0 rounded flex items-center justify-center overflow-hidden ${theme.bgImage}`}>
                    <Image 
                      src={primaryImg} 
                      alt={item.name || "Aset Nexus Gold"} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      // PERBAIKAN: Mix blend mode dinamis berdasarkan isDark manual, bukan prefix "dark:"
                      className={`object-cover transition-transform duration-700 hover:scale-110 ${isDark ? 'mix-blend-normal' : 'mix-blend-multiply'}`}
                    />
                  </div>
                  <div className="flex-grow flex flex-col justify-center">
                    <h4 className={`text-sm font-bold ${theme.textPrimary}`}>{item.name}</h4>
                    <div className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${theme.textMuted}`}>
                      {item.cartQuantity} unit x {item.weight_grams}g
                    </div>
                    <div className={`text-sm font-bold mt-1 font-mono ${isDark ? 'text-[#C5A059]' : 'text-[#8C6D31]'}`}>
                      Rp {new Intl.NumberFormat("id-ID").format(item.base_price * item.cartQuantity)}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 hover:text-red-500 transition-colors ${theme.textMuted}`}
                  >
                    Hapus
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className={`p-6 border-t ${theme.border} ${theme.bgItem}`}>
          <div className="flex justify-between items-center mb-6">
            <span className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>Estimasi Total</span>
            <span className={`text-2xl font-black font-mono tracking-tight ${isDark ? 'text-[#C5A059]' : 'text-[#8C6D31]'}`}>
              Rp {new Intl.NumberFormat("id-ID").format(totalAmount)}
            </span>
          </div>
          <button 
            onClick={() => {
              setIsOpen(false);
              router.push("/checkout");
            }}
            disabled={cart.length === 0}
            className="w-full bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] font-bold py-4 rounded hover:shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest text-xs flex justify-center items-center gap-2"
          >
            {cart.length === 0 ? "Portofolio Kosong" : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Proses Transaksi
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}