import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createVideoProcessor } from '@/lib/video-processor'
import * as path from 'path'
import * as os from 'os'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max execution (adjust for your plan)

interface ProcessRequest {
  contentId: string
  videoUrl: string
  presetId?: string
  operations: any[]
  settings: {
    jumpCutFrequency: number
    musicVolume: number
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

    const body: ProcessRequest = await req.json()
    const { contentId, videoUrl, presetId, operations, settings } = body

    // Create video edit record
    const videoEdit = await prisma.videoEdit.create({
      data: {
        contentId,
        userId: user.id,
        presetId: presetId || null,
        status: 'processing',
        originalVideoUrl: videoUrl,
        editOperations: {
          operations,
          settings,
        },
        renderProgress: 0,
      },
    })

    // Process video in background
    // NOTE: For production, offload this to AWS Lambda or a queue system (BullMQ)
    // This is a simplified implementation for development
    processVideoInBackground(videoEdit.id, videoUrl, operations, settings)

    return NextResponse.json({
      editId: videoEdit.id,
      status: 'processing',
      message: 'Video is being processed. You will be notified when ready.',
    })
  } catch (error) {
    console.error('Video processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    )
  }
}

/**
 * Process video in background
 * 
 * PRODUCTION CONSIDERATIONS:
 * 1. Use AWS Lambda with FFmpeg layer for serverless processing
 * 2. Use queue system (SQS, BullMQ) for job management
 * 3. Upload to S3/R2 for storage
 * 4. Implement retry logic for failed jobs
 * 5. Send webhooks/notifications on completion
 * 
 * For local development, this runs inline but doesn't block the response.
 */
async function processVideoInBackground(
  editId: string,
  videoUrl: string,
  operations: any[],
  settings: any
) {
  setImmediate(async () => {
    try {
      // Import progress functions
      const { updateProgress, completeProgress, failProgress } = await import('@/lib/progress-store')

      // Create processor instance
      const tempDir = process.env.TEMP_DIR || os.tmpdir()
      const processor = createVideoProcessor(tempDir)

      // Process video with FFmpeg and progress callbacks
      const result = await processor.processVideo({
        videoUrl,
        operations,
        settings,
        outputPath: path.join(tempDir, `edited-${editId}.mp4`),
        onProgress: (progress, message) => {
          updateProgress(editId, progress, message)
          // Also update database for persistence
          prisma.videoEdit.update({
            where: { id: editId },
            data: { renderProgress: progress },
          }).catch(err => console.error('Failed to update DB progress:', err))
        },
      })

      if (result.success && result.outputPath) {
        // TODO: Upload to storage (S3, R2, etc.)
        // For now, we'll use a placeholder URL
        const uploadedUrl = await uploadToStorage(result.outputPath, editId)

        // Update edit record with success
        await prisma.videoEdit.update({
          where: { id: editId },
          data: {
            status: 'completed',
            editedVideoUrl: uploadedUrl,
            renderProgress: 100,
            processingTime: Math.round(result.processingTime / 1000), // Convert to seconds
          },
        })

        // Mark progress as complete
        completeProgress(editId, 'Video processing completed successfully')

        // Save to editing history for ML recommendations
        await saveEditingHistory(editId)

        console.log(`✅ Video edit ${editId} completed successfully`)
      } else {
        // Processing failed
        failProgress(editId, result.error || 'Video processing failed')
        
        await prisma.videoEdit.update({
          where: { id: editId },
          data: {
            status: 'failed',
            renderProgress: 0,
            processingTime: Math.round(result.processingTime / 1000),
          },
        })

        console.error(`❌ Video edit ${editId} failed:`, result.error)
      }
    } catch (error) {
      console.error(`❌ Video edit ${editId} error:`, error)
      
      // Mark progress as failed
      const { failProgress } = await import('@/lib/progress-store')
      failProgress(editId, error instanceof Error ? error.message : 'Unknown error')
      
      // Update with error status
      await prisma.videoEdit.update({
        where: { id: editId },
        data: {
          status: 'failed',
          renderProgress: 0,
        },
      }).catch(console.error)
    }
  })
}

/**
 * Upload processed video to storage
 * 
 * PRODUCTION: Implement actual S3/R2 upload
 */
async function uploadToStorage(filePath: string, editId: string): Promise<string> {
  // TODO: Implement actual upload to S3/Cloudflare R2
  // For development, return placeholder
  
  console.log(`📤 Would upload ${filePath} to storage`)
  
  // Return placeholder URL
  return `https://storage.example.com/edited-videos/${editId}.mp4`
}

/**
 * Save editing operation to history for recommendation engine
 */
async function saveEditingHistory(editId: string): Promise<void> {
  try {
    const edit = await prisma.videoEdit.findUnique({
      where: { id: editId },
      include: { preset: true },
    })

    if (!edit) return

    await prisma.editingHistory.create({
      data: {
        userId: edit.userId,
        videoEditId: editId,
        action: 'preset_applied',
        presetUsed: edit.preset?.name || null,
        manualAdjustments: edit.editOperations || {},
        approved: false, // Will be updated when user approves
      },
    })
  } catch (error) {
    console.error('Failed to save editing history:', error)
  }
}

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url)
    const editId = searchParams.get('editId')

    if (editId) {
      // Get specific edit
      const edit = await prisma.videoEdit.findUnique({
        where: { id: editId },
        include: {
          preset: true,
        },
      })

      if (!edit || edit.userId !== user.id) {
        return NextResponse.json({ error: 'Edit not found' }, { status: 404 })
      }

      return NextResponse.json({ edit })
    }

    // Get all edits for user
    const edits = await prisma.videoEdit.findMany({
      where: { userId: user.id },
      include: {
        content: true,
        preset: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ edits })
  } catch (error) {
    console.error('Fetch edits error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch edits' },
      { status: 500 }
    )
  }
}
