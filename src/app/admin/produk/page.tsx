"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase, logAdminAction } from "../../../lib/supabase";

export default function ProdukPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- STATE UI/UX BARU ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State Formulir
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [weight, setWeight] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [stock, setStock] = useState("1");
  const [minStock, setMinStock] = useState("3");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "success", trigger: 0 });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null as number | null });
  
  const [restockModal, setRestockModal] = useState({ isOpen: false, product: null as any });
  const [restockQty, setRestockQty] = useState("");
  const [restockPrice, setRestockPrice] = useState("");
  const [restockNotes, setRestockNotes] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type, trigger: Date.now() });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.trigger, toast.show]);

  const fetchData = async () => {
    const { data: catData } = await supabase.from("categories").select("*").is("deleted_at", null);
    if (catData) setCategories(catData);

    const { data: prodData } = await supabase
      .from("products")
      .select("*, categories(category_name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (prodData) setProducts(prodData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIKA PAGINASI ---
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage]);

  const handleEdit = (product: any) => {
    setEditId(product.id);
    setName(product.name);
    setCategoryId(product.category_id?.toString() || "");
    setWeight(product.weight_grams?.toString() || "");
    setBasePrice(product.base_price?.toString() || "");
    setPurchasePrice(product.purchase_price?.toString() || "");
    setStock(product.stock_quantity?.toString() || "");
    setMinStock(product.min_stock?.toString() || "3");
    setImageFile(null); 
    setIsDrawerOpen(true); // Buka laci saat klik ubah
  };

  const triggerRestock = (product: any) => {
    setRestockModal({ isOpen: true, product });
    setRestockQty("");
    setRestockPrice(product.purchase_price?.toString() || ""); 
    setRestockNotes("Pembelian batch baru");
  };

  const executeRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModal.product) return;
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email || "Unknown Admin";
      const qty = parseInt(restockQty);
      const price = parseFloat(restockPrice);

      await supabase.from("stock_mutations").insert([{ product_id: restockModal.product.id, mutation_type: "IN", quantity: qty, purchase_price: price, notes: restockNotes }]);
      
      const newTotalStock = restockModal.product.stock_quantity + qty;
      await supabase.from("products").update({ stock_quantity: newTotalStock, purchase_price: price }).eq("id", restockModal.product.id);

      await logAdminAction(adminEmail, "INVENTORY", `Menambah stok ${qty} unit untuk ${restockModal.product.name}. Harga Modal: Rp ${price}`, "products", restockModal.product.id);

      showToast(`Berhasil menambah ${qty} unit ${restockModal.product.name}.`);
      setRestockModal({ isOpen: false, product: null });
      fetchData();
    } catch (err: any) {
      showToast("Gagal melakukan restock: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const triggerDelete = (id: number) => setDeleteModal({ isOpen: true, id });

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    setLoading(true);
    
    const { data: userData } = await supabase.auth.getUser();
    const adminEmail = userData.user?.email || "Unknown Admin";

    const { error } = await supabase.from("products").update({ deleted_at: new Date().toISOString() }).eq("id", deleteModal.id);
    
    if (error) {
      showToast("Gagal mengarsipkan: " + error.message, "error");
    } else {
      await logAdminAction(adminEmail, "INVENTORY", `Mengarsipkan produk (ID: ${deleteModal.id}).`, "products", deleteModal.id.toString());
      showToast("Produk diarsipkan.");
      fetchData(); 
    }
    setDeleteModal({ isOpen: false, id: null });
    setLoading(false);
  };

  const resetForm = () => {
    setEditId(null); setName(""); setCategoryId(""); setWeight(""); setBasePrice(""); setPurchasePrice(""); setStock("1"); setMinStock("3"); setImageFile(null);
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email || "Unknown Admin";

      const productData = {
        category_id: parseInt(categoryId), name: name, weight_grams: parseFloat(weight), base_price: parseFloat(basePrice),
        purchase_price: parseFloat(purchasePrice), stock_quantity: parseInt(stock), min_stock: parseInt(minStock),
      };

      if (editId) {
        await supabase.from("products").update(productData).eq("id", editId);
        if (imageFile) {
          const fileExt = imageFile.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
          await supabase.storage.from("product-images").upload(fileName, imageFile);
          const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
          await supabase.from("product_images").insert([{ product_id: editId, image_url: publicUrlData.publicUrl, is_primary: true }]);
        }
        await logAdminAction(adminEmail, "INVENTORY", `Mengkoreksi data produk: ${name}.`, "products", editId.toString());
        showToast("Spesifikasi diperbarui.");
      } else {
        if (!imageFile || !categoryId) { showToast("Foto & Kategori wajib diisi!", "error"); setLoading(false); return; }
        
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        await supabase.storage.from("product-images").upload(fileName, imageFile);
        const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(fileName);

        const { data: newProduct } = await supabase.from("products").insert([productData]).select().single();
        await supabase.from("product_images").insert([{ product_id: newProduct.id, image_url: publicUrlData.publicUrl, is_primary: true }]);
        
        await logAdminAction(adminEmail, "INVENTORY", `Produk baru: ${name} (${stock} Unit).`, "products", newProduct.id.toString());
        showToast("Produk dipublikasikan.");
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast("Kesalahan: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto relative overflow-x-hidden">
      
      {/* HEADER PAGE */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Katalog Inventaris</h2>
          <p className="text-xs text-zinc-500 mt-1">Manajemen aset fisik dan kendali stok.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsDrawerOpen(true); }}
          className="bg-[#C5A059] text-[#0F110F] px-6 py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#B38F4B] transition-colors shadow-lg shadow-[#C5A059]/10"
        >
          + Registrasi Aset Baru
        </button>
      </div>

      {/* TABEL FULL WIDTH */}
      <div className="bg-[#121412] rounded border border-[#2E3730] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#161B18] border-b border-[#2E3730]">
              <tr>
                <th className="px-6 py-4 font-semibold text-[#C5A059] text-[10px] uppercase tracking-wider">Produk / Spesifikasi</th>
                <th className="px-6 py-4 font-semibold text-[#C5A059] text-[10px] uppercase tracking-wider text-right">Nilai Finansial (Modal / Jual)</th>
                <th className="px-6 py-4 font-semibold text-[#C5A059] text-[10px] uppercase tracking-wider text-center">Stok Gudang</th>
                <th className="px-6 py-4 font-semibold text-[#C5A059] text-[10px] uppercase tracking-wider text-right">Opsi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E3730]">
              {products.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm">Katalog inventaris kosong.</td></tr>
              ) : (
                paginatedProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#161B18] transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-200">{prod.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">{prod.categories?.category_name} • {prod.weight_grams} Gram</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest line-through mb-1">
                        Modal: Rp {new Intl.NumberFormat("id-ID").format(prod.purchase_price || 0)}
                      </p>
                      <p className="text-green-400 font-bold">Rp {new Intl.NumberFormat("id-ID").format(prod.base_price)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded text-xs font-bold border ${
                        prod.stock_quantity <= prod.min_stock 
                        ? 'bg-red-900/20 text-red-400 border-red-900/50 animate-pulse' 
                        : 'bg-green-900/10 text-green-500 border-green-900/30'
                      }`}>
                        {prod.stock_quantity} Unit
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={() => triggerRestock(prod)} className="text-green-500 hover:text-green-400 text-[10px] font-bold uppercase tracking-widest transition-colors">+ Restock</button>
                        <span className="text-zinc-700">|</span>
                        <button onClick={() => handleEdit(prod)} className="text-[#C5A059] hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">Edit</button>
                        <span className="text-zinc-700">|</span>
                        <button onClick={() => triggerDelete(prod.id)} className="text-red-500 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest transition-colors">Arsip</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* NAVIGASI PAGINASI BAWAH */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#2E3730] bg-[#161B18] flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, products.length)} dari {products.length} Aset
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-[#2E3730] rounded text-xs text-zinc-400 hover:bg-[#2E3730] hover:text-white disabled:opacity-30 transition-colors"
              >
                ← Prev
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-[#2E3730] rounded text-xs text-zinc-400 hover:bg-[#2E3730] hover:text-white disabled:opacity-30 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- LACI FORMULIR (OFF-CANVAS DRAWER) --- */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetForm}></div>
        <div className={`absolute top-0 right-0 w-full md:w-[450px] h-full bg-[#121412] border-l border-[#2E3730] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          <div className="px-6 py-6 border-b border-[#2E3730] flex justify-between items-center bg-[#161B18]">
            <div>
              <h3 className="text-lg font-bold text-[#C5A059]">{editId ? "Koreksi Master Data" : "Entri Aset Baru"}</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Formulir Pendaftaran Komoditas</p>
            </div>
            <button onClick={resetForm} className="text-zinc-500 hover:text-white text-xl">✕</button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <form id="product-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{editId ? "Ubah Foto (Opsional)" : "Foto Fisik Produk (Wajib)"}</label>
                <div className="border border-dashed border-[#2E3730] p-4 rounded text-center hover:border-[#C5A059] transition-colors cursor-pointer bg-[#0F110F]">
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} className="w-full text-xs text-zinc-400 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-[#1C221E] file:text-[#C5A059]" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Kategori Induk</label>
                <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none">
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.category_name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Tipe Spesifik / Nama Produk</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Antam Tahun 2024" className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Massa (Gram)</label>
                  <input type="number" step="0.01" required value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.00" className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Set Stok Awal</label>
                  <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Batas Stok Kritis</label>
                <input type="number" required value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="3" className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2E3730]">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Modal (IDR)</label>
                  <input type="number" required value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="Contoh: 1100000" className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Basis Jual (IDR)</label>
                  <input type="number" required value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="Contoh: 1250000" className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
                </div>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-[#2E3730] bg-[#161B18]">
            <button type="submit" form="product-form" disabled={loading} className="w-full bg-[#C5A059] text-[#0F110F] font-bold text-xs uppercase tracking-widest rounded py-4 hover:bg-[#B38F4B] disabled:opacity-50 transition-colors">
              {loading ? "Memproses Data..." : editId ? "Simpan Perubahan" : "Publikasikan Aset"}
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL DENGAN ANIMASI FADE & SCALE --- */}
      <div className={`fixed inset-0 z-[110] flex items-center justify-center transition-all duration-300 ${restockModal.isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRestockModal({ isOpen: false, product: null })}></div>
        <div className={`bg-[#121412] border border-[#2E3730] rounded shadow-2xl p-6 max-w-sm w-full relative transform transition-all duration-300 ease-out ${restockModal.isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
          <h3 className="text-lg font-bold text-[#C5A059] mb-1">Pencatatan Restock</h3>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-6">Mutasi Masuk: <span className="text-white font-bold">{restockModal.product?.name}</span></p>
          
          <form onSubmit={executeRestock} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2">Jumlah Masuk (Unit)</label>
              <input type="number" required min="1" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2">Harga Modal / Unit (IDR)</label>
              <input type="number" required value={restockPrice} onChange={(e) => setRestockPrice(e.target.value)} className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2">Catatan Audit</label>
              <input type="text" value={restockNotes} onChange={(e) => setRestockNotes(e.target.value)} placeholder="Contoh: Batch supplier A" className="w-full bg-[#161B18] border border-[#2E3730] text-zinc-100 rounded p-3 text-sm focus:border-[#C5A059] focus:outline-none" />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setRestockModal({ isOpen: false, product: null })} className="flex-1 bg-transparent border border-zinc-700 text-zinc-400 font-bold text-[10px] uppercase tracking-widest rounded py-3 hover:bg-zinc-900 transition-colors">Batal</button>
              <button type="submit" disabled={loading} className="flex-1 bg-green-900/50 text-green-400 border border-green-800 font-bold text-[10px] uppercase tracking-widest rounded py-3 hover:bg-green-900 transition-colors">Simpan Mutasi</button>
            </div>
          </form>
        </div>
      </div>

      <div className={`fixed inset-0 z-[110] flex items-center justify-center transition-all duration-300 ${deleteModal.isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteModal({ isOpen: false, id: null })}></div>
        <div className={`bg-[#121412] border border-[#2E3730] rounded shadow-2xl p-6 max-w-sm w-full relative transform transition-all duration-300 ease-out ${deleteModal.isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
          <h3 className="text-lg font-bold text-red-500 mb-2">Otorisasi Pengarsipan</h3>
          <p className="text-[10px] uppercase tracking-widest leading-relaxed text-zinc-400 mb-6">Aset ini akan disembunyikan dari etalase. Data historis dipertahankan.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModal({ isOpen: false, id: null })} className="flex-1 bg-transparent border border-zinc-700 text-zinc-400 font-bold text-[10px] uppercase tracking-widest rounded py-3 hover:bg-zinc-900 transition-colors">Batal</button>
            <button onClick={executeDelete} disabled={loading} className="flex-1 bg-red-900/50 border border-red-800 text-red-400 font-bold text-[10px] uppercase tracking-widest rounded py-3 hover:bg-red-900 transition-colors">Ya, Arsipkan</button>
          </div>
        </div>
      </div>

      <div className={`fixed bottom-8 right-8 z-[150] transition-all duration-300 ease-out transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none'}`}>
        <div className={`px-6 py-4 rounded shadow-2xl border-l-4 ${toast.type === 'success' ? 'bg-[#1C221E] border-[#C5A059]' : 'bg-[#221818] border-red-500'}`}>
          <p className="text-sm font-medium text-zinc-100 tracking-wide">{toast.message}</p>
        </div>
      </div>

    </div>
  );
}