import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface PublishRequest {
  contentId: string
  platforms: ('tiktok' | 'instagram')[]
  caption: string
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: PublishRequest = await req.json()
    const { contentId, platforms, caption } = body

    if (!contentId || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

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

    // Get content
    const content = await prisma.content.findUnique({
      where: { id: contentId },
    })

    if (!content || content.userId !== user.id) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // For now, using output as video URL (this will be updated when video generation is integrated)
    const videoUrl = content.output

    // Get social accounts for requested platforms
    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        userId: user.id,
        platform: {
          in: platforms,
        },
        isActive: true,
      },
    })

    const results: any[] = []

    // Publish to each platform
    for (const platform of platforms) {
      const account = socialAccounts.find(a => a.platform === platform)

      if (!account) {
        results.push({
          platform,
          success: false,
          error: 'Account not connected',
        })
        continue
      }

      try {
        let platformPostId: string | null = null

        if (platform === 'tiktok') {
          platformPostId = await publishToTikTok(
            videoUrl,
            caption,
            account.accessToken
          )
        } else if (platform === 'instagram') {
          platformPostId = await publishToInstagram(
            videoUrl,
            caption,
            account.accessToken,
            account.platformUserId
          )
        }

        if (platformPostId) {
          // Create publication record
          await prisma.publication.create({
            data: {
              contentId: content.id,
              socialAccountId: account.id,
              platform: platform,
              platformPostId: platformPostId,
              caption: caption,
              status: 'published',
              publishedAt: new Date(),
            },
          })

          results.push({
            platform,
            success: true,
            postId: platformPostId,
          })
        } else {
          results.push({
            platform,
            success: false,
            error: 'Failed to get post ID',
          })
        }
      } catch (error: any) {
        console.error(`Error publishing to ${platform}:`, error)
        
        // Still create a publication record with failed status
        await prisma.publication.create({
          data: {
            contentId: content.id,
            socialAccountId: account.id,
            platform: platform,
            caption: caption,
            status: 'failed',
            publishedAt: new Date(),
          },
        })

        results.push({
          platform,
          success: false,
          error: error.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      results,
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { error: 'Failed to publish content' },
      { status: 500 }
    )
  }
}

async function publishToTikTok(
  videoUrl: string,
  caption: string,
  accessToken: string
): Promise<string | null> {
  // TikTok Content Posting API
  // https://developers.tiktok.com/doc/content-posting-api-get-started
  
  // Step 1: Initialize video upload
  const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: caption,
        privacy_level: 'SELF_ONLY', // Start with private, users can change on TikTok
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl,
      },
    }),
  })

  if (!initResponse.ok) {
    const errorData = await initResponse.json()
    console.error('TikTok video init failed:', errorData)
    throw new Error(`TikTok API error: ${errorData.error?.message || 'Unknown error'}`)
  }

  const initData = await initResponse.json()
  const { publish_id } = initData.data

  if (!publish_id) {
    throw new Error('No publish_id returned from TikTok')
  }

  // The publish_id is the post identifier
  // You can use this to check status later if needed
  return publish_id
}

async function publishToInstagram(
  videoUrl: string,
  caption: string,
  accessToken: string,
  instagramAccountId: string
): Promise<string | null> {
  // Instagram Graph API - Create Media Container for Reels
  // https://developers.facebook.com/docs/instagram-api/guides/content-publishing
  
  // Step 1: Create media container
  const containerUrl = new URL(`https://graph.facebook.com/v18.0/${instagramAccountId}/media`)
  containerUrl.searchParams.set('media_type', 'REELS')
  containerUrl.searchParams.set('video_url', videoUrl)
  containerUrl.searchParams.set('caption', caption)
  containerUrl.searchParams.set('access_token', accessToken)

  const containerResponse = await fetch(containerUrl.toString(), {
    method: 'POST',
  })

  if (!containerResponse.ok) {
    const errorData = await containerResponse.json()
    console.error('Instagram container creation failed:', errorData)
    throw new Error(`Instagram API error: ${errorData.error?.message || 'Unknown error'}`)
  }

  const containerData = await containerResponse.json()
  const { id: containerId } = containerData

  if (!containerId) {
    throw new Error('No container ID returned from Instagram')
  }

  // Step 2: Publish the media container
  const publishUrl = new URL(`https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`)
  publishUrl.searchParams.set('creation_id', containerId)
  publishUrl.searchParams.set('access_token', accessToken)

  const publishResponse = await fetch(publishUrl.toString(), {
    method: 'POST',
  })

  if (!publishResponse.ok) {
    const errorData = await publishResponse.json()
    console.error('Instagram publish failed:', errorData)
    throw new Error(`Instagram API error: ${errorData.error?.message || 'Unknown error'}`)
  }

  const publishData = await publishResponse.json()
  const { id: mediaId } = publishData

  if (!mediaId) {
    throw new Error('No media ID returned from Instagram')
  }

  return mediaId
}
