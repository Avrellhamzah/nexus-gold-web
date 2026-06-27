"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function TermsAndConditionsPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("nexus-theme");
    if (savedTheme === "dark") setIsDark(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("nexus-theme", newTheme ? "dark" : "light");
  };

  const theme = {
    bgMain: isDark ? "bg-[#0F110F]" : "bg-[#FDFDFB]",
    bgCard: isDark ? "bg-[#161B18]" : "bg-white",
    textPrimary: isDark ? "text-zinc-100" : "text-[#1A241E]",
    textSecondary: isDark ? "text-zinc-400" : "text-[#3A4D40]",
    border: isDark ? "border-[#2E3730]" : "border-[#E1E5E2]",
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-700 ${theme.bgMain} ${theme.textPrimary}`}>
      <Navbar isDark={isDark} toggleTheme={toggleTheme} />

      <main className="max-w-4xl mx-auto px-6 py-20 min-h-screen">
        <div className="text-center mb-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C5A059] mb-4">Dokumen Legal & Kepatuhan</p>
          <h1 className="text-4xl md:text-5xl font-black font-[family-name:var(--font-playfair)] mb-6">Syarat & Ketentuan Layanan</h1>
          <p className={`text-sm ${theme.textSecondary}`}>Pembaruan Terakhir: 27 Juni 2026 | Dokumen No: NXG-LEG-2026-001</p>
        </div>

        <div className={`p-8 md:p-12 border ${theme.border} ${theme.bgCard} shadow-xl rounded-lg space-y-10 text-sm leading-relaxed ${theme.textSecondary}`}>
          
          <section>
            <h2 className={`text-lg font-bold font-[family-name:var(--font-playfair)] mb-4 ${theme.textPrimary}`}>PENGANTAR & KESEPAKATAN MENGIKAT</h2>
            <p>
              Dengan mengakses, mendaftar, atau melakukan transaksi melalui platform <strong>Nexus Gold</strong> ("Platform", "Kami"), Anda ("Pengguna", "Klien") setuju untuk tunduk dan terikat secara hukum pada Syarat & Ketentuan ini. Dokumen ini merupakan perjanjian elektronik yang sah berdasarkan Undang-Undang No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE) dan perubahannya. Jika Anda tidak menyetujui sebagian atau seluruh syarat ini, Anda dilarang menggunakan layanan Kami.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-bold font-[family-name:var(--font-playfair)] mb-4 ${theme.textPrimary}`}>PASAL 1: SIFAT LAYANAN & LEGALITAS BISNIS</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Komoditas Fisik:</strong> Nexus Gold adalah platform perdagangan elektronik (e-commerce) yang memfasilitasi jual beli komoditas <strong>emas fisik murni (kadar 99,99%)</strong>.</li>
              <li><strong>Bukan Produk Derivatif:</strong> Kami secara tegas menyatakan bahwa Platform ini <strong>TIDAK</strong> menyelenggarakan perdagangan berjangka, kontrak gulir (rollover), margin trading, atau instrumen derivatif lainnya tanpa wujud barang (*underlying asset*).</li>
              <li>Setiap unit emas digital yang tercatat di dasbor pengguna merepresentasikan wujud fisik emas yang nyata dan disimpan di fasilitas brankas terdaftar atau langsung dikirimkan ke alamat Klien.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold font-[family-name:var(--font-playfair)] mb-4 ${theme.textPrimary}`}>PASAL 2: KEBIJAKAN KYC (KNOW YOUR CUSTOMER) & ANTI-PENCUCIAN UANG (AML)</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Sesuai dengan regulasi perundang-undangan di Indonesia mengenai pencegahan Tindak Pidana Pencucian Uang (TPPU) dan Pendanaan Terorisme (TPPT), Nexus Gold menerapkan prinsip pengenalan nasabah (KYC) secara ketat.</li>
              <li>Untuk transaksi dengan nilai melebihi ambang batas yang ditentukan, Klien wajib mengunggah identitas resmi (KTP) dan melakukan verifikasi wajah (Selfie).</li>
              <li>Nexus Gold berhak penuh untuk <strong>menolak transaksi, membekukan akun, dan/atau melaporkan Klien kepada otoritas berwajib (PPATK)</strong> jika ditemukan indikasi penipuan, pencucian uang, atau sumber dana yang melanggar hukum.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold font-[family-name:var(--font-playfair)] mb-4 ${theme.textPrimary}`}>PASAL 3: TRANSAKSI & FLUKTUASI HARGA</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Harga emas yang tertera di Platform bersifat dinamis (mengikuti <em>Live Spot Global Price</em>) dan dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
              <li>Harga final yang mengikat adalah harga yang tertera pada saat Klien menyelesaikan pembayaran di <em>Payment Gateway</em> (Checkout), bukan saat barang dimasukkan ke keranjang.</li>
              <li>Pembayaran wajib diselesaikan dalam batas waktu yang ditentukan oleh sistem. Kegagalan pembayaran akan membatalkan invoice secara otomatis.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold font-[family-name:var(--font-playfair)] mb-4 ${theme.textPrimary}`}>PASAL 4: LOGISTIK, SERAH-TERIMA, & ASURANSI</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Semua pengiriman aset fisik dilindungi oleh asuransi pengiriman penuh (100% dari nilai faktur).</li>
              <li><strong>Kewajiban Mutlak Klien:</strong> Klien <strong>WAJIB</strong> merekam video proses pembukaan paket (*unboxing*) dari keadaan paket utuh dan tersegel hingga aset terlihat jelas tanpa jeda/potongan video.</li>
              <li>Klaim asuransi akibat kerusakan, kehilangan, atau ketidaksesuaian barang akan <strong>OTOMATIS DITOLAK</strong> jika Klien tidak dapat melampirkan video *unboxing* yang memenuhi kriteria di atas melalui Dasbor Akun.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold font-[family-name:var(--font-playfair)] mb-4 ${theme.textPrimary}`}>PASAL 5: KEBIJAKAN PEMBATALAN & PENGEMBALIAN (REFUND)</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Mengingat emas adalah komoditas dengan harga fluktuatif (<em>market-to-market</em>), <strong>Klien tidak dapat melakukan pembatalan sepihak atau pengembalian dana (*refund*)</strong> setelah status transaksi dinyatakan "LUNAS".</li>
              <li>Nexus Gold hanya menerima pengembalian barang atau penukaran (Retur) jika terjadi kesalahan pengiriman dari pihak Kami (misal: spesifikasi barang berbeda dengan invoice) yang dibuktikan dengan bukti forensik video *unboxing*.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold font-[family-name:var(--font-playfair)] mb-4 ${theme.textPrimary}`}>PASAL 6: HAK MILIK & BUKTI ELEKTRONIK (E-CERTIFICATE)</h2>
            <p>
              Setelah transaksi selesai, Klien berhak mengunduh Sertifikat Kepemilikan Digital (E-Certificate) dari Dasbor Klien. Dokumen ini sah sebagai tanda terima pembelian dan pencatatan hak milik secara internal di ekosistem Nexus Gold, namun tidak menggantikan sertifikat keaslian fisik (misal: Sertifikat Antam/CertiEye) yang terlampir pada emas itu sendiri.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-bold font-[family-name:var(--font-playfair)] mb-4 ${theme.textPrimary}`}>PASAL 7: PENYELESAIAN SENGKETA & HUKUM YANG BERLAKU</h2>
            <p>
              Syarat dan Ketentuan ini ditafsirkan dan tunduk pada hukum Republik Indonesia. Segala sengketa yang timbul dari pelaksanaan perjanjian ini akan diselesaikan secara musyawarah mufakat. Apabila dalam waktu 30 (tiga puluh) hari musyawarah tidak tercapai, kedua belah pihak sepakat untuk menyelesaikannya secara hukum melalui yurisdiksi non-eksklusif Pengadilan Negeri setempat.
            </p>
          </section>
          
          <div className="pt-8 border-t border-[#2E3730] flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">© 2026 Nexus Gold Compliance Dept.</p>
            <div className="flex gap-4">
              <Link href="/" className="text-[#C5A059] text-xs font-bold uppercase tracking-wider hover:underline">← Kembali ke Beranda</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer isDark={isDark} />
    </div>
  );
}