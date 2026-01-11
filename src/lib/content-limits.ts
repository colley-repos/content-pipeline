/**
 * Content usage tracking and limits
 * Converts abstract "content" into time-based limits users can understand
 */

// Plan limits in minutes per month
export const PLAN_LIMITS = {
  creator: 30, // 30 minutes/month - $29/mo
  pro_creator: 60, // 60 minutes/month - $290/yr ($24/mo)
} as const

export type PlanType = keyof typeof PLAN_LIMITS

/**
 * Estimate content duration in seconds based on type and word count
 * Used to track usage against monthly minute limits
 */
export function estimateContentDuration(
  contentType: string,
  wordCount: number
): number {
  // Average speaking/reading rates
  const WORDS_PER_SECOND = {
    social_post: 2.5, // Instagram caption - quick read
    caption: 2.5, // Similar to social post
    script: 2.0, // Video script - spoken word (120 WPM = 2 WPS)
    bio: 3.0, // Bio - very quick scan
    reply: 3.0, // Reply - quick read
    content_calendar: 1.5, // Calendar - more content, slower consumption
  } as const

  const rate =
    WORDS_PER_SECOND[contentType as keyof typeof WORDS_PER_SECOND] || 2.0

  // Minimum 30 seconds per piece (even short content takes time to use)
  const estimatedSeconds = Math.max(30, Math.ceil(wordCount / rate))

  return estimatedSeconds
}

/**
 * Count words in text (approximate)
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}

/**
 * Check if user has enough content minutes remaining
 */
export function hasContentMinutesRemaining(
  contentMinutesUsed: number,
  contentMinutesLimit: number,
  requiredSeconds: number
): boolean {
  const usedMinutes = contentMinutesUsed
  const requiredMinutes = Math.ceil(requiredSeconds / 60)

  return usedMinutes + requiredMinutes <= contentMinutesLimit
}

/**
 * Get plan details from Stripe price ID
 */
export function getPlanFromPriceId(priceId: string | null): {
  plan: PlanType
  limit: number
} {
  // Check environment variables for price IDs
  const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY
  const yearlyPriceId = process.env.STRIPE_PRICE_YEARLY

  if (priceId === monthlyPriceId) {
    return { plan: 'creator', limit: PLAN_LIMITS.creator }
  }

  if (priceId === yearlyPriceId) {
    return { plan: 'pro_creator', limit: PLAN_LIMITS.pro_creator }
  }

  // Default to creator plan if unknown
  return { plan: 'creator', limit: PLAN_LIMITS.creator }
}

/**
 * Format seconds into human-readable time
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`
  }

  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Format minutes remaining for user display
 */
export function formatMinutesRemaining(
  used: number,
  limit: number
): {
  remaining: number
  percentage: number
  display: string
} {
  const remaining = Math.max(0, limit - used)
  const percentage = limit > 0 ? Math.round((remaining / limit) * 100) : 0

  return {
    remaining,
    percentage,
    display: `${remaining} of ${limit} minutes`,
  }
}
