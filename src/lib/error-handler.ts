/**
 * Error Handling and Logging Utilities
 * 
 * Provides centralized error handling with:
 * - Generic error messages for production (no information disclosure)
 * - Detailed logging for debugging
 * - Structured error responses
 * - Integration with monitoring systems
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from './prisma'

export enum ErrorLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface ErrorContext {
  userId?: string
  endpoint?: string
  method?: string
  ip?: string
  userAgent?: string
  requestId?: string
  [key: string]: any
}

/**
 * Log error to database for auditing and monitoring
 */
export async function logError(
  level: ErrorLevel,
  message: string,
  metadata?: ErrorContext
): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        level,
        message,
        metadata: metadata || {},
      },
    })
  } catch (err) {
    // Fallback to console if database logging fails
    console.error('Failed to log error to database:', err)
    console.error('Original error:', { level, message, metadata })
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: Error | unknown,
  context?: ErrorContext
): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const errors = error.errors.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }))
    
    logError(ErrorLevel.WARN, 'Validation error', {
      ...context,
      validationErrors: errors,
    })
    
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: isProduction ? undefined : errors,
      },
      { status: 400 }
    )
  }
  
  // Handle known error types
  if (error instanceof Error) {
    const errorMessage = error.message
    
    // Determine error type and status code
    let status = 500
    let userMessage = 'An error occurred. Please try again.'
    
    // Authentication errors
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid credentials')) {
      status = 401
      userMessage = 'Authentication failed. Please check your credentials.'
    }
    
    // Authorization errors
    else if (errorMessage.includes('Forbidden') || errorMessage.includes('Access denied')) {
      status = 403
      userMessage = 'You do not have permission to perform this action.'
    }
    
    // Not found errors
    else if (errorMessage.includes('Not found')) {
      status = 404
      userMessage = 'The requested resource was not found.'
    }
    
    // Rate limit errors
    else if (errorMessage.includes('Rate limit')) {
      status = 429
      userMessage = 'Too many requests. Please slow down.'
    }
    
    // Log error with appropriate level
    const level = status >= 500 ? ErrorLevel.ERROR : ErrorLevel.WARN
    logError(level, errorMessage, {
      ...context,
      stack: error.stack,
      name: error.name,
    })
    
    return NextResponse.json(
      {
        error: userMessage,
        details: isProduction ? undefined : {
          message: errorMessage,
          stack: error.stack,
        },
      },
      { status }
    )
  }
  
  // Handle unknown errors
  logError(ErrorLevel.CRITICAL, 'Unknown error occurred', {
    ...context,
    error: String(error),
  })
  
  return NextResponse.json(
    {
      error: 'An unexpected error occurred. Please try again.',
    },
    { status: 500 }
  )
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler(
  handler: (request: Request) => Promise<NextResponse>,
  endpoint?: string
) {
  return async (request: Request) => {
    try {
      return await handler(request)
    } catch (error) {
      const context: ErrorContext = {
        endpoint,
        method: request.method,
        url: request.url,
      }
      
      return createErrorResponse(error, context)
    }
  }
}

/**
 * Sanitize error for client response (remove sensitive data)
 */
export function sanitizeError(error: Error): {
  message: string
  name?: string
} {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // List of sensitive patterns to redact
  const sensitivePatterns = [
    /password/gi,
    /secret/gi,
    /token/gi,
    /api[_-]?key/gi,
    /credential/gi,
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card patterns
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  ]
  
  let sanitizedMessage = error.message
  
  sensitivePatterns.forEach((pattern) => {
    sanitizedMessage = sanitizedMessage.replace(pattern, '[REDACTED]')
  })
  
  if (isProduction) {
    return {
      message: 'An error occurred',
    }
  }
  
  return {
    message: sanitizedMessage,
    name: error.name,
  }
}

/**
 * Get error context from request
 */
export function getErrorContext(request: Request): ErrorContext {
  const url = new URL(request.url)
  
  return {
    method: request.method,
    endpoint: url.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined,
    requestId: request.headers.get('x-request-id') || undefined,
  }
}
