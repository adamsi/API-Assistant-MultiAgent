import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/home', '/auth', '/login-success'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

    const cookie = request.cookies.get('access_token');
    
    if (!cookie) {
      console.log('[Middleware] No cookies found');
      return NextResponse.redirect(new URL('/home', request.url));
    }

      return NextResponse.next();
  }



export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg)$).*)',
  ],
};

