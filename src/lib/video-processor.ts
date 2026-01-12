import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

const execAsync = promisify(exec)

interface EditOperation {
  type: 'jumpcut' | 'voiceover' | 'soundfx' | 'transition'
  timestamp: number
  duration?: number
  data?: any
}

interface ProcessingOptions {
  videoUrl: string
  operations: EditOperation[]
  settings: {
    jumpCutFrequency?: number
    musicVolume?: number
  }
  outputPath?: string
}

interface ProcessingResult {
  success: boolean
  outputPath?: string
  error?: string
  processingTime: number
}

/**
 * Video Processor using FFmpeg
 * 
 * This module handles video editing operations using FFmpeg command-line tool.
 * It processes jump cuts, voice-overs, sound effects, and transitions.
 * 
 * IMPORTANT: This implementation assumes FFmpeg is installed locally or available
 * in the Lambda environment. For production, use AWS Lambda with FFmpeg layer.
 */
export class VideoProcessor {
  private tempDir: string

  constructor(tempDir: string = '/tmp') {
    this.tempDir = tempDir
  }

  /**
   * Process video with edit operations
   */
  async processVideo(options: ProcessingOptions): Promise<ProcessingResult> {
    const startTime = Date.now()
    
    try {
      // Create temporary working directory
      const workDir = path.join(this.tempDir, `video-${uuidv4()}`)
      await fs.mkdir(workDir, { recursive: true })

      // Download input video
      const inputPath = await this.downloadVideo(options.videoUrl, workDir)

      // Sort operations by timestamp
      const sortedOps = [...options.operations].sort((a, b) => a.timestamp - b.timestamp)

      // Process operations
      let currentVideoPath = inputPath
      
      // Group operations by type for efficient processing
      const jumpCuts = sortedOps.filter(op => op.type === 'jumpcut')
      const audioOps = sortedOps.filter(op => op.type === 'voiceover' || op.type === 'soundfx')

      // Apply jump cuts first
      if (jumpCuts.length > 0) {
        currentVideoPath = await this.applyJumpCuts(currentVideoPath, jumpCuts, workDir)
      }

      // Apply audio overlays
      if (audioOps.length > 0) {
        currentVideoPath = await this.applyAudioOverlays(currentVideoPath, audioOps, options.settings, workDir)
      }

      // Final output path
      const outputPath = options.outputPath || path.join(workDir, 'final-output.mp4')
      await fs.copyFile(currentVideoPath, outputPath)

      // Cleanup temporary files
      await this.cleanup(workDir, outputPath)

      const processingTime = Date.now() - startTime

      return {
        success: true,
        outputPath,
        processingTime
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error('Video processing error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      }
    }
  }

  /**
   * Download video from URL to local file
   */
  private async downloadVideo(url: string, workDir: string): Promise<string> {
    const outputPath = path.join(workDir, 'input.mp4')
    
    // For local development, if URL is a file path, just copy it
    if (url.startsWith('file://') || url.startsWith('/')) {
      const localPath = url.replace('file://', '')
      await fs.copyFile(localPath, outputPath)
      return outputPath
    }

    // Download from HTTP/HTTPS URL
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    await fs.writeFile(outputPath, Buffer.from(buffer))
    
    return outputPath
  }

  /**
   * Apply jump cuts to video
   * 
   * Jump cuts remove segments between specified timestamps.
   * We extract the segments we want to keep and concatenate them.
   */
  private async applyJumpCuts(
    inputPath: string,
    jumpCuts: EditOperation[],
    workDir: string
  ): Promise<string> {
    // Get video duration
    const duration = await this.getVideoDuration(inputPath)

    // Create segments to keep (everything except the cut points)
    const segments: Array<{ start: number; end: number }> = []
    let lastEnd = 0

    // For simplicity, we'll cut 0.5 seconds around each jump cut timestamp
    for (const cut of jumpCuts) {
      const cutStart = Math.max(0, cut.timestamp - 0.25)
      const cutEnd = Math.min(duration, cut.timestamp + 0.25)

      if (cutStart > lastEnd) {
        segments.push({ start: lastEnd, end: cutStart })
      }
      lastEnd = cutEnd
    }

    // Add final segment
    if (lastEnd < duration) {
      segments.push({ start: lastEnd, end: duration })
    }

    // Extract segments
    const segmentPaths: string[] = []
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const segmentPath = path.join(workDir, `segment-${i}.mp4`)
      
      const duration = segment.end - segment.start
      const command = `ffmpeg -i "${inputPath}" -ss ${segment.start} -t ${duration} -c copy "${segmentPath}"`
      
      await execAsync(command)
      segmentPaths.push(segmentPath)
    }

    // Create concat file
    const concatFilePath = path.join(workDir, 'concat.txt')
    const concatContent = segmentPaths.map(p => `file '${p}'`).join('\n')
    await fs.writeFile(concatFilePath, concatContent)

    // Concatenate segments
    const outputPath = path.join(workDir, 'jumpcuts-applied.mp4')
    const concatCommand = `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy "${outputPath}"`
    await execAsync(concatCommand)

    return outputPath
  }

  /**
   * Apply audio overlays (voice-overs and sound effects)
   */
  private async applyAudioOverlays(
    inputPath: string,
    audioOps: EditOperation[],
    settings: { musicVolume?: number },
    workDir: string
  ): Promise<string> {
    const outputPath = path.join(workDir, 'audio-applied.mp4')

    // Build complex filter for audio mixing
    const filterParts: string[] = []
    const inputs: string[] = [inputPath]
    
    let inputIndex = 1
    for (const op of audioOps) {
      if (op.data?.fileUrl) {
        // Download audio file
        const audioPath = await this.downloadAudio(op.data.fileUrl, workDir, inputIndex)
        inputs.push(audioPath)

        // Add delay and volume filter
        const volume = op.type === 'soundfx' ? '0.7' : '1.0'
        filterParts.push(`[${inputIndex}:a]adelay=${op.timestamp * 1000}|${op.timestamp * 1000},volume=${volume}[a${inputIndex}]`)
        
        inputIndex++
      }
    }

    // Mix all audio streams
    if (filterParts.length > 0) {
      const audioStreams = Array.from({ length: inputIndex }, (_, i) => i === 0 ? '[0:a]' : `[a${i}]`).join('')
      const musicVolume = (settings.musicVolume || 70) / 100
      filterParts.push(`${audioStreams}amix=inputs=${inputIndex}:duration=first:dropout_transition=2,volume=${musicVolume}[aout]`)

      const inputArgs = inputs.map(p => `-i "${p}"`).join(' ')
      const filterComplex = filterParts.join(';')
      
      const command = `ffmpeg ${inputArgs} -filter_complex "${filterComplex}" -map 0:v -map "[aout]" -c:v copy -c:a aac "${outputPath}"`
      
      await execAsync(command)
    } else {
      // No audio operations, just copy
      await fs.copyFile(inputPath, outputPath)
    }

    return outputPath
  }

  /**
   * Download audio file for mixing
   */
  private async downloadAudio(url: string, workDir: string, index: number): Promise<string> {
    const outputPath = path.join(workDir, `audio-${index}.mp3`)
    
    // For demo purposes, if URL is invalid, create a silent audio file
    if (!url || url.includes('example.com')) {
      // Create 1 second of silence
      const command = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 1 "${outputPath}"`
      await execAsync(command)
      return outputPath
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    await fs.writeFile(outputPath, Buffer.from(buffer))
    
    return outputPath
  }

  /**
   * Get video duration in seconds
   */
  private async getVideoDuration(videoPath: string): Promise<number> {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    const { stdout } = await execAsync(command)
    return parseFloat(stdout.trim())
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(workDir: string, keepFile: string): Promise<void> {
    try {
      const files = await fs.readdir(workDir)
      for (const file of files) {
        const filePath = path.join(workDir, file)
        if (filePath !== keepFile) {
          await fs.unlink(filePath).catch(() => {})
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }
}

/**
 * Factory function to create processor instance
 */
export function createVideoProcessor(tempDir?: string): VideoProcessor {
  return new VideoProcessor(tempDir)
}
