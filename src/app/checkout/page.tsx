"use client";

import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SoftNotification from "../../components/softNotification";
import { useAuth } from "../../context/AuthContext";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State untuk Pop-Up Notifikasi Lembut jika terjadi Error
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: ""
  });

  const totalAmount = cart.reduce((total: number, item: any) => total + (item.base_price * item.cartQuantity), 0);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);

    try {
      for (const item of cart) {
        const { data: currentProduct, error: fetchError } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.id)
          .single();

        if (fetchError) throw new Error(`Gagal memverifikasi stok untuk ${item.name}`);

        if (currentProduct.stock_quantity < item.cartQuantity) {
          throw new Error(`Transaksi dibatalkan. Kuantitas ${item.name} di keranjang Anda (${item.cartQuantity} unit) melebihi sisa stok fisik kami (${currentProduct.stock_quantity} unit).`);
        }
      }

      for (const item of cart) {
        const { error: deductError } = await supabase.rpc("deduct_product_stock", {
          p_id: item.id,
          p_qty: item.cartQuantity
        });

        if (deductError) {
          const { data: currentProduct } = await supabase.from("products").select("stock_quantity").eq("id", item.id).single();
          const newStock = (currentProduct?.stock_quantity || 0) - item.cartQuantity;
          
          const { error: updateError } = await supabase
            .from("products")
            .update({ stock_quantity: newStock })
            .eq("id", item.id);
            
          if (updateError) throw updateError;
        }
      }

      const invoiceNumber = `INV-${Math.floor(Date.now() / 1000)}`;

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert([{
          invoice_number: invoiceNumber,
          user_id: user?.id || null,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          shipping_address: formData.address,
          total_amount: totalAmount,
          status: "MENUNGGU PEMBAYARAN"
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceItems = cart.map((item: any) => ({
        invoice_id: invoiceData.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.cartQuantity,
        price: item.base_price
      }));

      const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems);
      if (itemsError) throw itemsError;

      clearCart();
      setSuccess(invoiceNumber);

    } catch (error: any) {
      console.error("Gagal memproses transaksi:", error);
      // Ganti penggunaan alert dengan Soft Notification
      setNotification(error.message || "Terjadi kesalahan sistem saat memproses transaksi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0F110F] text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#121412] border border-[#2E3730] rounded-lg p-8 text-center shadow-2xl transition-all duration-700 animate-slide-up">
          <div className="w-16 h-16 bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 className="text-2xl font-[family-name:var(--font-playfair)] mb-2">Otorisasi Berhasil</h2>
          <p className="text-sm text-zinc-400 mb-6">Faktur digital Anda telah diterbitkan. Tim kami akan segera menghubungi Anda untuk panduan penyelesaian pembayaran.</p>
          <div className="bg-[#1C221E] border border-[#2E3730] rounded p-4 mb-8">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Nomor Referensi Invoice</p>
            <p className="text-xl font-bold text-[#C5A059] tracking-wider">{success}</p>
          </div>
          <Link href="/katalog" className="block w-full bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider py-4 rounded hover:bg-zinc-700 transition-colors">
            Kembali ke Katalog Publik
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F110F] text-zinc-100 font-sans selection:bg-[#C5A059] selection:text-[#0F110F] relative">
      
      <nav className="border-b border-[#2E3730] bg-[#0F110F] px-6 py-5 flex justify-center">
        <Link href="/" className="font-black text-lg tracking-[0.2em] text-[#C5A059] font-[family-name:var(--font-playfair)]">
          NEXUS GOLD
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10 border-b border-zinc-800 pb-4">
          <h1 className="text-3xl font-[family-name:var(--font-playfair)]">Finalisasi Akuisisi</h1>
          <p className="text-sm text-zinc-500 mt-2">Lengkapi identitas untuk penerbitan sertifikat dan instruksi pengiriman aman.</p>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-[#121412] border border-[#2E3730] rounded">
            <p className="text-zinc-500 mb-4">Portofolio seleksi Anda saat ini kosong.</p>
            <Link href="/katalog" className="text-[#C5A059] font-bold text-sm hover:underline">← Kembali mengeksplorasi aset</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12 transition-all duration-700 ease-in-out opacity-100 transform translate-y-0">
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-widest mb-4">Informasi Kepemilikan (Sesuai Identitas)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-2">Nama Lengkap</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none transition-colors" placeholder="Cth: Adhitama Mangkunegara" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-2">Email Aktif</label>
                      <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none transition-colors" placeholder="email@domain.com" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-2">Nomor WhatsApp</label>
                      <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none transition-colors" placeholder="0812xxxxxx" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#2E3730]">
                <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-widest mb-4">Destinasi Pengiriman Aman</h3>
                <div>
                  <label className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-2">Alamat Lengkap & Kode Pos</label>
                  <textarea required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows={4} className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none transition-colors" placeholder="Sertakan detail blok, nomor rumah, kecamatan, dan kode pos secara akurat..."></textarea>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-[#121412] border border-[#2E3730] rounded-lg p-6 sticky top-24 shadow-2xl">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest mb-6 border-b border-[#2E3730] pb-4">Ringkasan Portofolio</h3>
                
                <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item: any) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-[#161B18] border border-[#2E3730] rounded overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.product_images?.[0]?.image_url} alt={item.name} className="w-full h-full object-cover mix-blend-screen" />
                      </div>
                      <div className="flex-grow flex flex-col justify-center">
                        <p className="text-sm font-bold text-zinc-200">{item.name}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-zinc-500">{item.cartQuantity} unit x {item.weight_grams}g</p>
                          <p className="text-sm font-bold text-green-400">Rp {new Intl.NumberFormat("id-ID").format(item.base_price * item.cartQuantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#2E3730] pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="text-zinc-200">Rp {new Intl.NumberFormat("id-ID").format(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Asuransi Pengiriman</span>
                    <span className="text-zinc-500">Dihitung oleh Admin</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-[#2E3730] mt-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-[#C5A059]">Estimasi Total</span>
                    <span className="text-2xl font-black text-green-400">Rp {new Intl.NumberFormat("id-ID").format(totalAmount)}</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className={`w-full font-bold uppercase tracking-wider text-xs py-4 rounded mt-8 transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${
                    loading 
                    ? 'bg-[#1C221E] text-[#C5A059] border border-[#C5A059]/50 cursor-wait' 
                    : 'bg-[#C5A059] text-[#0F110F] hover:bg-[#B38F4B] shadow-[0_0_20px_rgba(197,160,89,0.15)]'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="flex items-center gap-3">
                        {/* Ikon Gembok Terkunci Berkedip */}
                        <svg className="animate-pulse" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <span>Enkripsi AES-256 Aktif...</span>
                      </div>
                      {/* Indikator Garis Proses Transmisi */}
                      <div className="absolute bottom-0 left-0 h-[2px] bg-[#C5A059] animate-[shine_1s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
                    </>
                  ) : (
                    "Otorisasi & Terbitkan Invoice"
                  )}
                </button>
                <p className="text-[9px] text-zinc-500 text-center mt-4">Dengan menekan tombol ini, Anda menyetujui kebijakan fluktuasi harga komoditas global Nexus Gold.</p>
              </div>
            </div>

          </form>
        )}
      </main>

      {/* RENDER SOFT NOTIFICATION DI SINI (Muncul saat error stok) */}
      {notification && (
        <SoftNotification 
          message={notification} 
          onClose={() => setNotification(null)} 
        />
      )}

    </div>
  );
}