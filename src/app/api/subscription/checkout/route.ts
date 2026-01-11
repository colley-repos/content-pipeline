import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession, createPortalSession, PLANS } from '@/lib/stripe'
import { z } from 'zod'

const createCheckoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = createCheckoutSchema.parse(body)

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription record found' },
        { status: 404 }
      )
    }

    // If already active, redirect to portal
    if (subscription.status === 'ACTIVE') {
      const portalSession = await createPortalSession(subscription.stripeCustomerId)
      return NextResponse.json({ url: portalSession.url })
    }

    // Create checkout session
    const priceId = PLANS[plan].priceId
    const checkoutSession = await createCheckoutSession(
      subscription.stripeCustomerId,
      priceId,
      session.user.id
    )

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
