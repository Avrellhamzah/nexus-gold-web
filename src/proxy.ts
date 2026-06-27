import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Nama fungsi WAJIB 'middleware' (bukan 'proxy') agar Next.js mengenalinya
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/masuk"; // Sesuai dengan rute baru Anda

  // Membaca keberadaan token sesi Supabase di cookies
  const cookies = request.cookies.getAll();
  const hasSupabaseSession = cookies.some(cookie => cookie.name.includes("auth-token"));

  // 1. Jika mencoba meretas masuk ke admin tanpa sesi -> Lempar ke /masuk
  if (isAdminRoute && !hasSupabaseSession) {
    const loginUrl = new URL("/masuk", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika SUDAH login tapi iseng membuka halaman /masuk -> Lempar ke Dasbor
  if (isLoginRoute && hasSupabaseSession) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

// Konfigurasi Matcher yang selaras
export const config = {
  matcher: [
    "/admin/:path*", 
    "/masuk" // <--- Diperbaiki agar middleware membaca halaman masuk
  ],
};