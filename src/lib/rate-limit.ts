/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting to prevent:
 * - Brute force attacks on authentication endpoints
 * - API abuse and DDoS attacks
 * - Excessive content generation requests
 * 
 * Uses in-memory storage with optional Redis support for distributed deployments.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory storage (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Clean up expired entries periodically to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

/**
 * Generate a unique key for rate limiting based on IP and endpoint
 */
function getRateLimitKey(request: NextRequest, identifier: string): string {
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  
  return `${identifier}:${ip}`
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  identifier: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; resetTime: number } {
  const key = getRateLimitKey(request, identifier)
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  // Create or reset entry if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
  }
  
  // Increment request count
  entry.count++
  
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const limited = entry.count > config.maxRequests
  
  return {
    limited,
    remaining,
    resetTime: entry.resetTime,
  }
}

/**
 * Create a rate limit response with proper headers
 */
export function createRateLimitResponse(
  remaining: number,
  resetTime: number,
  message?: string
): NextResponse {
  const response = NextResponse.json(
    {
      error: message || 'Too many requests, please try again later',
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    },
    { status: 429 }
  )
  
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())
  response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString())
  
  return response
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits to prevent brute force
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  
  AUTH_REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour per IP
    message: 'Too many registration attempts. Please try again later.',
  },
  
  // Content generation - prevent API abuse
  CONTENT_GENERATE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 generations per minute for paid users
    message: 'Rate limit exceeded. Please slow down your requests.',
  },
  
  CONTENT_GENERATE_FREE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 2, // 2 generations per minute for free users
    message: 'Rate limit exceeded for free tier. Please upgrade or wait.',
  },
  
  // API endpoints - general protection
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'Too many requests. Please slow down.',
  },
  
  // Stripe webhooks - allow high volume but with reasonable limits
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 webhooks per minute
    message: 'Webhook rate limit exceeded.',
  },
} as const

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  identifier: string,
  config: RateLimitConfig
) {
  return async (request: Request) => {
    const nextRequest = request as NextRequest
    const { limited, remaining, resetTime } = checkRateLimit(
      nextRequest,
      identifier,
      config
    )
    
    if (limited) {
      return createRateLimitResponse(remaining, resetTime, config.message)
    }
    
    const response = await handler(request)
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())
    
    return response
  }
}

/**
 * User-based rate limiting (for authenticated requests)
 */
export function checkUserRateLimit(
  userId: string,
  identifier: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; resetTime: number } {
  const key = `user:${userId}:${identifier}`
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
  }
  
  entry.count++
  
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const limited = entry.count > config.maxRequests
  
  return {
    limited,
    remaining,
    resetTime: entry.resetTime,
  }
}
