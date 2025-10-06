import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = await getSession()
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // If no session and trying to access protected route, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check role-based access
  const adminRoutes = ['/admin', '/users', '/reports', '/cash-register']
  const sysadminRoutes = ['/system', '/config']

  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isSysadminRoute = sysadminRoutes.some(route => pathname.startsWith(route))

  if (isAdminRoute && !['ADMIN', 'SYSADMIN'].includes(session.role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (isSysadminRoute && session.role !== 'SYSADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


