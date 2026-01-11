/**
 * Security Headers Middleware
 * 
 * Implements comprehensive security headers to protect against common web vulnerabilities:
 * - Content Security Policy (CSP) - prevents XSS and injection attacks
 * - HTTP Strict Transport Security (HSTS) - enforces HTTPS
 * - X-Frame-Options - prevents clickjacking
 * - X-Content-Type-Options - prevents MIME type sniffing
 * - Referrer-Policy - controls referrer information
 * - Permissions-Policy - controls browser features
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Content Security Policy
  // Defines trusted sources for loading resources
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com", // Stripe requires inline scripts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Tailwind uses inline styles
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:", // Allow images from HTTPS and data URLs
    "connect-src 'self' https://api.stripe.com https://api.openai.com https://*.openai.azure.com", // API connections
    "frame-src 'self' https://js.stripe.com", // Stripe checkout frames
    "object-src 'none'", // Block plugins
    "base-uri 'self'", // Prevent base tag injection
    "form-action 'self'", // Prevent form submission to external sites
    "frame-ancestors 'none'", // Prevent embedding (use X-Frame-Options as fallback)
    isDevelopment ? "upgrade-insecure-requests" : "", // Upgrade HTTP to HTTPS in dev
  ].filter(Boolean).join('; ')
  
  response.headers.set('Content-Security-Policy', cspDirectives)
  
  // HTTP Strict Transport Security (HSTS)
  // Force HTTPS for all future requests (only in production)
  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // X-Frame-Options
  // Prevent the page from being embedded in iframes (clickjacking protection)
  response.headers.set('X-Frame-Options', 'DENY')
  
  // X-Content-Type-Options
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // X-XSS-Protection
  // Enable browser's XSS filter (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer-Policy
  // Control how much referrer information is sent
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions-Policy (formerly Feature-Policy)
  // Disable potentially dangerous browser features
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC tracking
    'payment=(self)', // Only allow payment APIs on same origin
  ].join(', ')
  response.headers.set('Permissions-Policy', permissionsPolicy)
  
  // Remove X-Powered-By header (information disclosure)
  response.headers.delete('X-Powered-By')
  
  // Add custom security header to identify secure responses
  response.headers.set('X-Security-Headers', 'enabled')
  
  return response
}

/**
 * Apply CORS headers for API routes
 */
export function applyCorsHeaders(
  response: NextResponse,
  request: NextRequest,
  allowedOrigins?: string[]
): NextResponse {
  const origin = request.headers.get('origin')
  
  // In production, only allow specific origins
  const isProduction = process.env.NODE_ENV === 'production'
  const defaultAllowedOrigins = isProduction
    ? [process.env.NEXTAUTH_URL || '']
    : ['http://localhost:3000', 'http://127.0.0.1:3000']
  
  const origins = allowedOrigins || defaultAllowedOrigins
  
  if (origin && origins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  )
  response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
  
  return response
}

/**
 * Handle preflight requests
 */
export function handlePreflightRequest(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    return applyCorsHeaders(response, request)
  }
  return null
}

/**
 * Security headers for API routes
 */
export function withSecurityHeaders(
  handler: (request: Request) => Promise<NextResponse>
) {
  return async (request: Request) => {
    const nextRequest = request as NextRequest
    
    // Handle preflight
    const preflightResponse = handlePreflightRequest(nextRequest)
    if (preflightResponse) {
      return preflightResponse
    }
    
    // Execute handler
    const response = await handler(request)
    
    // Apply security headers
    return applySecurityHeaders(response, nextRequest)
  }
}
