/**
 * Environment Variable Validation
 * 
 * This file validates all required environment variables at startup
 * to prevent runtime failures due to missing configuration.
 */

import { z } from 'zod'

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // NextAuth
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security')
    .refine(
      (val: string) => val !== 'your-secret-key-change-in-production',
      'NEXTAUTH_SECRET must be changed from default value in production'
    ),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // OAuth Providers (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // OpenAI (at least one required)
  OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),
  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_', 'STRIPE_PUBLISHABLE_KEY must start with pk_'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),
  STRIPE_PRICE_MONTHLY: z
    .string()
    .startsWith('price_', 'STRIPE_PRICE_MONTHLY must be a valid Stripe price ID'),
  STRIPE_PRICE_YEARLY: z
    .string()
    .startsWith('price_', 'STRIPE_PRICE_YEARLY must be a valid Stripe price ID'),

  // Email (SMTP)
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP_PORT must be a number'),
  SMTP_USER: z.string().email('SMTP_USER must be a valid email'),
  SMTP_PASSWORD: z.string().min(1, 'SMTP_PASSWORD is required'),
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email'),
})
  // Custom refinement: at least one OpenAI provider must be configured
  .refine(
    (data: any) => data.OPENAI_API_KEY || data.AZURE_OPENAI_API_KEY,
    {
      message: 'Either OPENAI_API_KEY or AZURE_OPENAI_API_KEY must be provided',
      path: ['OPENAI_API_KEY'],
    }
  )
  // If Azure OpenAI is used, all Azure fields are required
  .refine(
    (data: any) => {
      if (data.AZURE_OPENAI_API_KEY) {
        return data.AZURE_OPENAI_ENDPOINT && data.AZURE_OPENAI_DEPLOYMENT
      }
      return true
    },
    {
      message: 'AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT are required when using Azure OpenAI',
      path: ['AZURE_OPENAI_ENDPOINT'],
    }
  )

export type Env = z.infer<typeof envSchema>

/**
 * Validates environment variables and throws detailed errors if validation fails.
 * Call this at app startup (e.g., in instrumentation.ts or at the top of your server entry point).
 */
export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env)
    
    // Additional production-specific checks
    if (env.NODE_ENV === 'production') {
      if (env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
        console.warn('⚠️  WARNING: Using Stripe test keys in production!')
      }
      
      if (env.NEXTAUTH_URL.includes('localhost')) {
        throw new Error('NEXTAUTH_URL cannot point to localhost in production')
      }
    }
    
    console.log('✅ Environment variables validated successfully')
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:')
      console.error('\nMissing or invalid environment variables:')
      
      error.errors.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      
      console.error('\n📋 Please check your .env file and ensure all required variables are set.')
      console.error('See .env.example for reference.\n')
      
      process.exit(1)
    }
    throw error
  }
}

/**
 * Type-safe environment variable access.
 * Use this instead of process.env for type safety.
 */
export const env = validateEnv()
