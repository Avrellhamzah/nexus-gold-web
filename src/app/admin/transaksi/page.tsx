"use client";

import { useState, useEffect } from "react";
import { supabase, logAdminAction } from "../../../lib/supabase";
import ExcelJS from "exceljs";
import PaginatedTable, { TableColumn } from "../../../components/PaginatedTable";
import { useToast } from "../../../context/ToastContext"; // Menggunakan Toast Global

export default function TransaksiPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- STATE UI/UX ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { showToast } = useToast(); // Menginisialisasi Toast Global

  // Form State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [customerWa, setCustomerWa] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCost, setShippingCost] = useState("0");
  const [status, setStatus] = useState("LUNAS");

  const fetchData = async () => {
    // Menarik data produk
    const { data: prodData } = await supabase.from("products").select("*").is("deleted_at", null).gt("stock_quantity", 0);
    if (prodData) setProducts(prodData);

    // Menarik data invoice untuk UI DASBOR (Dibatasi 100 terbaru agar performa browser tetap ringan)
    const { data: invData } = await supabase.from("invoices")
      .select("*, invoice_items(*)")
      .order("created_at", { ascending: false })
      .limit(100); 
    if (invData) setInvoices(invData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));
  const estimatedTotal = selectedProduct ? (selectedProduct.base_price * parseInt(qty || "0")) + parseFloat(shippingCost || "0") : 0;

  const resetForm = () => {
    setSelectedProductId(""); setQty("1"); setCustomerName(""); setCustomerWa(""); setShippingAddress(""); setShippingCost("0"); setStatus("LUNAS");
    setIsDrawerOpen(false);
  };

  const handleManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedProduct) throw new Error("Produk tidak ditemukan atau stok habis.");
      
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email || "Unknown Admin";

      const invoiceNumber = `INV-M-${Date.now().toString().slice(-6)}`;
      const generatedEmail = `${customerWa.replace(/\D/g, '')}@manual.nexusgold.com`;

      const { data: invData, error: invError } = await supabase
        .from("invoices")
        .insert([{
          invoice_number: invoiceNumber, customer_name: customerName, customer_phone: customerWa,
          customer_email: generatedEmail, shipping_address: shippingAddress || "Transaksi Offline / Ambil di Tempat",
          total_amount: estimatedTotal, status: status,
        }]).select().single();

      if (invError) throw invError;

      const { error: itemError } = await supabase.from("invoice_items").insert([{
          invoice_id: invData.id, product_id: selectedProduct.id, product_name: selectedProduct.name,
          quantity: parseInt(qty), price: selectedProduct.base_price
        }]);

      if (itemError) throw itemError;

      const newStock = selectedProduct.stock_quantity - parseInt(qty);
      await supabase.from("products").update({ stock_quantity: newStock }).eq("id", selectedProduct.id);

      await logAdminAction(adminEmail, "TRANSACTION", `Menginput transaksi manual (${invoiceNumber}) untuk ${customerName}. Total: Rp ${estimatedTotal}`, "invoices", invData.id);

      showToast("Transaksi manual berhasil dicatat!", "success");
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast("Gagal: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    if (!window.confirm("Tandai transaksi ini sebagai LUNAS?")) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("invoices").update({ status: "LUNAS" }).eq("id", invoiceId);
      await logAdminAction(userData.user?.email || "Unknown", "TRANSACTION", `Mengotorisasi pelunasan untuk invoice ID: ${invoiceId}`, "invoices", invoiceId);
      showToast("Status berhasil diperbarui.", "success");
      fetchData(); 
    } catch (err) { showToast("Gagal mengupdate status.", "error"); }
  };

  const handleCancelTransaction = async (invoiceId: string) => {
    if (!window.confirm("Batalkan transaksi ini? (Stok tidak akan dikembalikan otomatis di versi ini)")) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("invoices").update({ status: "BATAL" }).eq("id", invoiceId);
      await logAdminAction(userData.user?.email || "Unknown", "TRANSACTION", `Membatalkan invoice secara manual ID: ${invoiceId}`, "invoices", invoiceId);
      showToast("Transaksi dibatalkan.", "success");
      fetchData();
    } catch (err) { showToast("Gagal membatalkan transaksi.", "error"); }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "MENUNGGU PEMBAYARAN": return "bg-[#221F18] text-yellow-400 border-yellow-900/50";
      case "LUNAS": return "bg-[#1C221E] text-green-400 border-green-900/50";
      case "DIKIRIM": return "bg-purple-900/30 text-purple-400 border-purple-700/50";
      case "SELESAI": return "bg-green-900/30 text-green-400 border-green-700/50";
      case "BATAL": return "bg-red-900/30 text-red-400 border-red-700/50";
      default: return "bg-zinc-800/50 text-zinc-400 border-zinc-600";
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: TableColumn<any>[] = [
    {
      header: "Tanggal & No",
      render: (inv) => (
        <div>
          <p className="text-zinc-300">{new Date(inv.created_at).toLocaleDateString('id-ID')}</p>
          <p className="font-mono text-zinc-500 mt-1">{inv.invoice_number}</p>
        </div>
      )
    },
    {
      header: "Pembeli & Produk",
      render: (inv) => (
        <div>
          <p className="font-bold text-[#C5A059]">{inv.customer_name || "NN"}</p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">
            {inv.invoice_items?.map((i:any) => `${i.quantity}x ${i.product_name}`).join(", ")}
          </p>
        </div>
      )
    },
    {
      header: "Total (Rp)",
      align: "right",
      render: (inv) => <span className="font-bold text-green-400">{new Intl.NumberFormat("id-ID").format(inv.total_amount)}</span>
    },
    {
      header: "Status",
      align: "center",
      render: (inv) => <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(inv.status)}`}>{inv.status}</span>
    },
    {
      header: "Aksi",
      align: "right",
      render: (inv) => (
        <div className="flex justify-end items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {inv.status === "MENUNGGU PEMBAYARAN" && (
            <button onClick={() => handleMarkAsPaid(inv.id)} className="text-[10px] font-bold uppercase tracking-widest text-green-500 hover:text-green-400">Lunas</button>
          )}
          {inv.status !== "BATAL" && inv.status !== "SELESAI" && (
            <>
              {inv.status === "MENUNGGU PEMBAYARAN" && <span className="text-zinc-700">|</span>}
              <button onClick={() => handleCancelTransaction(inv.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400">Batal</button>
            </>
          )}
        </div>
      )
    }
  ];

  // --- FUNGSI EKSPOR ENTERPRISE GRADE ---
  const exportToExcel = async () => {
    setExporting(true);

    try {
      // 1. Tarik SELURUH data transaksi tanpa memedulikan batas paginasi UI
      const { data: allData, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!allData || allData.length === 0) {
        showToast("Tidak ada data transaksi mutlak untuk diekspor.", "error");
        setExporting(false);
        return;
      }

      // 2. Susun dokumen ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Penjualan");

      worksheet.columns = [
        { header: "TANGGAL TRF", key: "tanggal", width: 15 },
        { header: "NO INVOICE", key: "invoice", width: 20 },
        { header: "NAMA PELANGGAN", key: "nama", width: 25 },
        { header: "NO WHATSAPP", key: "wa", width: 18 },
        { header: "PRODUK EMAS", key: "produk", width: 40 },
        { header: "TOTAL TAGIHAN", key: "total", width: 20 },
        { header: "STATUS", key: "status", width: 15 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1F2937" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 25;

      allData.forEach((inv) => {
        const productNames = inv.invoice_items?.map((i: any) => `${i.quantity}x ${i.product_name}`).join(", ") || "-";

        const row = worksheet.addRow({
          tanggal: new Date(inv.created_at).toLocaleDateString("id-ID"),
          invoice: inv.invoice_number || "-",
          nama: inv.customer_name?.toUpperCase() || "NN",
          wa: inv.customer_phone || "-",
          produk: productNames,
          total: parseFloat(inv.total_amount),
          status: inv.status,
        });

        row.getCell("total").numFmt = '"Rp"#,##0.00';
        row.getCell("tanggal").alignment = { horizontal: "center" };
        row.getCell("wa").alignment = { horizontal: "center" };
        row.getCell("status").alignment = { horizontal: "center" };
      });

      // 3. Picu Unduhan Virtual
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `LAPORAN_REKAP_EMAS_${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      
      // 4. Catat Tindakan Ekspor ke Audit Trail
      const { data: userData } = await supabase.auth.getUser();
      await logAdminAction(
        userData.user?.email || "Unknown", 
        "SYSTEM", 
        `Mengekspor laporan finansial mutlak (${allData.length} baris) ke format Excel`, 
        "invoices", 
        null
      );

      showToast("Laporan Excel berhasil diunduh.", "success");

    } catch (err: any) {
      showToast("Gagal mengekspor berkas: " + err.message, "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto relative overflow-x-hidden min-h-[80vh] flex flex-col gap-6">
      
      {/* HEADER PAGE */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Manajemen Transaksi</h2>
          <p className="text-xs text-zinc-500 mt-1">Laporan finansial dan kasir manual.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={exportToExcel} disabled={exporting} className="bg-transparent border border-zinc-700 text-zinc-300 px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2">
            {exporting && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {exporting ? "Menyusun..." : "Unduh Rekap"}
          </button>
          <button onClick={() => setIsDrawerOpen(true)} className="bg-[#C5A059] text-[#0F110F] px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#B38F4B] transition-colors shadow-lg shadow-[#C5A059]/10">
            + Catat Transaksi Manual
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-[#121412] p-4 rounded border border-[#2E3730] flex items-center">
        <svg className="w-5 h-5 text-zinc-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input 
          type="text" 
          placeholder="Cari berdasarkan Nama Klien atau No Invoice..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent w-full text-sm text-zinc-100 focus:outline-none placeholder-zinc-600"
        />
      </div>

      {/* TABEL FULL WIDTH */}
      <div className="flex-1">
        <PaginatedTable data={filteredInvoices} columns={columns} itemsPerPage={10} emptyMessage="Tidak ada riwayat transaksi yang cocok." />
      </div>

      {/* --- LACI KASIR (OFF-CANVAS DRAWER) --- */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetForm}></div>
        <div className={`absolute top-0 right-0 w-full md:w-[450px] h-full bg-[#121412] border-l border-[#2E3730] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          <div className="px-6 py-6 border-b border-[#2E3730] flex justify-between items-center bg-[#161B18]">
            <div>
              <h3 className="text-lg font-bold text-[#C5A059]">Input Transaksi Manual</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Sistem Kasir Offline Luring</p>
            </div>
            <button onClick={resetForm} className="text-zinc-500 hover:text-white text-xl">✕</button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <form id="pos-form" onSubmit={handleManualTransaction} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Pilih Produk</label>
                <select required value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none">
                  <option value="" disabled>-- Produk Tersedia --</option>
                  {products.map((p) => (<option key={p.id} value={p.id}>{p.name} (Stok: {p.stock_quantity})</option>))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Kuantitas</label>
                  <input type="number" required min="1" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Status Pembayaran</label>
                  <select required value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none">
                    <option value="LUNAS">Selesai (Lunas)</option>
                    <option value="MENUNGGU PEMBAYARAN">Belum Bayar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Nama Pembeli</label>
                <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">No WhatsApp</label>
                <input type="text" required value={customerWa} onChange={(e) => setCustomerWa(e.target.value)} placeholder="0812..." className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Alamat Pengiriman / Catatan</label>
                <textarea rows={2} value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Alamat lengkap atau tulis 'Ambil di toko'..." className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none resize-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Ongkos Kirim (Rp)</label>
                <input type="number" required value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-[#2E3730] bg-[#161B18]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Estimasi Tagihan</span>
              <p className="text-xl font-black text-[#C5A059]">Rp {new Intl.NumberFormat("id-ID").format(estimatedTotal)}</p>
            </div>
            <button type="submit" form="pos-form" disabled={loading} className="w-full bg-[#C5A059] text-[#0F110F] font-bold text-xs uppercase tracking-widest rounded py-4 hover:bg-[#B38F4B] disabled:opacity-50 transition-colors">
              {loading ? "Memproses..." : "Catat Transaksi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}