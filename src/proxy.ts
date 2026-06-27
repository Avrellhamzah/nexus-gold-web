import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Tentukan rute yang membutuhkan proteksi admin
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/masuk";

  // 2. Ambil token sesi Supabase dari Cookies
  // Supabase biasanya menyimpan auth token dengan pola nama 'sb-X-auth-token'
  const cookies = request.cookies.getAll();
  const hasSupabaseSession = cookies.some(cookie => cookie.name.includes("auth-token"));

  // 3. LOGIKA PROTEKSI:
  // Jika mencoba mengakses halaman admin tetapi tidak ada sesi login, tendang ke /login
  if (isAdminRoute && !hasSupabaseSession) {
    const loginUrl = new URL("/masuk", request.url);
    // Simpan URL asal agar setelah login bisa langsung diarahkan kembali ke halaman ini
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah login tetapi mencoba mengakses halaman login kembali, arahkan langsung ke dasbor admin
  if (isLoginRoute && hasSupabaseSession) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

// 4. Konfigurasi Matcher agar middleware tidak memeriksa file statis/gambar (menghemat performa)
export const config = {
  matcher: [
    "/admin/:path*", 
    "/login"
  ],
};