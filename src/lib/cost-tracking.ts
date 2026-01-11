/**
 * Cost tracking and profitability analysis
 * Ensures we don't lose money on video generation operations
 */

// GPU Cloud Provider Pricing (per hour)
// Update these based on actual provider costs
// These are example rates for RTX 4090 / RTX 3090 class GPUs
export const GPU_PRICING = {
  // Cloud providers
  runpod_rtx4090: 0.69, // RunPod RTX 4090 ($/hour)
  vastai_rtx4090: 0.50, // Vast.ai RTX 4090 spot ($/hour)  
  lambda_rtx4090: 1.10, // Lambda Labs RTX 4090 ($/hour)
  paperspace_rtx4000: 0.76, // Paperspace RTX 4000 ($/hour)
  
  // Self-hosted estimates (electricity + depreciation)
  selfhosted_rtx3090: 0.15, // Self-hosted RTX 3090 ($/hour)
  selfhosted_rtx4090: 0.20, // Self-hosted RTX 4090 ($/hour)
  
  // Default fallback (average cloud GPU cost)
  default: 0.60, // $/hour
} as const

export type GPUProvider = keyof typeof GPU_PRICING

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
 * Calculate cost for a video generation based on GPU compute time
 * @param computeSeconds - GPU compute time in seconds
 * @param provider - GPU provider/instance type (default: 'default')
 * @param customRate - Optional custom hourly rate (overrides provider default)
 * @returns Cost in USD
 */
export function calculateGenerationCost(
  computeSeconds: number,
  provider: GPUProvider = 'default',
  customRate?: number
): number {
  const hourlyRate = customRate ?? GPU_PRICING[provider] ?? GPU_PRICING.default
  const hours = computeSeconds / 3600
  return hours * hourlyRate
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
