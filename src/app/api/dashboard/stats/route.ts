import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get connected platforms
    const socialAccounts = await prisma.socialAccount.findMany({
      where: { userId: session.user.id, isActive: true },
    })

    const platformStats: {
      tiktok?: { connected: boolean; views: number; likes: number; comments: number; followers: number }
      instagram?: { connected: boolean; views: number; likes: number; comments: number; followers: number }
    } = {
      tiktok: undefined,
      instagram: undefined,
    }

    // Aggregate stats per platform
    for (const account of socialAccounts) {
      const publications = await prisma.publication.findMany({
        where: {
          socialAccountId: account.id,
          status: 'published',
        },
      })

      const stats = publications.reduce(
        (acc, pub) => ({
          views: acc.views + pub.views,
          likes: acc.likes + pub.likes,
          comments: acc.comments + pub.comments,
        }),
        { views: 0, likes: 0, comments: 0 }
      )

      // Get follower count from account metadata
      const followers = (account.metadata as any)?.followerCount || 0

      if (account.platform === 'tiktok') {
        platformStats.tiktok = {
          connected: true,
          ...stats,
          followers,
        }
      } else if (account.platform === 'instagram') {
        platformStats.instagram = {
          connected: true,
          ...stats,
          followers,
        }
      }
    }

    // Set connected: false for unconnected platforms
    if (!platformStats.tiktok) {
      platformStats.tiktok = { connected: false, views: 0, likes: 0, comments: 0, followers: 0 }
    }
    if (!platformStats.instagram) {
      platformStats.instagram = { connected: false, views: 0, likes: 0, comments: 0, followers: 0 }
    }

    // Get total stats
    const allPublications = await prisma.publication.findMany({
      where: {
        socialAccount: {
          userId: session.user.id,
        },
        status: 'published',
      },
      include: {
        content: true,
      },
      orderBy: {
        views: 'desc',
      },
    })

    const totalStats = allPublications.reduce(
      (acc, pub) => ({
        views: acc.views + pub.views,
        likes: acc.likes + pub.likes,
        comments: acc.comments + pub.comments,
      }),
      { views: 0, likes: 0, comments: 0 }
    )

    const totalFollowers = 
      (platformStats.tiktok?.followers || 0) + 
      (platformStats.instagram?.followers || 0)

    const engagementRate = totalStats.views > 0
      ? ((totalStats.likes + totalStats.comments) / totalStats.views) * 100
      : 0

    // Get top performing content (top 5)
    const topContent = allPublications.slice(0, 5).map((pub) => ({
      id: pub.contentId,
      output: pub.content.output.substring(0, 100),
      views: pub.views,
      likes: pub.likes,
      platform: pub.platform,
    }))

    return NextResponse.json({
      stats: {
        totalViews: totalStats.views,
        totalLikes: totalStats.likes,
        totalComments: totalStats.comments,
        totalFollowers,
        engagementRate,
        contentCount: allPublications.length,
        platformStats,
        topContent,
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
