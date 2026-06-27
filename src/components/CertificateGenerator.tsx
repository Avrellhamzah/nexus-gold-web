"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

interface CertificateProps {
  invoice: any;
  userName: string;
}

export default function CertificateGenerator({ invoice, userName }: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!certificateRef.current) return;
    setIsGenerating(true);

    try {
      // Menggunakan engine browser asli, kebal terhadap error parse CSS (lab/oklch)
      const dataUrl = await toPng(certificateRef.current, { 
        quality: 1, 
        pixelRatio: 2, // Resolusi tinggi
        backgroundColor: "#0F110F" 
      });

      // Membuat dokumen PDF (A4 Landscape)
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      
      // Ukuran A4 Landscape: 297mm x 210mm
      const pdfWidth = 297; 
      const pdfHeight = 210;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Sertifikat_Nexus_Gold_${invoice.invoice_number}.pdf`);
    } catch (error) {
      console.error("Gagal membuat sertifikat:", error);
      alert("Terjadi kesalahan saat memproses sertifikat PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button 
        onClick={generatePDF} 
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] font-bold text-xs uppercase tracking-widest py-3.5 rounded hover:from-[#B38F4B] hover:to-[#9A7B40] disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] flex justify-center items-center gap-2"
      >
        {isGenerating ? (
          <>
            <svg className="w-4 h-4 animate-spin text-[#0F110F]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Mencetak Dokumen Legal...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Otorisasi & Unduh Dokumen
          </>
        )}
      </button>

      {/* TEMPLATE SERTIFIKAT (DISEMBUNYIKAN DI LUAR LAYAR) */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        <div 
          ref={certificateRef} 
          className="w-[1123px] h-[794px] bg-[#0F110F] text-zinc-100 p-12 relative flex flex-col justify-between overflow-hidden"
          style={{ fontFamily: "sans-serif" }}
        >
          {/* Bingkai Emas */}
          <div className="absolute inset-6 border-4 border-double border-[#C5A059] opacity-80 pointer-events-none"></div>
          <div className="absolute inset-8 border border-[#C5A059] opacity-30 pointer-events-none"></div>

          {/* Header */}
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#C5A059] flex items-center justify-center">
                <span className="text-[#0F110F] font-black text-4xl" style={{ fontFamily: "Georgia, serif" }}>N</span>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-[0.2em] text-[#C5A059]">NEXUS GOLD</h1>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400 mt-1">Certificate of Authenticity & Ownership</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Document No.</p>
              <p className="text-xl font-mono text-[#C5A059]">{invoice.invoice_number}</p>
            </div>
          </div>

          {/* Konten Utama */}
          <div className="text-center relative z-10 flex-1 flex flex-col justify-center">
            <p className="text-sm uppercase tracking-[0.4em] text-zinc-500 mb-6">Dokumen Ini Menyatakan Bahwa</p>
            <h2 className="text-5xl font-bold text-white mb-6 uppercase tracking-wider" style={{ fontFamily: "Georgia, serif" }}>
              {userName}
            </h2>
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-12">
              Telah diakui secara sah sebagai pemilik dari aset komoditas fisik berikut:
            </p>

            <div className="max-w-3xl mx-auto w-full bg-[#161B18] border border-[#2E3730] p-6 rounded">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#2E3730]">
                    <th className="py-3 text-xs font-bold uppercase tracking-widest text-[#C5A059]">Spesifikasi Aset</th>
                    <th className="py-3 text-xs font-bold uppercase tracking-widest text-[#C5A059] text-center">Kuantitas</th>
                    <th className="py-3 text-xs font-bold uppercase tracking-widest text-[#C5A059] text-right">Nilai Akuisisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E3730]">
                  {invoice.invoice_items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-4 font-bold text-zinc-200 text-lg">{item.product_name}</td>
                      <td className="py-4 text-center font-mono text-zinc-400">{item.quantity} Unit</td>
                      <td className="py-4 text-right font-mono text-zinc-400">Rp {new Intl.NumberFormat("id-ID").format(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer & Tanda Tangan */}
          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Tanggal Akuisisi</p>
              <p className="text-lg font-bold text-zinc-300">
                {new Date(invoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            <div className="text-center">
              <div className="mb-4">
                <span className="text-[#C5A059] text-5xl opacity-80" style={{ fontFamily: "cursive" }}>Nexus Gold</span>
              </div>
              <div className="w-48 h-px bg-[#2E3730] mx-auto mb-2"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Otoritas Kepatuhan</p>
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mt-1">Nexus Gold Authorized Signature</p>
            </div>
          </div>

          {/* Watermark Logo Latar Belakang */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <span className="text-[400px] font-black text-[#C5A059]" style={{ fontFamily: "Georgia, serif" }}>N</span>
          </div>

        </div>
      </div>
    </>
  );
}