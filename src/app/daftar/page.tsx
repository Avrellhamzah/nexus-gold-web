"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "../../context/ToastContext";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // --- STATE UNTUK MODAL SYARAT & KETENTUAN ---
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  
  const router = useRouter();
  const { showToast } = useToast(); // <-- INISIALISASI TOAST

  const handlePreRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      showToast("Sandi keamanan harus memiliki minimal 8 karakter.", "error"); // PENGGUNAAN TOAST
      return;
    }

    setShowTermsModal(true);
  };

  const executeRegistration = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName, 
          },
        },
      });

      if (error) throw error;

      // PENGGUNAAN TOAST UNTUK SUKSES
      showToast("Registrasi berhasil. Selamat datang di Nexus Gold.", "success");
      
      // Jeda 1 detik agar klien bisa melihat notifikasi suksesnya sebelum dilempar ke dasbor
      setTimeout(() => {
        router.push("/akun");
      }, 1000);

    } catch (error: any) {
      showToast(error.message || "Gagal melakukan registrasi.", "error"); // PENGGUNAAN TOAST
      setShowTermsModal(false); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F110F] text-zinc-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Ornamen Latar Belakang */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#C5A059] blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#121412] border border-[#2E3730] rounded-2xl shadow-2xl p-8 md:p-10 relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-12 h-12 bg-[#C5A059] flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(197,160,89,0.3)]">
            <span className="text-[#0F110F] font-black text-2xl font-[family-name:var(--font-playfair)]">N</span>
          </div>
          <h1 className="text-2xl font-black tracking-widest text-[#C5A059] uppercase">Buka Portofolio</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] mt-2 font-bold">Registrasi Klien Baru</p>
        </div>

        {errorMsg && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-500 text-xs p-4 rounded-lg mb-6 text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handlePreRegister} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Nama Lengkap (Sesuai Identitas)</label>
            <input 
              type="text" 
              required 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-4 rounded-lg bg-[#0F110F] border border-[#2E3730] text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059] transition-colors"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Alamat Surel (Email)</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-lg bg-[#0F110F] border border-[#2E3730] text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059] transition-colors"
              placeholder="klien@korporat.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Sandi Keamanan</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-lg bg-[#0F110F] border border-[#2E3730] text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059] transition-colors"
              placeholder="Minimal 8 karakter"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-widest py-4 rounded-lg hover:bg-zinc-700 hover:text-white transition-all mt-4"
          >
            Lanjutkan Pendaftaran
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500">
          Sudah memiliki portofolio? <Link href="/masuk" className="text-[#C5A059] font-bold hover:underline">Otorisasi Masuk</Link>
        </div>
      </div>

      {/* =========================================================================
          MODAL KONTRAK HUKUM & PRIVASI (TAMPIL SETELAH KLIK LANJUTKAN)
          ========================================================================= */}
      <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${showTermsModal ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        
        {/* Latar Belakang Gelap */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowTermsModal(false)}></div>
        
        <div className={`relative w-full max-w-2xl bg-[#121412] border border-[#C5A059]/30 rounded-xl shadow-2xl flex flex-col max-h-[85vh] transform transition-all duration-300 ease-out ${showTermsModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
          
          {/* Header Modal */}
          <div className="p-6 border-b border-[#2E3730] bg-[#161B18] rounded-t-xl flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold font-[family-name:var(--font-playfair)] text-[#C5A059]">Kontrak Kepatuhan & Syarat Layanan</h2>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Wajib disetujui sebelum pembukaan akun portofolio</p>
            </div>
            <button onClick={() => setShowTermsModal(false)} className="text-zinc-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Isi Konten Legal (Scrollable) */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-sm text-zinc-400 leading-relaxed bg-[#0F110F]">
            
            <div className="p-4 bg-yellow-900/10 border border-yellow-900/30 rounded-lg">
              <p className="text-xs text-yellow-500 font-bold mb-1">Perhatian Khusus:</p>
              <p className="text-[11px] text-yellow-600/80">Dengan mendaftar, Anda menyatakan bahwa dana yang digunakan untuk transaksi di Platform ini bukan berasal dari tindak pidana korupsi, pencucian uang (AML), atau pendanaan terorisme (CFT).</p>
            </div>

            <section>
              <h3 className="font-bold text-zinc-200 mb-2 font-[family-name:var(--font-playfair)] text-lg">1. Asas Legalitas Transaksi</h3>
              <p>Nexus Gold tunduk pada regulasi <strong>Badan Pengawas Perdagangan Berjangka Komoditi (Bappebti)</strong>. Setiap aset yang Anda beli melalui platform ini dijamin kepemilikan wujud fisik murninya (kadar 99,99%) dan bukan merupakan instrumen derivatif spekulatif.</p>
            </section>

            <section>
              <h3 className="font-bold text-zinc-200 mb-2 font-[family-name:var(--font-playfair)] text-lg">2. Kerahasiaan & Perlindungan Data Pribadi (UU PDP)</h3>
              <p>Sesuai dengan <strong>Undang-Undang No. 27 Tahun 2022 tentang Perlindungan Data Pribadi</strong>, Kami berkomitmen penuh menjaga privasi Anda:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Data identitas (KTP) dan biometrik (Selfie) digunakan <strong>secara eksklusif</strong> untuk kebutuhan verifikasi Anti-Pencucian Uang (KYC).</li>
                <li>Seluruh data dienkripsi dengan standar perbankan di dalam *database* tertutup.</li>
                <li>Kami <strong>tidak akan pernah</strong> menjual, menyewakan, atau mendistribusikan data riwayat transaksi dan data pribadi Anda kepada pihak ketiga (seperti agen asuransi, telemarketing, atau korporasi lain).</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-zinc-200 mb-2 font-[family-name:var(--font-playfair)] text-lg">3. Kesepakatan Jual-Beli & Serah-Terima</h3>
              <p>Klien menyadari bahwa emas adalah komoditas dengan harga fluktuatif global. Transaksi yang telah dikonfirmasi dan dilunasi <strong>tidak dapat dibatalkan atau di-refund (Non-refundable)</strong> karena perubahan harga pasar.</p>
              <p className="mt-2">Klien wajib mendokumentasikan pembukaan paket (Video Unboxing) secara utuh sebagai syarat mutlak klaim asuransi jika terjadi kehilangan/kerusakan oleh pihak logistik.</p>
            </section>
          </div>

          {/* Footer Modal (Check box & Button Action) */}
          <div className="p-6 border-t border-[#2E3730] bg-[#161B18] rounded-b-xl flex flex-col gap-4">
            
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input 
                  type="checkbox" 
                  checked={hasAcceptedTerms}
                  onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                  className="appearance-none w-5 h-5 border border-zinc-500 rounded bg-[#0F110F] checked:bg-[#C5A059] checked:border-[#C5A059] transition-colors cursor-pointer"
                />
                {hasAcceptedTerms && (
                  <svg className="absolute w-3.5 h-3.5 text-[#0F110F] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                )}
              </div>
              <span className={`text-xs select-none transition-colors ${hasAcceptedTerms ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                Saya menyatakan dalam keadaan sadar dan tanpa paksaan, telah membaca, memahami, serta menyetujui seluruh klausul kontrak elektronik ini beserta Kebijakan Privasinya.
              </span>
            </label>

            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setShowTermsModal(false)} 
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
              >
                Batalkan
              </button>
              
              <button 
                onClick={executeRegistration}
                disabled={!hasAcceptedTerms || loading}
                className="bg-gradient-to-r from-[#C5A059] to-[#B38F4B] text-[#0F110F] px-6 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(197,160,89,0.4)] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {loading ? "Menyinkronkan..." : "Setuju & Buka Portofolio"}
              </button>
            </div>
            
          </div>
        </div>
      </div>

    </div>
  );
}