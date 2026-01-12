import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID!
const INSTAGRAM_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/social/callback/instagram`

export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!INSTAGRAM_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Instagram OAuth not configured. Please set INSTAGRAM_CLIENT_ID environment variable.' },
        { status: 500 }
      )
    }

    // Generate CSRF token (state parameter)
    const state = Math.random().toString(36).substring(2, 15)
    
    // Instagram OAuth URL with required scopes
    const scopes = ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement']
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    
    authUrl.searchParams.set('client_id', INSTAGRAM_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', INSTAGRAM_REDIRECT_URI)
    authUrl.searchParams.set('scope', scopes.join(','))
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('state', state)

    return NextResponse.json({
      authUrl: authUrl.toString(),
    })
  } catch (error) {
    console.error('Instagram OAuth init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize Instagram OAuth' },
      { status: 500 }
    )
  }
}
