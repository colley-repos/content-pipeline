import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID!
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET!
const INSTAGRAM_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/social/callback/instagram`

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=instagram_auth_failed`)
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

    // Exchange code for short-lived access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    tokenUrl.searchParams.set('client_id', INSTAGRAM_CLIENT_ID)
    tokenUrl.searchParams.set('client_secret', INSTAGRAM_CLIENT_SECRET)
    tokenUrl.searchParams.set('redirect_uri', INSTAGRAM_REDIRECT_URI)
    tokenUrl.searchParams.set('code', code)

    const shortTokenResponse = await fetch(tokenUrl.toString())

    if (!shortTokenResponse.ok) {
      const errorData = await shortTokenResponse.json()
      console.error('Instagram token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=token_exchange_failed`)
    }

    const shortTokenData = await shortTokenResponse.json()
    const { access_token: shortLivedToken } = shortTokenData

    // Exchange short-lived token for long-lived token (60 days)
    const longTokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token')
    longTokenUrl.searchParams.set('client_id', INSTAGRAM_CLIENT_ID)
    longTokenUrl.searchParams.set('client_secret', INSTAGRAM_CLIENT_SECRET)
    longTokenUrl.searchParams.set('fb_exchange_token', shortLivedToken)

    const longTokenResponse = await fetch(longTokenUrl.toString())

    if (!longTokenResponse.ok) {
      const errorData = await longTokenResponse.json()
      console.error('Instagram long-lived token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=long_token_exchange_failed`)
    }

    const longTokenData = await longTokenResponse.json()
    const { access_token, expires_in } = longTokenData

    // Get Instagram Business Account ID
    const pagesUrl = new URL('https://graph.facebook.com/v18.0/me/accounts')
    pagesUrl.searchParams.set('access_token', access_token)

    const pagesResponse = await fetch(pagesUrl.toString())
    const pagesData = await pagesResponse.json()

    let instagramBusinessAccountId = null
    let metadata: any = {}

    if (pagesData.data && pagesData.data.length > 0) {
      // Get first page's Instagram Business Account
      const pageId = pagesData.data[0].id
      
      const igAccountUrl = new URL(`https://graph.facebook.com/v18.0/${pageId}`)
      igAccountUrl.searchParams.set('fields', 'instagram_business_account,username,followers_count')
      igAccountUrl.searchParams.set('access_token', access_token)

      const igAccountResponse = await fetch(igAccountUrl.toString())
      const igAccountData = await igAccountResponse.json()

      if (igAccountData.instagram_business_account) {
        instagramBusinessAccountId = igAccountData.instagram_business_account.id
        metadata = {
          username: igAccountData.username,
          followerCount: igAccountData.followers_count || 0,
          pageId: pageId,
        }
      }
    }

    if (!instagramBusinessAccountId) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_instagram_business_account`)
    }

    // Calculate expiry time (60 days)
    const expiresAt = new Date(Date.now() + expires_in * 1000)

    // Save or update social account
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'instagram',
        },
      },
      create: {
        userId: user.id,
        platform: 'instagram',
        platformUserId: instagramBusinessAccountId,
        accessToken: access_token,
        tokenExpiresAt: expiresAt,
        scopes: [],
        metadata: metadata,
        isActive: true,
      },
      update: {
        platformUserId: instagramBusinessAccountId,
        accessToken: access_token,
        tokenExpiresAt: expiresAt,
        scopes: [],
        metadata: metadata,
        isActive: true,
      },
    })

    // Redirect back to dashboard
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?connected=instagram`)
  } catch (error) {
    console.error('Instagram callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=instagram_callback_failed`)
  }
}
