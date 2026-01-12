import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      profile: user.userProfile,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { creatorType, preferredVibes, editingStyle, soundPreferences, colorGrading } = body

    // Create or update user profile
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        creatorType: creatorType || null,
        preferredVibes: preferredVibes || [],
        editingStyle: editingStyle || {},
        soundPreferences: soundPreferences || {},
        colorGrading: colorGrading || null,
      },
      update: {
        creatorType: creatorType !== undefined ? creatorType : undefined,
        preferredVibes: preferredVibes !== undefined ? preferredVibes : undefined,
        editingStyle: editingStyle !== undefined ? editingStyle : undefined,
        soundPreferences: soundPreferences !== undefined ? soundPreferences : undefined,
        colorGrading: colorGrading !== undefined ? colorGrading : undefined,
      },
    })

    return NextResponse.json({
      profile,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
