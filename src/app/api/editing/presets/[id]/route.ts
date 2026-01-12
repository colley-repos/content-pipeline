import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const preset = await prisma.editingPreset.findUnique({
      where: { id: params.id },
    })

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Increment usage count
    await prisma.editingPreset.update({
      where: { id: params.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ preset })
  } catch (error) {
    console.error('Fetch preset error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preset' },
      { status: 500 }
    )
  }
}
