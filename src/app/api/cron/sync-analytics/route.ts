import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Analytics Sync] Starting sync job...')

    // Get all active social accounts with publications
    const accounts = await prisma.socialAccount.findMany({
      where: {
        isActive: true,
      },
      include: {
        publications: {
          where: {
            status: 'published',
          },
        },
      },
    })

    let syncedCount = 0
    let errorCount = 0

    for (const account of accounts) {
      try {
        if (account.platform === 'tiktok') {
          await syncTikTokMetrics(account)
          syncedCount += account.publications.length
        } else if (account.platform === 'instagram') {
          await syncInstagramMetrics(account)
          syncedCount += account.publications.length
        }
      } catch (error) {
        console.error(`[Analytics Sync] Error syncing ${account.platform} account ${account.id}:`, error)
        errorCount++
      }
    }

    console.log(`[Analytics Sync] Completed. Synced: ${syncedCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      syncedCount,
      errorCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Analytics Sync] Fatal error:', error)
    return NextResponse.json(
      { error: 'Failed to sync analytics' },
      { status: 500 }
    )
  }
}

async function syncTikTokMetrics(account: any) {
  // TikTok Query Video List API
  // https://developers.tiktok.com/doc/query-video-list-api-get-started
  
  const response = await fetch('https://open.tiktokapis.com/v2/video/list/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${account.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      max_count: 20,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`TikTok API error: ${errorData.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const videos = data.data?.videos || []

  // Update publication records with latest metrics
  for (const video of videos) {
    const publication = account.publications.find(
      (p: any) => p.platformPostId === video.id
    )

    if (publication) {
      await prisma.publication.update({
        where: { id: publication.id },
        data: {
          views: video.view_count || 0,
          likes: video.like_count || 0,
          comments: video.comment_count || 0,
          shares: video.share_count || 0,
          lastSyncedAt: new Date(),
        },
      })
    }
  }
}

async function syncInstagramMetrics(account: any) {
  // Instagram Graph API - Media Insights
  // https://developers.facebook.com/docs/instagram-api/reference/ig-media/insights
  
  for (const publication of account.publications) {
    try {
      // Get media insights
      const insightsUrl = new URL(`https://graph.facebook.com/v18.0/${publication.platformPostId}/insights`)
      insightsUrl.searchParams.set('metric', 'impressions,reach,likes,comments,shares,saved')
      insightsUrl.searchParams.set('access_token', account.accessToken)

      const response = await fetch(insightsUrl.toString())

      if (!response.ok) {
        console.error(`[Analytics Sync] Instagram insights failed for post ${publication.platformPostId}`)
        continue
      }

      const data = await response.json()
      const insights = data.data || []

      // Extract metrics
      const impressions = insights.find((i: any) => i.name === 'impressions')?.values?.[0]?.value || 0
      const likes = insights.find((i: any) => i.name === 'likes')?.values?.[0]?.value || 0
      const comments = insights.find((i: any) => i.name === 'comments')?.values?.[0]?.value || 0
      const shares = insights.find((i: any) => i.name === 'shares')?.values?.[0]?.value || 0

      await prisma.publication.update({
        where: { id: publication.id },
        data: {
          views: impressions,
          likes: likes,
          comments: comments,
          shares: shares,
          lastSyncedAt: new Date(),
        },
      })
    } catch (error) {
      console.error(`[Analytics Sync] Error syncing Instagram post ${publication.platformPostId}:`, error)
    }
  }
}
