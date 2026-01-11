import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateContent } from '@/lib/openai'
import { generateShareToken } from '@/lib/utils'
import { z } from 'zod'
import { withSecurityHeaders } from '@/lib/security-headers'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limit'
import { sanitizedSchemas } from '@/lib/sanitization'

const generateSchema = z.object({
  type: z.enum(['social_post', 'caption', 'script', 'bio', 'reply', 'content_calendar']),
  prompt: sanitizedSchemas.prompt,
  context: sanitizedSchemas.context,
  tone: z.enum(['professional', 'casual', 'humorous', 'inspirational', 'educational']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
})

async function handler(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user credits and subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Allow if: has active subscription OR has free credits remaining
    const hasActiveSubscription = user.subscription?.status === 'ACTIVE'
    const hasFreeCredits = user.freeCreditsRemaining > 0

    // Apply different rate limits based on subscription status
    const rateLimit = hasActiveSubscription 
      ? RATE_LIMITS.CONTENT_GENERATE 
      : RATE_LIMITS.CONTENT_GENERATE_FREE
    
    const rateLimitCheck = checkUserRateLimit(
      session.user.id,
      'content:generate',
      rateLimit
    )
    
    if (rateLimitCheck.limited) {
      return createRateLimitResponse(
        rateLimitCheck.remaining,
        rateLimitCheck.resetTime,
        hasActiveSubscription 
          ? 'Rate limit exceeded. Please slow down your requests.'
          : 'Free tier rate limit exceeded. Upgrade for higher limits or wait a minute.'
      )
    }

    if (!hasActiveSubscription && !hasFreeCredits) {
      return NextResponse.json(
        { 
          error: 'No credits remaining',
          message: 'Upgrade to continue generating unlimited content',
          creditsRemaining: 0
        },
        { status: 403 }
      )
    }

    // Deduct free credit if not subscribed
    if (!hasActiveSubscription && hasFreeCredits) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { freeCreditsRemaining: { decrement: 1 } },
      })
    }

    const body = await request.json()
    const params = generateSchema.parse(body)

    // Generate content using OpenAI
    const output = await generateContent(params)

    // Save to database
    const shareToken = generateShareToken()
    const content = await prisma.content.create({
      data: {
        userId: session.user.id,
        type: params.type.toUpperCase() as any,
        prompt: params.prompt,
        output,
        shareToken,
        metadata: {
          context: params.context,
          tone: params.tone,
          length: params.length,
        },
      },
    })

    // Get updated user data for response
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { freeCreditsRemaining: true },
    })

    // Log analytics with detailed experiment tracking
    await prisma.analytics.create({
      data: {
        userId: session.user.id,
        event: 'CONTENT_GENERATED',
        metadata: {
          contentId: content.id,
          type: params.type,
          usedFreeCredit: !hasActiveSubscription,
          creditsRemaining: updatedUser?.freeCreditsRemaining || 0,
          experiment: 'free_credits_v1',
          isFirstGeneration: false, // Could track this too
        },
      },
    })

    // Console log for immediate visibility
    console.log('📊 EXPERIMENT: Free Credits Usage', {
      userId: session.user.id,
      creditsRemaining: updatedUser?.freeCreditsRemaining || 0,
      hasSubscription: hasActiveSubscription,
      usedFreeCredit: !hasActiveSubscription,
    })

    return NextResponse.json({
      id: content.id,
      output,
      shareToken,
      shareUrl: `${process.env.NEXTAUTH_URL}/share/${shareToken}`,
      creditsRemaining: updatedUser?.freeCreditsRemaining || 0,
      hasActiveSubscription,
    })
  } catch (error: unknown) {
    console.error('Content generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Content generation failed. Please try again.' },
      { status: 500 }
    )
  }
}

// Apply security headers to POST handler
export const POST = withSecurityHeaders(handler)

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type')

    const where: any = { userId: session.user.id }
    if (type) {
      where.type = type.toUpperCase()
    }

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          prompt: true,
          output: true,
          shareToken: true,
          shared: true,
          createdAt: true,
        },
      }),
      prisma.content.count({ where }),
    ])

    return NextResponse.json({
      contents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}
