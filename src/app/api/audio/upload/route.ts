import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Parse form data
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const category = formData.get('category') as string
    const duration = parseFloat(formData.get('duration') as string)

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob Storage
    const blob = await put(audioFile.name, audioFile, {
      access: 'public',
      addRandomSuffix: true,
    })

    // Create SoundAsset record
    const soundAsset = await prisma.soundAsset.create({
      data: {
        name: `Voice Over ${new Date().toLocaleDateString()}`,
        description: 'User recorded voice-over',
        category: category || 'voice_over',
        vibe: [],
        fileUrl: blob.url,
        duration: Math.floor(duration) || 0,
        tags: ['voice-over', 'user-generated'],
        bpm: null,
      },
    })

    return NextResponse.json({
      success: true,
      audioUrl: soundAsset.fileUrl,
      assetId: soundAsset.id,
      duration: soundAsset.duration,
    })
  } catch (error) {
    console.error('Audio upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload audio' },
      { status: 500 }
    )
  }
}
