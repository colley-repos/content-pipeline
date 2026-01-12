import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'all' // all, ready, published

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build query based on filter
    const whereClause: any = {
      userId: user.id,
    }

    // Query content with publications
    const content = await prisma.content.findMany({
      where: whereClause,
      include: {
        publications: {
          include: {
            socialAccount: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filter based on publication status
    let filteredContent = content
    if (filter === 'ready') {
      // Content that hasn't been published yet
      filteredContent = content.filter(c => c.publications.length === 0)
    } else if (filter === 'published') {
      // Content that has at least one publication
      filteredContent = content.filter(c => c.publications.length > 0)
    }

    // Format response
    const formattedContent = filteredContent.map(c => {
      // Aggregate engagement metrics across all platforms
      const totalViews = c.publications.reduce((sum, p) => sum + (p.views || 0), 0)
      const totalLikes = c.publications.reduce((sum, p) => sum + (p.likes || 0), 0)
      const totalComments = c.publications.reduce((sum, p) => sum + (p.comments || 0), 0)
      const totalShares = c.publications.reduce((sum, p) => sum + (p.shares || 0), 0)

      // Platform-specific data
      const tiktokPub = c.publications.find(p => p.platform === 'tiktok')
      const instagramPub = c.publications.find(p => p.platform === 'instagram')

      return {
        id: c.id,
        type: c.type,
        prompt: c.prompt,
        output: c.output,
        createdAt: c.createdAt,
        estimatedSeconds: c.computeSeconds || 0,
        published: c.publications.length > 0,
        totalEngagement: {
          views: totalViews,
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
        },
        platforms: {
          tiktok: tiktokPub ? {
            published: true,
            postId: tiktokPub.platformPostId,
            views: tiktokPub.views || 0,
            likes: tiktokPub.likes || 0,
            comments: tiktokPub.comments || 0,
            shares: tiktokPub.shares || 0,
            status: tiktokPub.status,
            publishedAt: tiktokPub.publishedAt,
          } : null,
          instagram: instagramPub ? {
            published: true,
            postId: instagramPub.platformPostId,
            views: instagramPub.views || 0,
            likes: instagramPub.likes || 0,
            comments: instagramPub.comments || 0,
            shares: instagramPub.shares || 0,
            status: instagramPub.status,
            publishedAt: instagramPub.publishedAt,
          } : null,
        },
      }
    })

    return NextResponse.json({
      content: formattedContent,
    })
  } catch (error) {
    console.error('Content library error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content library' },
      { status: 500 }
    )
  }
}
