"use client";

import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext"; // Menggunakan Toast Global

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // --- STATE LOGISTIK ---
  const [loadingRates, setLoadingRates] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", postalCode: ""
  });

  const baseTotalAmount = cart.reduce((total: number, item: any) => total + (item.base_price * item.cartQuantity), 0);
  // Grand total dinamis (Subtotal + Ongkir)
  const grandTotal = baseTotalAmount + (selectedRate ? selectedRate.price : 0);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  // FUNGSI 1: CEK ONGKOS KIRIM (API BITESHIP)
  const handleCheckShipping = async () => {
    if (!formData.postalCode || formData.postalCode.length < 5) {
      showToast("Harap masukkan Kode Pos yang valid (minimal 5 digit).", "error");
      return;
    }

    setLoadingRates(true);
    setShippingRates([]);
    setSelectedRate(null);

    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_postal_code: formData.postalCode,
          items: cart.map((item: any) => ({
            name: item.name,
            price: item.base_price,
            weight_grams: item.weight_grams || 10, // Default 10g jika kosong
            quantity: item.cartQuantity
          }))
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      
      if (data.rates && data.rates.length > 0) {
        setShippingRates(data.rates);
        showToast("Rute logistik aman (TIKI/Paxel) ditemukan.", "success");
      } else {
        showToast("Tidak ada kurir yang menjangkau area ini. Hubungi Admin.", "error");
      }
    } catch (error: any) {
      showToast(error.message || "Gagal menghubungi satelit logistik.", "error");
    } finally {
      setLoadingRates(false);
    }
  };

  // FUNGSI 2: SUBMIT TRANSAKSI FINAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    if (!selectedRate) {
      showToast("Harap pilih rute logistik (kurir) sebelum memproses.", "error");
      return;
    }

    setLoading(true);

    try {
      // 1. Verifikasi Stok
      for (const item of cart) {
        const { data: currentProduct, error: fetchError } = await supabase.from("products").select("stock_quantity").eq("id", item.id).single();
        if (fetchError) throw new Error(`Gagal memverifikasi stok untuk ${item.name}`);
        if (currentProduct.stock_quantity < item.cartQuantity) {
          throw new Error(`Kuantitas ${item.name} (${item.cartQuantity} unit) melebihi sisa fisik brankas (${currentProduct.stock_quantity} unit).`);
        }
      }

      // 2. Potong Stok Fisik
      for (const item of cart) {
        const { error: deductError } = await supabase.rpc("deduct_product_stock", { p_id: item.id, p_qty: item.cartQuantity });
        if (deductError) {
          const { data: currentProduct } = await supabase.from("products").select("stock_quantity").eq("id", item.id).single();
          const newStock = (currentProduct?.stock_quantity || 0) - item.cartQuantity;
          const { error: updateError } = await supabase.from("products").update({ stock_quantity: newStock }).eq("id", item.id);
          if (updateError) throw updateError;
        }
      }

      // 3. Terbitkan Invoice (Menyimpan Data Kurir & Total Baru)
      const invoiceNumber = `INV-${Math.floor(Date.now() / 1000)}`;
      const courierNameStr = `${selectedRate.company.toUpperCase()} - ${selectedRate.type}`;
      const fullAddress = `${formData.address}, Kode Pos: ${formData.postalCode}`;

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert([{
          invoice_number: invoiceNumber,
          user_id: user?.id || null,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          shipping_address: fullAddress,
          total_amount: grandTotal, // Memasukkan Ongkir
          courier_name: courierNameStr, // Menyimpan nama kurir BiteShip
          status: "MENUNGGU PEMBAYARAN"
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // 4. Rekam Item
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
      showToast("Invoice berhasil diterbitkan.", "success");

    } catch (error: any) {
      console.error("Gagal memproses:", error);
      showToast(error.message || "Terjadi kesalahan sistem enkripsi.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- LAYAR SUKSES ---
  if (success) {
    return (
      <div className="min-h-screen bg-[#0F110F] text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#121412] border border-[#2E3730] rounded-lg p-8 text-center shadow-2xl transition-all duration-700 animate-slide-up">
          <div className="w-16 h-16 bg-[#C5A059]/20 text-[#C5A059] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#C5A059]/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 className="text-2xl font-[family-name:var(--font-playfair)] mb-2">Otorisasi Berhasil</h2>
          <p className="text-sm text-zinc-400 mb-6">Faktur digital Anda telah diterbitkan. Silakan lanjutkan ke dasbor portofolio untuk instruksi pembayaran.</p>
          <div className="bg-[#1C221E] border border-[#2E3730] rounded p-4 mb-8">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Nomor Referensi Invoice</p>
            <p className="text-xl font-bold text-[#C5A059] tracking-wider">{success}</p>
          </div>
          <Link href="/akun" className="block w-full bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] font-bold text-xs uppercase tracking-wider py-4 rounded hover:shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-all">
            Menuju Dasbor Klien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F110F] text-zinc-100 font-sans selection:bg-[#C5A059] selection:text-[#0F110F] relative">
      <nav className="border-b border-[#2E3730] bg-[#121412]/80 backdrop-blur-md px-6 py-5 flex justify-center sticky top-0 z-50">
        <Link href="/" className="font-black text-lg tracking-[0.2em] text-[#C5A059] font-[family-name:var(--font-playfair)] flex items-center gap-3">
          <span className="w-6 h-6 bg-[#C5A059] flex items-center justify-center text-[#0F110F] text-sm">N</span>
          NEXUS GOLD
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10 border-b border-[#2E3730] pb-6">
          <h1 className="text-3xl font-[family-name:var(--font-playfair)] text-[#C5A059]">Finalisasi Akuisisi</h1>
          <p className="text-sm text-zinc-400 mt-2">Lengkapi identitas untuk penerbitan e-certificate dan kalkulasi logistik aman.</p>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-[#121412] border border-[#2E3730] rounded-lg">
            <p className="text-zinc-500 mb-4 font-mono">ERR: BRANKAS_KOSONG</p>
            <Link href="/katalog" className="text-[#C5A059] font-bold text-sm hover:underline tracking-widest uppercase">← Eksplorasi Aset</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* KIRI: FORMULIR DATA */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Seksi 1: Kepemilikan */}
              <div className="bg-[#121412] p-6 rounded-lg border border-[#2E3730]">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest mb-6 border-b border-[#2E3730] pb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#C5A059] rounded-full"></span> 1. Identitas Kepemilikan
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Nama Lengkap Sesuai KTP</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3.5 text-sm focus:border-[#C5A059] focus:outline-none transition-colors" placeholder="Adhitama Mangkunegara" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Email (E-Certificate)</label>
                      <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3.5 text-sm focus:border-[#C5A059] focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Nomor WhatsApp Aktif</label>
                      <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3.5 text-sm focus:border-[#C5A059] focus:outline-none transition-colors" placeholder="0812..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seksi 2: Logistik & Pengiriman */}
              <div className="bg-[#121412] p-6 rounded-lg border border-[#2E3730]">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest mb-6 border-b border-[#2E3730] pb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#C5A059] rounded-full"></span> 2. Destinasi Pengiriman Terproteksi
                </h3>
                
                <div className="space-y-5 mb-6">
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Alamat Lengkap</label>
                    <textarea required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows={3} className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3.5 text-sm focus:border-[#C5A059] focus:outline-none transition-colors resize-none" placeholder="Jalan, RT/RW, Blok, Kecamatan..."></textarea>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-grow">
                      <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Kode Pos (Wajib)</label>
                      <input required type="text" maxLength={5} value={formData.postalCode} onChange={(e) => setFormData({...formData, postalCode: e.target.value.replace(/\D/g, '')})} className="w-full bg-[#161B18] border border-[#2E3730] rounded p-3.5 text-sm focus:border-[#C5A059] focus:outline-none font-mono tracking-widest" placeholder="12345" />
                    </div>
                    <button type="button" onClick={handleCheckShipping} disabled={loadingRates || formData.postalCode.length < 5} className="bg-zinc-800 text-[#C5A059] border border-zinc-700 px-6 py-3.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-zinc-700 disabled:opacity-50 transition-colors shrink-0">
                      {loadingRates ? "Menyinkronkan..." : "Cek Logistik"}
                    </button>
                  </div>
                </div>

                {/* Render Pilihan Kurir */}
                {shippingRates.length > 0 && (
                  <div className="pt-6 border-t border-[#2E3730] animate-fade">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-4">Pilih Rute Asuransi Tersedia:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shippingRates.map((rate, idx) => (
                        <label 
                          key={idx} 
                          className={`flex flex-col p-4 rounded border cursor-pointer transition-all duration-300 ${
                            selectedRate?.type === rate.type 
                            ? 'bg-[#1C221E] border-[#C5A059] shadow-[0_0_15px_rgba(197,160,89,0.1)]' 
                            : 'bg-[#161B18] border-[#2E3730] hover:border-zinc-500'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <input 
                              type="radio" 
                              name="shipping_rate" 
                              className="hidden" 
                              checked={selectedRate?.type === rate.type}
                              onChange={() => setSelectedRate(rate)}
                            />
                            <span className="text-sm font-bold text-zinc-100 uppercase">{rate.company} - {rate.type}</span>
                            {selectedRate?.type === rate.type && <span className="w-3 h-3 bg-[#C5A059] rounded-full"></span>}
                          </div>
                          <span className="text-xs text-zinc-500 mb-2">{rate.duration} Pengiriman</span>
                          <span className="text-sm font-black font-mono text-[#C5A059]">Rp {new Intl.NumberFormat('id-ID').format(rate.price)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* KANAN: RINGKASAN TAGIHAN */}
            <div className="lg:col-span-5">
              <div className="bg-[#121412] border border-[#2E3730] rounded-lg p-6 sticky top-28 shadow-2xl">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest mb-6 border-b border-[#2E3730] pb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#C5A059] rounded-full"></span> Ringkasan Portofolio
                </h3>
                
                <div className="space-y-4 mb-6 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item: any) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-[#161B18] border border-[#2E3730] rounded">
                      <div className="w-16 h-16 bg-[#1C221E] rounded overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.product_images?.[0]?.image_url} alt={item.name} className="w-full h-full object-cover mix-blend-screen" />
                      </div>
                      <div className="flex-grow flex flex-col justify-center">
                        <p className="text-sm font-bold text-zinc-200">{item.name}</p>
                        <div className="flex justify-between mt-1 items-end">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500">{item.cartQuantity} unit x {item.weight_grams}g</p>
                          <p className="text-xs font-bold font-mono text-[#C5A059]">Rp {new Intl.NumberFormat("id-ID").format(item.base_price * item.cartQuantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#2E3730] pt-5 space-y-3 bg-[#0F110F] -mx-6 px-6 pb-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <span>Subtotal Aset</span>
                    <span className="text-zinc-300 font-mono">Rp {new Intl.NumberFormat("id-ID").format(baseTotalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <span>Asuransi & Logistik</span>
                    <span className="text-zinc-300 font-mono">
                      {selectedRate ? `Rp ${new Intl.NumberFormat("id-ID").format(selectedRate.price)}` : 'Menunggu Kalkulasi'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-5 border-t border-[#2E3730] mt-4">
                    <span className="text-sm font-bold uppercase tracking-widest text-[#C5A059]">Estimasi Total</span>
                    <span className="text-2xl font-black font-mono text-[#C5A059]">
                      Rp {new Intl.NumberFormat("id-ID").format(grandTotal)}
                    </span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !selectedRate} 
                  className={`w-full font-bold uppercase tracking-wider text-xs py-4 rounded mt-6 transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${
                    loading || !selectedRate
                    ? 'bg-[#1C221E] text-zinc-500 border border-[#2E3730] cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] hover:shadow-[0_0_20px_rgba(197,160,89,0.3)]'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-3 text-[#C5A059]">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Menyinkronkan Ledger...
                    </div>
                  ) : (
                    "Otorisasi & Terbitkan Invoice"
                  )}
                </button>
                <p className="text-[9px] text-zinc-600 text-center mt-4">Penerbitan E-Certificate dan asuransi penuh berlaku sejak invoice dilunasi.</p>
              </div>
            </div>

          </form>
        )}
      </main>
    </div>
  );
}