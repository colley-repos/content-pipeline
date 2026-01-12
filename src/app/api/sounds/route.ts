import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/sounds - Search and filter sound assets
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const vibe = searchParams.get('vibe')
    const search = searchParams.get('search')

    const where: any = {
      isRoyaltyFree: true // Only show royalty-free assets
    }

    if (category) {
      where.category = category
    }

    if (vibe) {
      where.vibe = {
        has: vibe
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search.toLowerCase()] } }
      ]
    }

    const sounds = await prisma.soundAsset.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ sounds })
  } catch (error) {
    console.error('Failed to fetch sounds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sounds' },
      { status: 500 }
    )
  }
}
