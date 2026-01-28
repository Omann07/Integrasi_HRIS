import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const role = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;

  // 1. Proteksi Rute Admin
  const isAdminRoute = 
    pathname.startsWith('/dashboard/admin') || 
    pathname.startsWith('/company/admin') || 
    pathname.startsWith('/profile/admin');

  if (isAdminRoute) {
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/dashboard/employee', request.url));
    }
  }

  // 2. Proteksi Halaman Login (Redirect jika sudah login)
  const isAuthPage = 
    pathname === '/auth/admin/login' || 
    pathname === '/auth/employee/login';

  if (isAuthPage && role) {
    const target = (role === 'ADMIN' || role === 'SUPERADMIN') 
      ? '/dashboard/admin' 
      : '/dashboard/employee';
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/company/:path*', 
    '/profile/:path*', 
    '/auth/:path*'
  ],
};