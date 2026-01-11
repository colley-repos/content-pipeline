import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        freeCreditsRemaining: true,
        subscription: {
          select: {
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      freeCreditsRemaining: user.freeCreditsRemaining,
      hasActiveSubscription: user.subscription?.status === 'ACTIVE',
      subscription: user.subscription,
    })
  } catch (error) {
    console.error('User status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user status' },
      { status: 500 }
    )
  }
}
