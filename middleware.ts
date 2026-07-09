import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getAuthFailureReason } from '@/lib/rbac/access'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow static files, api/auth, and auth pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') ||
    pathname === '/signin' ||
    pathname === '/unauthorized' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const reason = getAuthFailureReason(pathname, token, token?.roles)

  if (reason === 'missing-session' || reason === 'token-expired') {
    const signInUrl = new URL('/signin', req.url)
    signInUrl.searchParams.set('reason', reason)
    return NextResponse.redirect(signInUrl)
  }

  if (reason === 'role-denied') {
    const unauthorizedUrl = new URL('/unauthorized', req.url)
    unauthorizedUrl.searchParams.set('reason', reason)
    return NextResponse.redirect(unauthorizedUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*']
}
