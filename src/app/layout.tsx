import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

// 1. IMPORT PROVIDER & DRAWER
import { CartProvider } from "../context/CartContext";
import CartDrawer from "../components/CartDrawer"; 
import { ToastProvider } from "../context/ToastContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Nexus Gold | Komoditas Mulia & Aset Generasional",
    description: "Platform manajemen portofolio logam mulia premium. Abadikan kekayaan Anda melalui aset keras nyata yang terverifikasi.",
    openGraph: {
      title: "Nexus Gold | Komoditas Mulia",
      description: "Sistem Otentikasi & Penyimpanan Komoditas Mulia.",
      url: "https://nexusgold.com", // Ganti dengan domain asli Anda nanti
      siteName: "Nexus Gold",
      images: [
        {
          url: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=1200&auto=format&fit=crop", // Gambar cover saat di-share
          width: 1200,
          height: 630,
          alt: "Nexus Gold Vault",
        },
      ],
      locale: "id_ID",
      type: "website",
    },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Tema default gelap untuk Drawer agar tetap mewah terlepas dari tema halaman
  const drawerTheme = {
    bgCard: "bg-[#0F110F]", textPrimary: "text-zinc-100", textSecondary: "text-zinc-400", border: "border-[#2E3730]", textMuted: "text-zinc-500"
  };

  return (
    <html lang="id">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <CartDrawer /> 
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}