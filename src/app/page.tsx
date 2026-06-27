"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import LiveTicker from "../components/LiveTicker";
import SoftNotification from "../components/softNotification";
import { useCart } from "../context/CartContext";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Image from "next/image";
import VIPConcierge from "../components/VIPConcierge";
import Link from "next/link";

export default function PublicHomePage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [viewProduct, setViewProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("nexus-theme");
    if (savedTheme === "dark") setIsDark(true);

    const fetchPublicCatalog = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, categories(category_name), product_images (image_url, is_primary)")
          .is("deleted_at", null)
          .limit(4) 
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) setProducts(data);
      } catch (err) {
        console.error("Gagal memuat katalog publik:", err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchPublicCatalog();
  }, []);

  useEffect(() => {
    if (viewProduct) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [viewProduct]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleOpenInspection = (prod: any) => {
    setViewProduct(prod);
    setOrderQty(1);
    const primary = prod.product_images?.find((img: any) => img.is_primary)?.image_url || prod.product_images?.[0]?.image_url || "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=500&auto=format&fit=crop";
    setSelectedImage(primary);
  };

  const theme = {
    bgMain: isDark ? "bg-[#0F110F]" : "bg-[#FDFDFB]",
    bgNav: isDark ? "bg-[#0F110F]/90" : "bg-[#FDFDFB]/95",
    bgSection: isDark ? "bg-[#121412]" : "bg-white",
    bgCard: isDark ? "bg-[#0F110F]" : "bg-white",
    bgImage: isDark ? "bg-[#161B18]" : "bg-[#EEF0EC]",
    bgBadge: isDark ? "bg-[#1C221E]" : "bg-[#1A241E]", 
    bgFooter: isDark ? "bg-[#121412]" : "bg-[#1A241E]",
    textPrimary: isDark ? "text-zinc-100" : "text-[#1A241E]", 
    textSecondary: isDark ? "text-zinc-400" : "text-[#3A4D40]",
    textMuted: isDark ? "text-zinc-500" : "text-[#6A7C70]",
    textFooter: isDark ? "text-zinc-500" : "text-[#A2B5A9]",
    border: isDark ? "border-[#2E3730]" : "border-[#E1E5E2]",
    borderHover: isDark ? "hover:border-[#C5A059]/40" : "hover:border-[#1A241E]",
    divider: isDark ? "border-zinc-800" : "border-[#E1E5E2]",
  };

  const articles = [
    { id: 1, title: "Mengapa Emas Disebut 'Safe Haven' di Tengah Inflasi Global?", excerpt: "Menilik sejarah bagaimana logam mulia mempertahankan daya beli manusia selama ribuan tahun.", date: "22 Juni 2026", readTime: "5 mnt baca" },
    { id: 2, title: "Strategi Dollar-Cost Averaging (DCA) Pada Komoditas Emas", excerpt: "Panduan praktis bagi investor pemula untuk membangun portofolio.", date: "18 Juni 2026", readTime: "4 mnt baca" },
    { id: 3, title: "Memahami Selisih Harga Jual-Kembali (Spread)", excerpt: "Kupas tuntas kalkulasi bisnis emas agar Anda mendapatkan keuntungan maksimal.", date: "10 Juni 2026", readTime: "6 mnt baca" }
  ];

  return (
    // 1. HAPUS pt-[115px]. Biarkan elemen mengalir secara natural.
    <main className={`min-h-screen relative font-sans ${isDark ? 'bg-[#0F110F] text-zinc-100' : 'bg-[#FDFDFB] text-[#1A241E]'}`}>

      {/* 2. TICKER: Dibiarkan bebas agar bisa ter-scroll ke atas */}
      <LiveTicker />

      {/* 3. NAVBAR STICKY: Inilah yang mengunci Navbar di atap layar */}
      <div className="sticky top-0 z-[80] w-full">
        <Navbar isDark={isDark} toggleTheme={toggleTheme} />
      </div>
      
      {/* 4. KONTEN HALAMAN (Dimulai tanpa padding-top paksaan) */}
      <div>
        <section id="hero" className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center min-h-[80vh]">
          <div className="space-y-6">
            <span className={`text-[10px] font-bold text-[#C5A059] uppercase tracking-widest px-3 py-1.5 rounded transition-colors duration-700 ${theme.bgBadge} ${isDark ? 'border border-[#2E3730]' : 'shadow-md'}`}>Alokasi Aset Generasional</span>
            <h2 className={`text-4xl md:text-5xl font-black tracking-tight leading-[1.1] transition-colors duration-700 font-[family-name:var(--font-playfair)] ${theme.textPrimary}`}>
              Abadikan Kekayaan Anda Melalui <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A059] to-[#E5C07B]">Aset Keras Nyata.</span>
            </h2>
            <p className={`text-sm leading-relaxed max-w-md transition-colors duration-700 ${theme.textSecondary}`}>Mata uang fiat terus tergerus zaman. Emas batangan murni bersertifikasi adalah benteng absolut untuk mengamankan daya beli.</p>
            <div className="pt-2">
              <a href="/katalog" className="bg-[#C5A059] text-[#0F110F] font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded hover:bg-[#B38F4B] transition-colors shadow-lg">Jelajahi Etalase</a>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["Proteksi Inflasi", "Likuiditas Tinggi", "Privasi Berdaulat", "Kemurnian Terjamin"].map((title, i) => (
              <div key={i} className={`p-5 rounded border transition-colors duration-700 shadow-sm ${theme.bgSection} ${theme.border}`}>
                <h4 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">{title}</h4>
                <p className={`text-xs leading-relaxed transition-colors duration-700 ${theme.textMuted}`}>{i === 0 && "Nilai intrinsik yang konsisten tumbuh sejalan dengan depresiasi nilai mata uang kertas."}{i === 1 && "Diterima secara universal di seluruh belahan dunia tanpa adanya konversi rumit."}{i === 2 && "Kepemilikan aset fisik mandiri sepenuhnya berada di bawah kendali penuh Anda."}{i === 3 && "Seluruh produk bersertifikasi resmi kadar kemurnian 99.99% Fine Gold."}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="katalog" className={`border-y py-20 px-6 transition-colors duration-700 shadow-inner ${theme.bgSection} ${theme.border}`}>
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center md:text-left flex justify-between items-end">
              <div>
                <h3 className={`text-2xl font-bold tracking-tight transition-colors duration-700 font-[family-name:var(--font-playfair)] ${theme.textPrimary}`}>Koleksi Unggulan</h3>
                <p className={`text-xs mt-1 transition-colors duration-700 ${theme.textMuted}`}>Spesifikasi murni dari brankas internal.</p>
              </div>
              <a href="/katalog" className="text-xs font-bold text-[#C5A059] uppercase tracking-wider hover:underline hidden md:block">Lihat Semua Aset →</a>
            </div>

            {loadingProducts ? (
              <div className={`text-center py-12 text-xs uppercase tracking-widest ${theme.textMuted}`}>Memuat Alokasi Inventaris...</div>
            ) : products.length === 0 ? (
              <div className={`text-center py-12 text-sm ${theme.textMuted}`}>Saat ini seluruh produk sedang dialokasikan kembali.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((prod, index) => {
                  const primaryImg = prod.product_images?.find((img: any) => img.is_primary)?.image_url || prod.product_images?.[0]?.image_url || "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=500&auto=format&fit=crop";

                  return (
                    <div 
                      key={prod.id} 
                      onClick={() => handleOpenInspection(prod)}
                      style={{ animationDelay: `${index * 75}ms` }} 
                      className={`border rounded overflow-hidden shadow-lg transition-all duration-500 group flex flex-col h-full animate-stagger cursor-pointer ${theme.bgCard} ${theme.border} ${theme.borderHover}`}
                    >
                      <div className={`aspect-square w-full relative overflow-hidden flex items-center justify-center transition-colors duration-700 ${theme.bgImage}`}>
                        <div className="shine-effect"></div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <Image 
                          src={primaryImg} 
                          alt={prod.name} 
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-multiply dark:mix-blend-normal"
                        />
                        <span className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded shadow-sm border ${isDark ? 'bg-[#1C221E] text-zinc-300 border-[#2E3730]' : 'bg-white text-[#3A4D40] border-[#E1E5E2]'}`}>
                          Sisa: {prod.stock_quantity}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-grow space-y-3">
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>{prod.categories?.category_name || "Emas Mulia"}</p>
                          <h4 className={`text-lg font-bold transition-colors duration-500 mt-1 group-hover:text-[#C5A059] font-[family-name:var(--font-playfair)] ${theme.textPrimary}`}>{prod.name}</h4>
                          <p className={`text-xs font-medium mt-1 ${theme.textSecondary}`}>Massa: {prod.weight_grams} Gram</p>
                        </div>
                        <div className={`pt-3 border-t flex justify-between items-center mt-auto transition-colors duration-700 ${theme.border}`}>
                          <div>
                            <p className={`text-[9px] uppercase tracking-widest ${theme.textMuted}`}>Harga Likuidasi</p>
                            <p className={`font-bold text-sm ${isDark ? 'text-green-400' : 'text-[#27352A]'}`}>Rp {new Intl.NumberFormat("id-ID").format(prod.base_price)}</p>
                          </div>
                          <div className={`font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded transition-colors border ${isDark ? 'bg-[#1C221E] text-[#C5A059] border-[#2E3730] group-hover:bg-[#C5A059] group-hover:text-[#0F110F]' : 'bg-transparent text-[#1A241E] border-[#1A241E] group-hover:bg-[#1A241E] group-hover:text-[#C5A059]'}`}>
                            Inspeksi
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="text-center md:hidden pt-4 border-t border-zinc-800">
               <a href="/katalog" className="text-xs font-bold text-[#C5A059] uppercase tracking-wider hover:underline">Lihat Semua Aset →</a>
            </div>
          </div>
        </section>

        <section id="artikel" className="max-w-6xl mx-auto px-6 py-20 space-y-12">
          <div className="text-center">
            <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">Nexus Financial Review</span>
            <h3 className={`text-2xl font-bold tracking-tight mt-1 transition-colors duration-700 font-[family-name:var(--font-playfair)] ${theme.textPrimary}`}>Wawasan Komoditas & Edukasi Finansial</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles.map((art) => (
              <article key={art.id} className={`border-t pt-6 space-y-3 transition-colors duration-500 group cursor-pointer ${theme.divider} ${theme.borderHover}`}>
                <div className={`flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold ${theme.textMuted}`}>
                  <span>{art.date}</span>
                  <span>{art.readTime}</span>
                </div>
                <h4 className={`text-lg font-bold transition-colors duration-500 group-hover:text-[#C5A059] leading-snug font-[family-name:var(--font-playfair)] ${theme.textPrimary}`}>{art.title}</h4>
                <p className={`text-xs leading-relaxed transition-colors duration-700 ${theme.textSecondary}`}>{art.excerpt}</p>
                <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity">
                  Baca Selengkapnya
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <Footer isDark={isDark} />

      {mounted && viewProduct && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden" style={{ isolation: 'isolate' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade cursor-pointer" onClick={() => setViewProduct(null)}></div>
          <div className={`relative w-full max-w-md h-[100dvh] flex flex-col shadow-2xl animate-slide-in-right transform-gpu border-l ${isDark ? 'bg-[#0F110F] border-[#2E3730]' : 'bg-[#FDFDFB] border-[#E1E5E2]'}`}>
            
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
              <span className="text-[10px] font-bold tracking-widest text-zinc-100 uppercase drop-shadow-md">Inspeksi Aset</span>
              <button onClick={() => setViewProduct(null)} className="p-2 rounded-full bg-black/40 text-white hover:bg-black/70 hover:rotate-90 transition-all duration-300 backdrop-blur-sm pointer-events-auto shadow-lg">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-inherit">
              <div className={`w-full aspect-[4/5] sm:h-72 sm:aspect-auto relative flex-shrink-0 flex items-center justify-center border-b ${isDark ? 'bg-[#161B18] border-[#2E3730]' : 'bg-[#EEF0EC] border-[#E1E5E2]'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedImage || ""} alt={viewProduct.name} className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal transition-opacity duration-300" />
              </div>

              {viewProduct.product_images && viewProduct.product_images.length > 1 && (
                <div className={`flex gap-3 p-4 border-b overflow-x-auto hide-scrollbar ${isDark ? 'border-[#2E3730] bg-[#121412]' : 'border-[#E1E5E2] bg-[#FDFDFB]'}`}>
                  {viewProduct.product_images.map((img: any, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedImage(img.image_url)}
                      className={`w-14 h-14 flex-shrink-0 rounded border overflow-hidden transition-all duration-300 ${selectedImage === img.image_url ? 'border-[#C5A059] opacity-100 ring-1 ring-[#C5A059]' : (isDark ? 'border-[#2E3730] opacity-40 hover:opacity-100' : 'border-[#E1E5E2] opacity-40 hover:opacity-100')}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.image_url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                    </button>
                  ))}
                </div>
              )}

              <div className="p-8 space-y-6">
                <div>
                  <h2 className={`text-3xl font-black leading-[1.1] font-[family-name:var(--font-playfair)] ${isDark ? 'text-zinc-100' : 'text-[#1A241E]'}`}>{viewProduct.name}</h2>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">{viewProduct.categories?.category_name || "Logam Mulia"}</p>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 border border-zinc-500/30 px-2 py-0.5 rounded shadow-sm">Sisa: {viewProduct.stock_quantity}</p>
                  </div>
                </div>

                <div className={`py-5 border-y ${isDark ? 'border-[#2E3730]' : 'border-[#E1E5E2]'}`}>
                  <p className={`text-[10px] uppercase tracking-widest mb-1 ${theme.textMuted}`}>Estimasi Nilai Likuidasi</p>
                  <p className={`text-3xl font-bold tracking-tight ${isDark ? 'text-green-400' : 'text-[#27352A]'}`}>Rp {new Intl.NumberFormat("id-ID").format(viewProduct.base_price)}</p>
                </div>

                <div className="space-y-3">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#3A4D40]'}`}>Tentukan Kuantitas</h3>
                  <div className={`flex items-center justify-between border rounded p-2 ${isDark ? 'border-[#2E3730] bg-[#161B18]' : 'border-[#E1E5E2] bg-[#F3F5F4]'}`}>
                    <button onClick={() => setOrderQty(Math.max(1, orderQty - 1))} className={`w-10 h-10 flex items-center justify-center rounded font-bold text-xl hover:bg-[#C5A059] hover:text-black transition-colors ${isDark ? 'bg-[#1C221E] text-zinc-300' : 'bg-white text-zinc-700 shadow-sm'}`}>-</button>
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>{orderQty}</span>
                    <button onClick={() => setOrderQty(Math.min(viewProduct.stock_quantity, orderQty + 1))} className={`w-10 h-10 flex items-center justify-center rounded font-bold text-xl hover:bg-[#C5A059] hover:text-black transition-colors ${isDark ? 'bg-[#1C221E] text-zinc-300' : 'bg-white text-zinc-700 shadow-sm'}`}>+</button>
                  </div>
                </div>

                <div className="space-y-4 pb-6">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#3A4D40]'}`}>Spesifikasi Teknis</h3>
                  <ul className={`text-sm space-y-3 ${isDark ? 'text-zinc-400' : 'text-[#6A7C70]'}`}>
                    <li className={`flex justify-between pb-2 border-b ${isDark ? 'border-[#2E3730]/50' : 'border-[#E1E5E2]/50'}`}><span>Massa Bruto</span> <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-[#1A241E]'}`}>{viewProduct.weight_grams} Gram</span></li>
                    <li className={`flex justify-between pb-2 border-b ${isDark ? 'border-[#2E3730]/50' : 'border-[#E1E5E2]/50'}`}><span>Kadar Kemurnian</span> <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-[#1A241E]'}`}>99.99% Fine Gold</span></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={`flex-shrink-0 p-6 border-t ${isDark ? 'border-[#2E3730] bg-[#0F110F]' : 'border-[#E1E5E2] bg-[#FDFDFB]'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>Subtotal ({orderQty} Aset)</span>
                <span className={`text-lg font-black ${isDark ? 'text-green-400' : 'text-[#27352A]'}`}>Rp {new Intl.NumberFormat("id-ID").format(viewProduct.base_price * orderQty)}</span>
              </div>
              <button 
                disabled={viewProduct.stock_quantity === 0}
                onClick={() => {
                  addToCart(viewProduct, orderQty);
                  setViewProduct(null);
                  setNotification(`${orderQty} unit ${viewProduct.name} dialokasikan ke portofolio.`);
                }} 
                className="w-full bg-[#C5A059] text-[#0F110F] font-bold py-4 rounded hover:bg-[#B38F4B] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(197,160,89,0.15)]"
              >
                {viewProduct.stock_quantity === 0 ? 'Stok Habis' : 'Tambahkan ke Keranjang'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
      {mounted && <VIPConcierge isDark={isDark} />}
      {notification && <SoftNotification message={notification} onClose={() => setNotification(null)} />}
    </main>
  );
}