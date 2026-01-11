/**
 * Audit Logging Middleware
 * 
 * Tracks all API requests for security auditing and compliance:
 * - User ID and session info
 * - Endpoint and method
 * - IP address and user agent
 * - Response status
 * - Timestamp
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from './prisma'

export interface AuditLogEntry {
  userId?: string
  endpoint: string
  method: string
  statusCode: number
  ip?: string
  userAgent?: string
  requestBody?: any
  responseTime: number
  error?: string
}

/**
 * Log API request to database
 */
export async function logApiRequest(entry: AuditLogEntry): Promise<void> {
  try {
    // Only log to database in production or for sensitive endpoints
    const isProduction = process.env.NODE_ENV === 'production'
    const isSensitiveEndpoint = [
      '/api/auth',
      '/api/subscription',
      '/api/webhooks',
      '/api/admin',
    ].some((path) => entry.endpoint.startsWith(path))

    if (isProduction || isSensitiveEndpoint) {
      await prisma.systemLog.create({
        data: {
          level: entry.error ? 'ERROR' : 'INFO',
          message: `${entry.method} ${entry.endpoint} - ${entry.statusCode}`,
          metadata: {
            userId: entry.userId,
            method: entry.method,
            endpoint: entry.endpoint,
            statusCode: entry.statusCode,
            ip: entry.ip,
            userAgent: entry.userAgent,
            responseTime: entry.responseTime,
            error: entry.error,
            timestamp: new Date().toISOString(),
          },
        },
      })
    }

    // Always log to console for development visibility
    if (!isProduction) {
      console.log('📊 API Request:', {
        userId: entry.userId || 'anonymous',
        method: entry.method,
        endpoint: entry.endpoint,
        status: entry.statusCode,
        responseTime: `${entry.responseTime}ms`,
      })
    }
  } catch (err) {
    // Don't throw - logging failures shouldn't break the app
    console.error('Failed to log API request:', err)
  }
}

/**
 * Extract user ID from request
 */
async function getUserId(request: Request): Promise<string | undefined> {
  try {
    const session = await getServerSession(authOptions)
    return session?.user?.id
  } catch {
    return undefined
  }
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    undefined
  )
}

/**
 * Middleware wrapper for audit logging
 */
export function withAuditLog(
  handler: (request: Request) => Promise<NextResponse>
) {
  return async (request: Request) => {
    const startTime = Date.now()
    const nextRequest = request as NextRequest
    const url = new URL(request.url)

    let userId: string | undefined
    let response: NextResponse
    let error: string | undefined

    try {
      // Get user ID if available
      if (url.pathname.startsWith('/api') && !url.pathname.includes('/auth')) {
        userId = await getUserId(request)
      }

      // Execute handler
      response = await handler(request)
    } catch (err) {
      // Log error and create error response
      error = err instanceof Error ? err.message : 'Unknown error'
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    const responseTime = Date.now() - startTime

    // Log the request
    await logApiRequest({
      userId,
      endpoint: url.pathname,
      method: request.method,
      statusCode: response.status,
      ip: getClientIp(nextRequest),
      userAgent: request.headers.get('user-agent') || undefined,
      responseTime,
      error,
    })

    return response
  }
}

/**
 * Log sensitive actions (for compliance and security auditing)
 */
export async function logSecurityEvent(
  event: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        level: 'WARN',
        message: `Security Event: ${event}`,
        metadata: {
          event,
          userId,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      },
    })

    console.warn('🔒 Security Event:', {
      event,
      userId: userId || 'anonymous',
      metadata,
    })
  } catch (err) {
    console.error('Failed to log security event:', err)
  }
}

/**
 * Track failed login attempts for security monitoring
 */
export async function logFailedLogin(
  email: string,
  ip?: string
): Promise<void> {
  await logSecurityEvent('FAILED_LOGIN', undefined, {
    email,
    ip,
  })
}

/**
 * Track suspicious activity
 */
export async function logSuspiciousActivity(
  reason: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logSecurityEvent('SUSPICIOUS_ACTIVITY', userId, {
    reason,
    ...metadata,
  })
}
