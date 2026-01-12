import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const TIKTOK_CLIENT_ID = process.env.TIKTOK_CLIENT_ID!
const TIKTOK_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/social/callback/tiktok`

export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!TIKTOK_CLIENT_ID) {
      return NextResponse.json(
        { error: 'TikTok OAuth not configured. Please set TIKTOK_CLIENT_ID environment variable.' },
        { status: 500 }
      )
    }

    // Generate CSRF token (state parameter)
    const state = Math.random().toString(36).substring(2, 15)
    
    // Store state in session or database for verification in callback
    // For now, we'll use a simple state parameter
    
    // TikTok OAuth URL with required scopes
    const scopes = ['user.info.basic', 'video.list', 'video.upload']
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize')
    
    authUrl.searchParams.set('client_key', TIKTOK_CLIENT_ID)
    authUrl.searchParams.set('scope', scopes.join(','))
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', TIKTOK_REDIRECT_URI)
    authUrl.searchParams.set('state', state)

    return NextResponse.json({
      authUrl: authUrl.toString(),
    })
  } catch (error) {
    console.error('TikTok OAuth init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize TikTok OAuth' },
      { status: 500 }
    )
  }
}
