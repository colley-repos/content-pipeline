import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes protection
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Dashboard requires authentication
    if (path.startsWith('/dashboard') && !token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Public routes
        if (
          path === '/' ||
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/pricing') ||
          path.startsWith('/share') ||
          path.startsWith('/api/auth') ||
          path.startsWith('/api/webhooks')
        ) {
          return true
        }

        // Protected routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
