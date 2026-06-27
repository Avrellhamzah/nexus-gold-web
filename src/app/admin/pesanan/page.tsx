"use client";

import { useState, useEffect } from "react";
import { supabase, logAdminAction } from "../../../lib/supabase";
import { createPortal } from "react-dom";
import Link from "next/link";

export default function ManajemenPesananPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`*, invoice_items (id, product_id, product_name, quantity, price)`)
        .in("status", ["LUNAS", "DIKIRIM", "MENUNGGU TINJAUAN", "SELESAI"]) 
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Gagal menarik data pesanan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleKirimPesanan = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email || "Unknown Admin";

      for (const item of selectedOrder.invoice_items) {
        if (!item.product_id) continue;
        const { data: productData, error: fetchError } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).single();
        if (fetchError) throw fetchError;

        const newStock = Math.max(0, (productData?.stock_quantity || 0) - item.quantity);
        const { error: updateError } = await supabase.from("products").update({ stock_quantity: newStock }).eq("id", item.product_id);
        if (updateError) throw updateError;
      }

      const { error: invoiceError } = await supabase.from("invoices").update({ status: "DIKIRIM" }).eq("id", selectedOrder.id);
      if (invoiceError) throw invoiceError;

      await logAdminAction(adminEmail, "INVENTORY", `Memproses logistik (potong stok) untuk pesanan ${selectedOrder.invoice_number}`, "invoices", selectedOrder.id);

      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: "DIKIRIM" } : o));
      setSelectedOrder(null);
      setTrackingNumber("");
      
      alert("Pesanan berhasil diproses dan stok telah dipotong secara otomatis.");
    } catch (err) {
      console.error("Gagal memproses pesanan:", err);
      alert("Terjadi kesalahan sistem saat memproses logistik.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateStatusToSelesai = async (invoiceId: string, invoiceNumber: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const adminEmail = userData.user?.email || "Unknown Admin";

    const { error } = await supabase.from('invoices').update({ status: 'SELESAI' }).eq('id', invoiceId);
      
    if (!error) {
      await logAdminAction(adminEmail, "TRANSACTION", `Menyelesaikan pesanan secara manual (Tinjauan/Offline) untuk ref ${invoiceNumber}`, "invoices", invoiceId);
      fetchOrders(); 
    } else {
      alert("Gagal memperbarui status.");
    }
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto text-zinc-100 font-sans">
      <header className="mb-10 flex justify-between items-end border-b border-[#2E3730] pb-6">
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-playfair)] font-bold text-[#C5A059] mb-2">Pusat Logistik & Pemenuhan</h1>
          <p className="text-sm text-zinc-400">Eksekusi pengiriman dan manajemen pemotongan inventaris fisik.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/transaksi" className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors py-2">
            Lihat Finansial (Invoice)
          </Link>
          <button onClick={fetchOrders} className="text-xs font-bold uppercase tracking-wider bg-[#2E3730] text-white px-4 py-2 rounded hover:bg-[#3A4D40] transition-colors">
            Segarkan Antrean
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#121412] border border-[#2E3730] rounded-lg flex flex-col h-[75vh]">
          <div className="p-4 border-b border-[#2E3730] bg-[#161B18] flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Antrean Packing (Lunas)</h2>
            <span className="bg-[#C5A059] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{orders.filter(o => o.status === "LUNAS").length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {orders.filter(o => o.status === "LUNAS").map(order => (
              <div key={order.id} className="bg-[#161B18] border border-[#2E3730] p-4 rounded hover:border-[#C5A059]/50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-mono text-zinc-400">{order.invoice_number}</p>
                    <p className="text-sm font-bold mt-1">{order.invoice_items?.length || 0} Macam Aset</p>
                  </div>
                  <span className="bg-blue-900/30 text-blue-400 border border-blue-700/50 text-[9px] font-bold uppercase px-2 py-1 rounded">SIAP KIRIM</span>
                </div>
                <button className="w-full mt-2 bg-[#C5A059] text-black text-[10px] font-bold uppercase tracking-widest py-2 rounded hover:bg-[#B38F4B]">Proses & Potong Stok</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121412] border border-[#2E3730] rounded-lg flex flex-col h-[75vh]">
          <div className="p-4 border-b border-[#2E3730] bg-[#161B18] flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Logistik & Tinjauan</h2>
            <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{orders.filter(o => o.status === "DIKIRIM" || o.status === "MENUNGGU TINJAUAN").length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {orders.filter(o => o.status === "DIKIRIM" || o.status === "MENUNGGU TINJAUAN").map(order => (
              <div key={order.id} className="bg-[#161B18] border border-blue-900/50 p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-mono text-blue-400">{order.invoice_number}</p>
                  {!order.user_id && <span className="text-[9px] bg-zinc-700 px-1 rounded text-white">Manual</span>}
                </div>
                
                <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
                  {order.status === "MENUNGGU TINJAUAN" ? "Klien mengirim bukti unboxing." : "Dalam pengiriman."}
                </p>

                <button 
                  onClick={() => {
                    if (order.status === "MENUNGGU TINJAUAN") {
                      window.open(order.unboxing_proof_url, "_blank");
                      if (window.confirm("Bukti unboxing valid? Selesaikan pesanan?")) {
                        updateStatusToSelesai(order.id, order.invoice_number);
                      }
                    } else {
                      if (!order.user_id) {
                        if (window.confirm("Ini adalah pelanggan manual tanpa dasbor. Apakah paket sudah dipastikan diterima klien?")) {
                          updateStatusToSelesai(order.id, order.invoice_number);
                        }
                      } else {
                        alert("Pesanan member harus menunggu konfirmasi unboxing dari klien.");
                      }
                    }
                  }}
                  className={`w-full border text-[10px] font-bold uppercase tracking-widest py-2 rounded transition-colors ${order.status === "MENUNGGU TINJAUAN" ? "bg-yellow-900/20 text-yellow-500 border-yellow-900" : "bg-blue-900/20 text-blue-400 border-blue-900"}`}
                >
                  {order.status === "MENUNGGU TINJAUAN" ? "Tinjau & Selesaikan" : "Selesaikan (Offline/Manual)"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121412] border border-[#2E3730] rounded-lg flex flex-col h-[75vh]">
          <div className="p-4 border-b border-[#2E3730] bg-[#161B18] flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-green-500">Selesai</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
             {orders.filter(o => o.status === "SELESAI").map(order => (
              <div key={order.id} className="bg-[#0F110F] border border-green-900/30 p-4 rounded">
                <p className="text-xs font-mono text-green-600">{order.invoice_number}</p>
                <p className="text-sm font-bold mt-1 text-green-500/70">Telah Diterima</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedOrder && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          <div className="relative bg-[#121412] border border-[#2E3730] w-full max-w-lg rounded-lg shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-[#2E3730] bg-[#161B18]">
              <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#C5A059]">Manifest Pengiriman</h3>
              <p className="text-xs text-zinc-500 font-mono mt-1">{selectedOrder.invoice_number}</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-yellow-900/10 border border-yellow-900/50 p-4 rounded">
                <p className="text-xs text-yellow-500 font-bold uppercase tracking-wider mb-2">Peringatan Sistem</p>
                <p className="text-sm text-yellow-500/80 leading-relaxed">Menyetujui pengiriman ini akan secara otomatis memotong stok fisik dari brankas inventaris untuk item-item di bawah ini. Tindakan ini tidak dapat dibatalkan secara otomatis.</p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Daftar Aset untuk Dikemas</h4>
                <div className="space-y-2 border border-[#2E3730] rounded p-3 bg-[#0F110F]">
                  {selectedOrder.invoice_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-[#2E3730] last:border-0">
                      <span className="font-bold text-zinc-200">{item.product_name}</span>
                      <span className="text-[#C5A059] font-bold">{item.quantity} Unit</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Nomor Resi / Dokumen Pengiriman (Opsional)</label>
                <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Masukkan kode resi kurir..." className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-200 text-sm rounded px-3 py-3 focus:outline-none focus:border-[#C5A059]" />
              </div>
            </div>

            <div className="p-6 border-t border-[#2E3730] bg-[#161B18] flex justify-end gap-4">
              <button onClick={() => setSelectedOrder(null)} className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white px-4">Batal</button>
              <button onClick={handleKirimPesanan} disabled={isProcessing} className="bg-[#C5A059] text-[#0F110F] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded disabled:opacity-50 hover:bg-[#B38F4B] transition-colors">
                {isProcessing ? "Memproses..." : "Konfirmasi & Potong Stok"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}