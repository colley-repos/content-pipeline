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

    // Get total users
    const totalUsers = await prisma.user.count()

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    })

    // Get total content generated
    const totalContent = await prisma.content.count()

    // Get revenue (simplified - in production, calculate from Stripe)
    const monthlyRevenue = activeSubscriptions * 29 // Approximate

    // Recent users
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
      },
    })

    // Popular content types
    const contentByType = await prisma.content.groupBy({
      by: ['type'],
      _count: true,
    })

    // Activity over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivity = await prisma.analytics.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      overview: {
        totalUsers,
        activeSubscriptions,
        totalContent,
        monthlyRevenue,
      },
      recentUsers,
      contentByType,
      recentActivity,
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
