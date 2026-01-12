import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const presets = await prisma.editingPreset.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        usageCount: 'desc',
      },
    })

    return NextResponse.json({ presets })
  } catch (error) {
    console.error('Fetch presets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch presets' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      description,
      vibeCategory,
      creatorTypes,
      jumpCutFrequency,
      transitionStyle,
      musicTempo,
      soundEffects,
      colorFilter,
      textStyle,
    } = body

    const preset = await prisma.editingPreset.create({
      data: {
        name,
        description,
        vibeCategory,
        creatorTypes: creatorTypes || [],
        jumpCutFrequency: jumpCutFrequency || 0,
        transitionStyle: transitionStyle || 'cut',
        musicTempo: musicTempo || 'medium',
        soundEffects: soundEffects || [],
        colorFilter,
        textStyle: textStyle || {},
      },
    })

    return NextResponse.json({ preset })
  } catch (error) {
    console.error('Create preset error:', error)
    return NextResponse.json(
      { error: 'Failed to create preset' },
      { status: 500 }
    )
  }
}
