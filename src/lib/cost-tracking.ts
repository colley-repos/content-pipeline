/**
 * Cost tracking and profitability analysis
 * Ensures we don't lose money on AI operations
 */

// OpenAI pricing (as of Jan 2026 - update these if pricing changes)
// Using GPT-4 pricing as baseline
const OPENAI_PRICING = {
  gpt4: {
    input: 0.03 / 1000, // $0.03 per 1K input tokens
    output: 0.06 / 1000, // $0.06 per 1K output tokens
  },
  gpt4_turbo: {
    input: 0.01 / 1000, // $0.01 per 1K input tokens
    output: 0.03 / 1000, // $0.03 per 1K output tokens
  },
  gpt35_turbo: {
    input: 0.0005 / 1000, // $0.0005 per 1K input tokens
    output: 0.0015 / 1000, // $0.0015 per 1K output tokens
  },
} as const

// Plan revenue per month
export const PLAN_REVENUE = {
  creator: 29, // $29/month
  pro_creator: 24.17, // $290/year = $24.17/month
} as const

// Target profit margins
export const PROFIT_TARGETS = {
  minimum: 60, // 60% minimum profit margin
  target: 75, // 75% target profit margin
  warning: 50, // Warn if below 50%
} as const

/**
 * Calculate cost for a generation based on tokens used
 */
export function calculateGenerationCost(
  inputTokens: number,
  outputTokens: number,
  model: 'gpt4' | 'gpt4_turbo' | 'gpt35_turbo' = 'gpt4_turbo'
): number {
  const pricing = OPENAI_PRICING[model]
  const inputCost = inputTokens * pricing.input
  const outputCost = outputTokens * pricing.output
  return inputCost + outputCost
}

/**
 * Estimate tokens from text (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Calculate profitability metrics for a time period
 */
export interface ProfitabilityMetrics {
  totalRevenue: number
  totalCost: number
  netProfit: number
  profitMargin: number
  averageCostPerGeneration: number
  averageRevenuePerUser: number
  breakEvenGenerationsPerUser: number
  status: 'healthy' | 'warning' | 'critical'
  message: string
}

export function calculateProfitability(
  totalRevenue: number,
  totalCost: number,
  totalGenerations: number,
  activeUsers: number
): ProfitabilityMetrics {
  const netProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
  const averageCostPerGeneration =
    totalGenerations > 0 ? totalCost / totalGenerations : 0
  const averageRevenuePerUser = activeUsers > 0 ? totalRevenue / activeUsers : 0

  // Calculate how many generations we can afford per user at current cost
  const breakEvenGenerationsPerUser =
    averageCostPerGeneration > 0
      ? Math.floor(averageRevenuePerUser / averageCostPerGeneration)
      : Infinity

  // Determine health status
  let status: 'healthy' | 'warning' | 'critical'
  let message: string

  if (profitMargin >= PROFIT_TARGETS.target) {
    status = 'healthy'
    message = `Profit margin is ${profitMargin.toFixed(1)}% - above target of ${PROFIT_TARGETS.target}%`
  } else if (profitMargin >= PROFIT_TARGETS.warning) {
    status = 'warning'
    message = `Profit margin is ${profitMargin.toFixed(1)}% - below target but acceptable`
  } else {
    status = 'critical'
    message = `Profit margin is ${profitMargin.toFixed(1)}% - CRITICAL! Below ${PROFIT_TARGETS.warning}% threshold`
  }

  return {
    totalRevenue,
    totalCost,
    netProfit,
    profitMargin,
    averageCostPerGeneration,
    averageRevenuePerUser,
    breakEvenGenerationsPerUser,
    status,
    message,
  }
}

/**
 * Calculate expected monthly revenue from active subscriptions
 */
export function calculateMonthlyRevenue(subscriptions: {
  plan: string
  count: number
}[]): number {
  return subscriptions.reduce((total, sub) => {
    const revenue =
      PLAN_REVENUE[sub.plan as keyof typeof PLAN_REVENUE] || 0
    return total + revenue * sub.count
  }, 0)
}

/**
 * Estimate safe generation limits per user based on costs
 */
export function calculateSafeGenerationLimits(
  averageCostPerGeneration: number,
  targetMargin: number = PROFIT_TARGETS.target
): {
  creator: number
  pro_creator: number
} {
  const marginMultiplier = (100 - targetMargin) / 100

  return {
    creator: Math.floor(
      (PLAN_REVENUE.creator * marginMultiplier) / averageCostPerGeneration
    ),
    pro_creator: Math.floor(
      (PLAN_REVENUE.pro_creator * marginMultiplier) / averageCostPerGeneration
    ),
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Check if costs are approaching dangerous levels
 */
export function shouldAlert(metrics: ProfitabilityMetrics): {
  alert: boolean
  severity: 'info' | 'warning' | 'critical'
  reasons: string[]
} {
  const reasons: string[] = []
  let severity: 'info' | 'warning' | 'critical' = 'info'

  if (metrics.status === 'critical') {
    severity = 'critical'
    reasons.push(
      `Profit margin (${formatPercentage(metrics.profitMargin)}) is critically low`
    )
  } else if (metrics.status === 'warning') {
    severity = 'warning'
    reasons.push(
      `Profit margin (${formatPercentage(metrics.profitMargin)}) is below target`
    )
  }

  if (metrics.netProfit < 0) {
    severity = 'critical'
    reasons.push(`LOSING MONEY: Net profit is ${formatCurrency(metrics.netProfit)}`)
  }

  if (metrics.breakEvenGenerationsPerUser < 50) {
    if (severity === 'info') severity = 'warning'
    reasons.push(
      `Users can only generate ${metrics.breakEvenGenerationsPerUser} pieces before we lose money`
    )
  }

  return {
    alert: reasons.length > 0,
    severity,
    reasons,
  }
}
