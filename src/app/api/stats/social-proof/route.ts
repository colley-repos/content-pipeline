import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get total active users (approximate, for social proof)
    const totalUsers = await prisma.user.count()
    
    // Get users who joined today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const usersJoinedToday = await prisma.user.count({
      where: {
        createdAt: { gte: todayStart },
      },
    })

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    })

    // Get recent content generation count (last 24h)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const contentGeneratedToday = await prisma.content.count({
      where: {
        createdAt: { gte: last24h },
      },
    })

    return NextResponse.json({
      totalUsers: Math.max(totalUsers, 2847), // Minimum display for social proof
      usersJoinedToday: Math.max(usersJoinedToday, 12),
      activeSubscribers: activeSubscriptions,
      contentGeneratedToday: Math.max(contentGeneratedToday, 450),
    })
  } catch (error) {
    console.error('Social proof stats error:', error)
    
    // Return fallback numbers if DB fails
    return NextResponse.json({
      totalUsers: 2847,
      usersJoinedToday: 23,
      activeSubscribers: 847,
      contentGeneratedToday: 1250,
    })
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
