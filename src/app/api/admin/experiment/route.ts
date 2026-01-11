import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Free credits experiment metrics
    const totalUsers = await prisma.user.count()
    
    const usersWithCreditsUsed = await prisma.user.count({
      where: { freeCreditsRemaining: { lt: 3 } },
    })

    const usersWhoUsedAllCredits = await prisma.user.count({
      where: { freeCreditsRemaining: 0 },
    })

    const recentGenerations = await prisma.analytics.findMany({
      where: {
        event: 'CONTENT_GENERATED',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const freeCreditsUsed = recentGenerations.filter(
      (g) => g.metadata && typeof g.metadata === 'object' && 'usedFreeCredit' in g.metadata && g.metadata.usedFreeCredit === true
    ).length

    const usersWhoConvertedAfterFreeTrial = await prisma.user.count({
      where: {
        freeCreditsRemaining: { lte: 0 },
        subscription: {
          status: 'ACTIVE',
        },
      },
    })

    // Modal-related metrics
    const modalViewsLast24h = await prisma.analytics.count({
      where: {
        event: 'UPGRADE_MODAL_VIEWED',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })

    const modalConversionsLast24h = await prisma.analytics.count({
      where: {
        event: 'UPGRADE_FROM_MODAL',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })

    return NextResponse.json({
      experiment: 'free_credits_v1',
      metrics: {
        totalUsers,
        usersWithCreditsUsed,
        usersWhoUsedAllCredits,
        creditsUsageRate: ((usersWithCreditsUsed / totalUsers) * 100).toFixed(1) + '%',
        freeGenerationsLast24h: freeCreditsUsed,
        conversionsAfterFreeTrial: usersWhoConvertedAfterFreeTrial,
        conversionRate: usersWhoUsedAllCredits > 0 
          ? ((usersWhoConvertedAfterFreeTrial / usersWhoUsedAllCredits) * 100).toFixed(1) + '%'
          : '0%',
        modalViewsLast24h,
        modalConversionsLast24h,
        modalConversionRate: modalViewsLast24h > 0
          ? ((modalConversionsLast24h / modalViewsLast24h) * 100).toFixed(1) + '%'
          : '0%',
      },
      recentActivity: recentGenerations.slice(0, 10),
    })
  } catch (error) {
    console.error('Experiment metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch experiment metrics' },
      { status: 500 }
    )
  }
}
