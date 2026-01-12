import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const TIKTOK_CLIENT_ID = process.env.TIKTOK_CLIENT_ID!
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!
const TIKTOK_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/social/callback/tiktok`

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=tiktok_auth_failed`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=missing_code`)
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=unauthorized`)
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=user_not_found`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_ID,
        client_secret: TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: TIKTOK_REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('TikTok token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in, open_id } = tokenData

    // Get user info from TikTok
    const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    let metadata: any = { openId: open_id }
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json()
      metadata = {
        ...metadata,
        username: userInfo.data?.user?.display_name,
        followerCount: userInfo.data?.user?.follower_count || 0,
      }
    }

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expires_in * 1000)

    // Save or update social account
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'tiktok',
        },
      },
      create: {
        userId: user.id,
        platform: 'tiktok',
        platformUserId: open_id,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: expiresAt,
        scopes: [],
        metadata: metadata,
        isActive: true,
      },
      update: {
        platformUserId: open_id,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: expiresAt,
        scopes: [],
        metadata: metadata,
        isActive: true,
      },
    })

    // Redirect back to dashboard
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?connected=tiktok`)
  } catch (error) {
    console.error('TikTok callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=tiktok_callback_failed`)
  }
}
