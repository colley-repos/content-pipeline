/**
 * Cost Analysis Service
 * Runs nightly to analyze profitability and generate reports
 */

import { prisma } from './prisma'
import {
  calculateProfitability,
  calculateMonthlyRevenue,
  calculateSafeGenerationLimits,
  shouldAlert,
  formatCurrency,
  formatPercentage,
} from './cost-tracking'

/**
 * Run cost analysis for a specific date range
 */
export async function runCostAnalysis(
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean
  report?: any
  error?: string
}> {
  try {
    // Get all content generated in the period
    const content = await prisma.content.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        costUsd: true,
        userId: true,
        user: {
          select: {
            subscription: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    })

    // Calculate total costs
    const totalCost = content.reduce((sum, c) => sum + c.costUsd, 0)
    const totalGenerations = content.length

    // Count free vs paid generations
    const freeGenerations = content.filter(
      (c) => c.user.subscription?.status !== 'ACTIVE'
    ).length
    const paidGenerations = totalGenerations - freeGenerations

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodStart: { lte: endDate },
        currentPeriodEnd: { gte: startDate },
      },
      select: {
        plan: true,
      },
    })

    // Calculate revenue based on active subscriptions
    const planCounts = activeSubscriptions.reduce(
      (acc, sub) => {
        const plan = sub.plan || 'creator'
        acc[plan] = (acc[plan] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const subscriptionGroups = Object.entries(planCounts).map(
      ([plan, count]) => ({
        plan,
        count,
      })
    )

    const totalRevenue = calculateMonthlyRevenue(subscriptionGroups)

    // Calculate profitability metrics
    const metrics = calculateProfitability(
      totalRevenue,
      totalCost,
      totalGenerations,
      activeSubscriptions.length
    )

    // Check if we should alert
    const alertInfo = shouldAlert(metrics)

    // Calculate safe limits
    const safeLimits =
      metrics.averageCostPerGeneration > 0
        ? calculateSafeGenerationLimits(metrics.averageCostPerGeneration)
        : null

    // Create cost report
    const report = await prisma.costReport.create({
      data: {
        reportDate: startDate,
        totalRevenue,
        totalCost,
        netProfit: metrics.netProfit,
        profitMargin: metrics.profitMargin,
        totalGenerations,
        averageCostPerGen: metrics.averageCostPerGeneration,
        activeSubscriptions: activeSubscriptions.length,
        freeGenerations,
        metadata: {
          status: metrics.status,
          message: metrics.message,
          paidGenerations,
          averageRevenuePerUser: metrics.averageRevenuePerUser,
          breakEvenGenerationsPerUser: metrics.breakEvenGenerationsPerUser,
          alert: alertInfo.alert,
          alertSeverity: alertInfo.severity,
          alertReasons: alertInfo.reasons,
          safeLimits,
          planBreakdown: planCounts,
        },
      },
    })

    // Log to system for tracking
    await prisma.systemLog.create({
      data: {
        level: alertInfo.severity === 'critical' ? 'ERROR' : alertInfo.severity === 'warning' ? 'WARNING' : 'INFO',
        message: `Cost Analysis: ${metrics.message}`,
        metadata: {
          reportId: report.id,
          totalRevenue: formatCurrency(totalRevenue),
          totalCost: formatCurrency(totalCost),
          netProfit: formatCurrency(metrics.netProfit),
          profitMargin: formatPercentage(metrics.profitMargin),
          alert: alertInfo.alert,
          alertReasons: alertInfo.reasons,
        },
      },
    })

    return {
      success: true,
      report: {
        ...report,
        metrics,
        alert: alertInfo,
        safeLimits,
      },
    }
  } catch (error) {
    console.error('Cost analysis error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Run daily cost analysis (for yesterday)
 */
export async function runDailyCostAnalysis(): Promise<{
  success: boolean
  report?: any
  error?: string
}> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const endOfYesterday = new Date(yesterday)
  endOfYesterday.setHours(23, 59, 59, 999)

  return runCostAnalysis(yesterday, endOfYesterday)
}

/**
 * Get the latest cost report
 */
export async function getLatestCostReport() {
  return prisma.costReport.findFirst({
    orderBy: { reportDate: 'desc' },
  })
}

/**
 * Get cost trends over time
 */
export async function getCostTrends(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return prisma.costReport.findMany({
    where: {
      reportDate: { gte: startDate },
    },
    orderBy: { reportDate: 'asc' },
  })
}
