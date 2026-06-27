import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/masuk";

  // Membaca tiket "sb-auth-token" yang dibuat oleh AuthContext
  const hasSupabaseSession = request.cookies.has("sb-auth-token");

  // 1. Jika belum login mencoba masuk ke /admin
  if (isAdminRoute && !hasSupabaseSession) {
    const loginUrl = new URL("/masuk", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika SUDAH login tapi berada di halaman /masuk
  if (isLoginRoute && hasSupabaseSession) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*", 
    "/masuk" 
  ],
};