import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RecommendationEngine } from '@/lib/recommendation-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/recommendations/vibes
 * Returns top 3 recommended vibe presets for the current user
 * 
 * Query params:
 * - contentType: Optional content type to match against
 */
export async function GET(request: Request) {
  try {
    // 1. Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get query parameters
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType') || undefined

    // 3. Get user ID from session
    const userId = session.user.email // Using email as userId

    // 4. Initialize recommendation engine
    const engine = new RecommendationEngine()

    // 5. Get recommendations
    const recommendations = await engine.getRecommendations(userId, contentType)

    // 6. Return recommendations
    return NextResponse.json({
      recommendations,
      userId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
