"use client";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    // Kelas ini akan memicu animasi CSS yang kita buat setiap kali URL berubah
    <div className="animate-page-enter">
      {children}
    </div>
  );
}