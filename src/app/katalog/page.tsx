"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase"; 
import LiveTicker from "../../components/LiveTicker";
import { useCart } from "../../context/CartContext";
import SoftNotification from "../../components/softNotification";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Image from "next/image";

export default function KatalogPage() {
  const { user } = useAuth(); 
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest"); 

  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [viewProduct, setViewProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [orderQty, setOrderQty] = useState(1); 
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (viewProduct) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [viewProduct]);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("nexus-theme");
    if (savedTheme === "dark") setIsDark(true);

    const fetchData = async () => {
      try {
        const { data: catData } = await supabase.from("categories").select("*").is("deleted_at", null);
        if (catData) setCategories(catData);

        const { data: prodData } = await supabase
          .from("products")
          .select("*, categories(category_name), product_images(image_url, is_primary)")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        
        if (prodData) {
          setProducts(prodData);
          setFilteredProducts(prodData);
        }
      } catch (err) {
        console.error("Gagal memuat data katalog:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = [...products];
    if (searchQuery) result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedCategory !== "all") result = result.filter((p) => p.category_id.toString() === selectedCategory);

    switch (sortBy) {
      case "price_asc": result.sort((a, b) => a.base_price - b.base_price); break;
      case "price_desc": result.sort((a, b) => b.base_price - a.base_price); break;
      case "weight_asc": result.sort((a, b) => a.weight_grams - b.weight_grams); break;
      case "weight_desc": result.sort((a, b) => b.weight_grams - a.weight_grams); break;
      case "newest": default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, sortBy, products]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("nexus-theme", newTheme ? "dark" : "light");
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
    bgControlBar: isDark ? "bg-[#121412]" : "bg-white",
    bgCard: isDark ? "bg-[#0F110F]" : "bg-white",
    bgImage: isDark ? "bg-[#161B18]" : "bg-[#EEF0EC]",
    bgFooter: isDark ? "bg-[#121412]" : "bg-[#1A241E]",
    textPrimary: isDark ? "text-zinc-100" : "text-[#1A241E]", 
    textSecondary: isDark ? "text-zinc-400" : "text-[#3A4D40]",
    textMuted: isDark ? "text-zinc-500" : "text-[#6A7C70]",
    textFooter: isDark ? "text-zinc-500" : "text-[#A2B5A9]", 
    border: isDark ? "border-[#2E3730]" : "border-[#E1E5E2]",
    borderHover: isDark ? "hover:border-[#C5A059]/40" : "hover:border-[#1A241E]",
    inputBg: isDark ? "bg-[#161B18]" : "bg-[#F3F5F4]",
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-700 ${theme.bgMain} ${theme.textPrimary} selection:bg-[#C5A059] selection:text-[#0F110F] relative`}>
      
      {/* 1. TICKER */}
      <LiveTicker />

      {/* 2. NAVBAR STICKY WRAPPER: Inilah yang menguncinya di atas */}
      <div className="sticky top-0 z-[80] w-full">
        <Navbar isDark={isDark} toggleTheme={toggleTheme} />
      </div>

      <header className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4 font-[family-name:var(--font-playfair)]">Eksplorasi Aset Komoditas</h1>
        <p className={`text-sm max-w-xl mx-auto ${theme.textSecondary}`}>Temukan portofolio logam mulia yang sesuai dengan profil investasi Anda. Seluruh produk dijamin kemurniannya dan diverifikasi secara ketat.</p>
      </header>

      {/* Control Bar Sticky di bawah Navbar */}
      <div className={`border-y sticky top-[69px] md:top-[74px] z-30 transition-colors duration-700 shadow-sm ${theme.bgControlBar} ${theme.border}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-1/3 relative">
            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Cari nama atau tipe emas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-9 pr-4 py-2.5 rounded text-sm focus:outline-none border focus:border-[#C5A059] transition-colors ${theme.inputBg} ${theme.border} ${theme.textPrimary} placeholder-zinc-500`} />
          </div>
          <div className="w-full md:w-auto flex overflow-x-auto gap-2 pb-2 md:pb-0 hide-scrollbar">
            <button onClick={() => setSelectedCategory("all")} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${selectedCategory === "all" ? 'bg-[#C5A059] text-[#0F110F]' : `${theme.inputBg} ${theme.textSecondary} hover:text-[#C5A059]`}`}>Semua Aset</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id.toString())} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${selectedCategory === cat.id.toString() ? 'bg-[#C5A059] text-[#0F110F]' : `${theme.inputBg} ${theme.textSecondary} hover:text-[#C5A059]`}`}>{cat.category_name}</button>
            ))}
          </div>
          <div className="w-full md:w-auto flex items-center justify-end gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>Urutkan:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`appearance-none bg-transparent py-2 pl-2 pr-6 text-sm font-semibold cursor-pointer focus:outline-none ${theme.textPrimary}`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='${isDark ? '%23A1A1AA' : '%233A4D40'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='4 6 8 10 12 6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}>
              <option value="newest" className="bg-[#121412] text-zinc-300">Rilis Terbaru</option>
              <option value="price_asc" className="bg-[#121412] text-zinc-300">Harga Terendah</option>
              <option value="price_desc" className="bg-[#121412] text-zinc-300">Harga Tertinggi</option>
              <option value="weight_desc" className="bg-[#121412] text-zinc-300">Massa Terbesar (Gram)</option>
              <option value="weight_asc" className="bg-[#121412] text-zinc-300">Massa Terkecil (Gram)</option>
            </select>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12 min-h-[50vh]">
        {loading ? (
           <div className={`text-center py-20 text-xs uppercase tracking-widest animate-pulse ${theme.textMuted}`}>Menarik Data Inventaris Terkini...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 transition-opacity duration-500">
            <h3 className="text-lg font-bold mb-2">Aset Tidak Ditemukan</h3>
            <button onClick={() => {setSearchQuery(""); setSelectedCategory("all");}} className="mt-4 text-[#C5A059] text-xs font-bold uppercase tracking-wider hover:underline">Reset Filter</button>
          </div>
        ) : (
          <div className="transition-all duration-700 ease-in-out opacity-100 transform translate-y-0">
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${theme.textMuted}`}>Menampilkan {filteredProducts.length} Aset</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((prod, index) => {
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
          </div>
        )}
      </main>

      <Footer isDark={isDark} />

      {/* QUICK VIEW PANEL (SIDE DRAWER) DENGAN REACT PORTAL */}
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

      {notification && <SoftNotification message={notification} onClose={() => setNotification(null)} />}
    </div>
  );
}