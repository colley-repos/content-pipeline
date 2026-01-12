import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getProgress } from '@/lib/progress-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { searchParams } = new URL(req.url)
    const editId = searchParams.get('editId')

    if (!editId) {
      return new Response(JSON.stringify({ error: 'Edit ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify edit belongs to user
    const videoEdit = await prisma.videoEdit.findUnique({
      where: { id: editId },
    })

    if (!videoEdit || videoEdit.userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Edit not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          )
        }

        // Send initial status
        const progress = getProgress(editId) || {
          progress: 0,
          status: 'processing' as const,
          message: 'Starting video processing...',
        }
        sendEvent(progress)

        // Poll for updates every 500ms
        const interval = setInterval(() => {
          const currentProgress = getProgress(editId)
          
          if (!currentProgress) {
            // No progress data, send default
            sendEvent({
              progress: 0,
              status: 'processing',
              message: 'Waiting for processing to start...',
            })
            return
          }

          sendEvent(currentProgress)

          // Close connection if completed or failed
          if (
            currentProgress.status === 'completed' ||
            currentProgress.status === 'failed'
          ) {
            clearInterval(interval)
            controller.close()
          }
        }, 500)

        // Cleanup after 5 minutes (300 seconds)
        setTimeout(() => {
          clearInterval(interval)
          controller.close()
        }, 300000)

        // Handle client disconnect
        req.signal.addEventListener('abort', () => {
          clearInterval(interval)
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Progress stream error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
