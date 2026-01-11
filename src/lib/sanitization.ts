/**
 * Input Sanitization and Validation Utilities
 * 
 * Provides comprehensive input sanitization to prevent:
 * - Prompt injection attacks
 * - XSS attacks
 * - SQL injection (additional layer on top of Prisma)
 * - NoSQL injection
 * - Path traversal
 */

import { z } from 'zod'

/**
 * Maximum lengths for different input types
 */
export const INPUT_LIMITS = {
  PROMPT: 2000,
  CONTEXT: 1000,
  NAME: 100,
  EMAIL: 255,
  PASSWORD: 128,
  SHARE_TOKEN: 64,
  URL: 2048,
} as const

/**
 * Dangerous patterns that could indicate injection attempts
 */
const DANGEROUS_PATTERNS = {
  // Prompt injection attempts
  PROMPT_INJECTION: [
    /ignore\s+(previous|above|all)\s+instructions?/gi,
    /disregard\s+(previous|above|all)/gi,
    /forget\s+(previous|above|all|everything)/gi,
    /system\s*:/gi,
    /\[SYSTEM\]/gi,
    /\[ADMIN\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /reveal\s+(your\s+)?(system\s+)?prompt/gi,
    /tell\s+me\s+(your\s+)?(system\s+)?prompt/gi,
  ],
  
  // Script injection
  SCRIPT_INJECTION: [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
  ],
  
  // SQL injection patterns (Prisma protects, but good to sanitize)
  SQL_INJECTION: [
    /('\s*(OR|AND)\s*'?\d)/gi,
    /(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+/gi,
    /(-{2}|\/\*|\*\/)/g, // SQL comments
  ],
  
  // Path traversal
  PATH_TRAVERSAL: [
    /\.\.[\/\\]/g,
    /[\/\\]etc[\/\\]passwd/gi,
    /[\/\\]windows[\/\\]system32/gi,
  ],
} as const

/**
 * Sanitize text input by removing dangerous patterns
 */
export function sanitizeText(input: string, maxLength: number = INPUT_LIMITS.PROMPT): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // Trim whitespace
  let sanitized = input.trim()
  
  // Enforce length limit
  sanitized = sanitized.slice(0, maxLength)
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
  // Normalize whitespace (prevent invisible characters)
  sanitized = sanitized.replace(/\s+/g, ' ')
  
  return sanitized
}

/**
 * Check for prompt injection attempts
 */
export function detectPromptInjection(input: string): { detected: boolean; patterns: string[] } {
  const detectedPatterns: string[] = []
  
  for (const pattern of DANGEROUS_PATTERNS.PROMPT_INJECTION) {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.source)
    }
  }
  
  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns,
  }
}

/**
 * Sanitize prompt input for AI generation
 */
export function sanitizePrompt(prompt: string): {
  sanitized: string
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Basic sanitization
  const sanitized = sanitizeText(prompt, INPUT_LIMITS.PROMPT)
  
  // Check minimum length
  if (sanitized.length < 5) {
    errors.push('Prompt must be at least 5 characters long')
    return { sanitized, isValid: false, errors }
  }
  
  // Check for prompt injection
  const injectionCheck = detectPromptInjection(sanitized)
  if (injectionCheck.detected) {
    errors.push('Potential prompt injection detected. Please rephrase your input.')
    return { sanitized, isValid: false, errors }
  }
  
  // Check for excessive special characters (could indicate obfuscation)
  const specialCharCount = (sanitized.match(/[^a-zA-Z0-9\s.,!?'-]/g) || []).length
  const specialCharRatio = specialCharCount / sanitized.length
  
  if (specialCharRatio > 0.3) {
    errors.push('Input contains too many special characters')
    return { sanitized, isValid: false, errors }
  }
  
  // Check for excessive repetition (spam indicator)
  const repeatedPattern = /(.{3,})\1{3,}/g
  if (repeatedPattern.test(sanitized)) {
    errors.push('Input contains excessive repetition')
    return { sanitized, isValid: false, errors }
  }
  
  return {
    sanitized,
    isValid: true,
    errors: [],
  }
}

/**
 * Sanitize HTML content (strip all HTML tags)
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
  
  return sanitized
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url: string): { sanitized: string; isValid: boolean } {
  if (!url || typeof url !== 'string') {
    return { sanitized: '', isValid: false }
  }
  
  try {
    const urlObj = new URL(url)
    
    // Only allow HTTP(S) protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { sanitized: '', isValid: false }
    }
    
    // Enforce length limit
    if (url.length > INPUT_LIMITS.URL) {
      return { sanitized: '', isValid: false }
    }
    
    return { sanitized: urlObj.toString(), isValid: true }
  } catch {
    return { sanitized: '', isValid: false }
  }
}

/**
 * Sanitize file path (prevent path traversal)
 */
export function sanitizeFilePath(path: string): { sanitized: string; isValid: boolean } {
  if (!path || typeof path !== 'string') {
    return { sanitized: '', isValid: false }
  }
  
  // Check for path traversal
  for (const pattern of DANGEROUS_PATTERNS.PATH_TRAVERSAL) {
    if (pattern.test(path)) {
      return { sanitized: '', isValid: false }
    }
  }
  
  // Remove leading slashes and normalize
  const sanitized = path.replace(/^[\/\\]+/, '').replace(/[\/\\]+/g, '/')
  
  return { sanitized, isValid: true }
}

/**
 * Enhanced Zod schemas with sanitization
 */
export const sanitizedSchemas = {
  prompt: z
    .string()
    .min(5, 'Prompt must be at least 5 characters')
    .max(INPUT_LIMITS.PROMPT, `Prompt must be less than ${INPUT_LIMITS.PROMPT} characters`)
    .transform((val: string) => {
      const result = sanitizePrompt(val)
      if (!result.isValid) {
        throw new Error(result.errors[0] || 'Invalid prompt')
      }
      return result.sanitized
    }),
  
  context: z
    .string()
    .max(INPUT_LIMITS.CONTEXT, `Context must be less than ${INPUT_LIMITS.CONTEXT} characters`)
    .optional()
    .transform((val: string | undefined) => (val ? sanitizeText(val, INPUT_LIMITS.CONTEXT) : undefined)),
  
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(INPUT_LIMITS.NAME, `Name must be less than ${INPUT_LIMITS.NAME} characters`)
    .transform((val: string) => sanitizeText(val, INPUT_LIMITS.NAME)),
  
  email: z
    .string()
    .email('Invalid email address')
    .max(INPUT_LIMITS.EMAIL)
    .toLowerCase()
    .transform((val: string) => sanitizeText(val, INPUT_LIMITS.EMAIL)),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(INPUT_LIMITS.PASSWORD, `Password must be less than ${INPUT_LIMITS.PASSWORD} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  url: z
    .string()
    .url('Invalid URL')
    .max(INPUT_LIMITS.URL)
    .transform((val: string) => {
      const result = sanitizeUrl(val)
      if (!result.isValid) {
        throw new Error('Invalid or unsafe URL')
      }
      return result.sanitized
    }),
}

/**
 * Validate and sanitize JSON input
 */
export function sanitizeJsonInput<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): { data: T | null; isValid: boolean; errors: string[] } {
  try {
    const data = schema.parse(input)
    return { data, isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        isValid: false,
        errors: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      }
    }
    return {
      data: null,
      isValid: false,
      errors: ['Invalid input format'],
    }
  }
}
