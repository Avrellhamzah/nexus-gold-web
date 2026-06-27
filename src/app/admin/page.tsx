"use client";

import { useState, useEffect } from "react";
import { supabase, logAdminAction } from "../../lib/supabase"; // Path disesuaikan
import SalesChart from "../../components/SalesChart";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [criticalProducts, setCriticalProducts] = useState<any[]>([]);
  const [goldAnalysis, setGoldAnalysis] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  
  const [liveSpotPrice, setLiveSpotPrice] = useState<number>(1361639);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncGlobalPrices = async () => {
    if (!window.confirm(`Perbarui seluruh harga katalog berdasarkan Harga Spot: Rp ${new Intl.NumberFormat("id-ID").format(liveSpotPrice)}/gr?`)) return;
    setIsSyncing(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email || "Unknown Admin";

      const { data: products, error: fetchError } = await supabase
        .from("products")
        .select("id, weight_grams, markup_percentage, manufacturing_cost")
        .is("deleted_at", null);

      if (fetchError) throw fetchError;
      if (!products || products.length === 0) return;

      const updates = products.map((prod) => {
        const baseGoldValue = liveSpotPrice * prod.weight_grams;
        const marginValue = baseGoldValue * (prod.markup_percentage / 100);
        const newBasePrice = Math.round(baseGoldValue + marginValue + prod.manufacturing_cost);
        return { id: prod.id, base_price: newBasePrice };
      });

      const updatePromises = updates.map((update) =>
        supabase.from("products").update({ base_price: update.base_price }).eq("id", update.id)
      );

      await Promise.all(updatePromises);
      
      // Catat Aktivitas Perubahan Harga Global
      await logAdminAction(adminEmail, "PRICING", `Mengalibrasi massal harga seluruh katalog ke basis Spot XAU Rp ${new Intl.NumberFormat("id-ID").format(liveSpotPrice)}/gr.`, "products");
      
      alert("Berhasil! Seluruh harga aset komoditas telah dikalibrasi mengikuti pasar global.");
    } catch (err: any) {
      console.error("Gagal menyinkronkan harga:", err);
      alert("Kesalahan Mesin Harga: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch("/api/harga-emas");
        const data = await res.json();
        setGoldAnalysis(data);
      } catch (err) {
        console.error("Gagal menarik analisis:", err);
      }
    };

    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      // 1. Tarik Data Utama
      const { data: invoices } = await supabase.from("invoices").select("created_at, total_amount, product_id, quantity, status");
      const { data: products } = await supabase.from("products").select("id, purchase_price");
      
      // Tarik Data Item untuk kalkulasi Top 3 Terlaris
      const { data: allItems } = await supabase.from("invoice_items").select("product_name, quantity, invoices!inner(status)").in("invoices.status", ["LUNAS", "DIKIRIM", "SELESAI"]);

      // 2. Kalkulasi Finansial
      const totalRev = invoices?.filter(i => i.status === 'COMPLETED' || i.status === 'SELESAI').reduce((s, i) => s + i.total_amount, 0) || 0;
      const totalCost = invoices?.filter(i => i.status === 'COMPLETED' || i.status === 'SELESAI').reduce((sum, inv) => {
        const prod = products?.find(p => p.id === inv.product_id);
        return sum + ((prod?.purchase_price || 0) * inv.quantity);
      }, 0) || 0;

      const netProfit = totalRev - totalCost;
      const margin = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : "0";

      const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(); d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
      }).reverse();

      const processedData = last7Days.map(date => {
          const dailyTotal = invoices?.filter(inv => inv.created_at.startsWith(date) && (inv.status === 'COMPLETED' || inv.status === 'SELESAI'))
          .reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
          return { date: date.slice(5), amount: dailyTotal };
      });

      // 3. Olah Data Produk (Stok Kritis)
      const { data: productsData } = await supabase.from("products").select("name, stock_quantity, min_stock");
      const critical = productsData?.filter(p => p.stock_quantity <= p.min_stock) || [];
      
      // 4. Kalkulasi Dinamis Top 3 Produk
      const salesMap: Record<string, number> = {};
      allItems?.forEach((item: any) => {
        salesMap[item.product_name] = (salesMap[item.product_name] || 0) + item.quantity;
      });
      const top3Array = Object.entries(salesMap).sort((a,b) => b[1] - a[1]).slice(0,3).map(x => ({ name: x[0], sold: x[1] }));

      // 5. Update State
      setCriticalProducts(critical);
      setChartData(processedData);
      setTopProducts(top3Array);
      setStats({
          totalRevenue: totalRev,
          totalCost: totalCost,
          netProfit: netProfit,
          profitMargin: margin
      });
    };

    loadDashboardData();
  }, []);

  return (
    <div className="max-w-5xl space-y-6">
      <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Ringkasan Eksekutif</h2>

      <div className="bg-[#121412] p-6 rounded-lg border border-[#C5A059]/30 mb-8 shadow-[0_0_20px_rgba(197,160,89,0.05)]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-[#C5A059] font-bold text-lg mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Dynamic Pricing Engine
            </h3>
            <p className="text-zinc-400 text-xs">Kalibrasi nilai aset serentak mengikuti pergerakan XAU/IDR global.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-[#0F110F] border border-[#2E3730] rounded p-2 px-4 flex-1 md:w-64">
                <label className="block text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Spot Price / Gram (IDR)</label>
                <div className="flex items-center">
                <span className="text-zinc-400 mr-2 font-mono text-sm">Rp</span>
                <input 
                    type="number" 
                    value={liveSpotPrice}
                    onChange={(e) => setLiveSpotPrice(Number(e.target.value))}
                    className="bg-transparent w-full text-white font-bold text-lg focus:outline-none font-mono"
                />
                </div>
            </div>
            
            <button 
                onClick={handleSyncGlobalPrices}
                disabled={isSyncing}
                className="bg-[#C5A059] text-black font-bold text-xs uppercase tracking-widest px-6 py-4 rounded hover:bg-[#B38F4B] transition-all disabled:opacity-50 h-full"
            >
                {isSyncing ? "Mengalibrasi..." : "Sinkronisasi Massal"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#121412] p-4 rounded border border-[#2E3730] shadow-2xl mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#C5A059] uppercase tracking-wider">Live Spot Emas Dunia (XAU / IDR)</h3>
            <p className="text-xs text-zinc-500">Data real-time bursa komoditas global. 1 Troy Ounce = 31.1 Gram.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Live Market</span>
          </div>
        </div>
        
        <div className="w-full h-[400px] rounded overflow-hidden border border-[#1C221E]">
          <iframe 
            title="Live Gold Price"
            src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d87&symbol=FX_IDC%3AXAUIDR&interval=60&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=121412&studies=%5B%5D&theme=dark&style=1&timezone=Asia%2FJakarta&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=id"
            style={{ width: "100%", height: "100%", border: "none" }}
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {goldAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-[#1C221E] border border-[#2E3730] p-4 rounded-lg">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Spot Dunia / Ounce</p>
            <p className="text-lg font-bold text-zinc-200">Rp {new Intl.NumberFormat("id-ID").format(goldAnalysis.liveSpotOunceIDR)}</p>
          </div>
          
          <div className="bg-[#1C221E] border border-[#2E3730] p-4 rounded-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1 bg-[#C5A059]"></div>
            <p className="text-[10px] text-[#C5A059] font-bold uppercase tracking-widest mb-1">Murni / Gram (Tanpa Cetak)</p>
            <p className="text-lg font-bold text-zinc-200">Rp {new Intl.NumberFormat("id-ID").format(goldAnalysis.rawGramPrice)}</p>
          </div>

          <div className="bg-[#1C221E] border border-green-900/50 p-4 rounded-lg relative overflow-hidden bg-gradient-to-br from-[#1C221E] to-green-950/20">
            <div className="absolute right-0 top-0 h-full w-1 bg-green-500"></div>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mb-1">Estimasi Antam 1g (Termasuk Premium)</p>
            <p className="text-xl font-black text-green-400 tracking-tight">Rp {new Intl.NumberFormat("id-ID").format(goldAnalysis.estimatedAntamPrice)}</p>
            <p className="text-[9px] text-zinc-500 mt-1">*Indikator ini memprediksi rilis harga Antam pada pkl 08:00 WIB hari ini.</p>
          </div>
        </div>
      )}

      <div className="bg-[#121412] p-6 rounded border border-[#2E3730] shadow-2xl">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Total Pendapatan Selesai</h3>
        <p className="text-3xl font-light text-[#C5A059]">
          <span className="text-lg">Rp</span> {new Intl.NumberFormat("id-ID").format(stats?.totalRevenue || 0)}
        </p>
      </div>

      <div className="bg-[#121412] p-6 rounded border border-[#2E3730] shadow-2xl">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Profit Bersih (Net)</h3>
        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-light text-green-400">
            <span className="text-lg">Rp</span> {new Intl.NumberFormat("id-ID").format(stats?.netProfit || 0)}
          </p>
          <span className="text-xs font-bold text-zinc-600 bg-[#1C221E] px-2 py-1 rounded">
            MARJIN: {stats?.profitMargin || 0}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-[#121412] p-6 rounded border border-[#2E3730] shadow-2xl">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Indikator Kesehatan</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-300">Efisiensi Penagihan (Lunas/Total)</span>
                <span className="text-sm font-bold text-[#C5A059]">85%</span>
            </div>
            <div className="w-full bg-[#1C221E] h-2 rounded-full overflow-hidden">
                <div className="bg-[#C5A059] h-full w-[85%]"></div>
            </div>
            <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-zinc-300">Perputaran Stok (Rata-rata Harian)</span>
                <span className="text-sm font-bold text-green-400">4.2 Hari</span>
            </div>
          </div>
        </div>

        <div className="bg-[#121412] p-6 rounded border border-[#2E3730] shadow-2xl">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Top 3 Aset Terlaris</h3>
          <ul className="space-y-3">
            {topProducts.length === 0 ? (
              <li className="text-sm text-zinc-500 italic">Belum ada data penjualan tercatat.</li>
            ) : (
              topProducts.map((item, i) => (
                <li key={i} className="flex justify-between text-sm border-b border-[#2E3730] pb-2 last:border-0">
                  <span className="text-zinc-300">{i + 1}. {item.name}</span>
                  <span className="text-zinc-500 font-mono text-xs">Terjual {item.sold} Unit</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {criticalProducts && criticalProducts.length > 0 && (
          <div className="bg-[#221818] border border-red-900 p-6 rounded shadow-2xl mt-6">
            <h3 className="text-xs font-medium text-red-500 uppercase tracking-wider mb-4">Peringatan: Stok Kritis</h3>
            <ul className="space-y-2">
              {criticalProducts.map((p, i) => (
                <li key={i} className="flex justify-between text-sm text-red-200">
                  <span>{p.name}</span>
                  <span className="font-bold">Sisa: {p.stock_quantity} unit</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <SalesChart data={chartData} />
    </div>
  );
}