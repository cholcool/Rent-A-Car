import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const debugEnabled = process.env.AUTH_DEBUG === 'true'
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const cookies = req.cookies.getAll().map((cookie) => cookie.name)
  const reason = !token ? 'missing-session' : token.exp && Date.now() >= token.exp * 1000 ? 'token-expired' : null

  if (debugEnabled) {
    console.log('[auth:middleware]', {
      path: req.nextUrl.pathname,
      hasToken: Boolean(token),
      expiresAt: token?.exp ? new Date(token.exp * 1000).toISOString() : null,
      cookies,
      reason,
    })
  }

  if (reason) {
    const signInUrl = new URL('/signin', req.url)
    signInUrl.searchParams.set('reason', reason)
    if (debugEnabled) {
      signInUrl.searchParams.set('debug', reason)
    }
    const response = NextResponse.redirect(signInUrl)
    if (debugEnabled) {
      response.headers.set('x-auth-debug', JSON.stringify({
        path: req.nextUrl.pathname,
        hasToken: Boolean(token),
        reason,
      }))
    }
    return response
  }

  const response = NextResponse.next()
  if (debugEnabled) {
    response.headers.set('x-auth-debug', JSON.stringify({
      path: req.nextUrl.pathname,
      hasToken: true,
      reason: null,
    }))
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth|signin|unauthorized|auth).*)']
}
