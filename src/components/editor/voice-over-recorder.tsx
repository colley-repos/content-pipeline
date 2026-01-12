'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Mic, Square, Play, Pause, Trash2, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface VoiceOverRecorderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (audioUrl: string, duration: number) => void
  currentTime?: number
}

export function VoiceOverRecorder({
  open,
  onOpenChange,
  onSave,
  currentTime = 0,
}: VoiceOverRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [volume, setVolume] = useState([100])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  // Update audio volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100
    }
  }, [volume])

  // Initialize audio context for waveform visualization
  const initializeAudioContext = (stream: MediaStream) => {
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    source.connect(analyser)
    analyserRef.current = analyser
  }

  // Draw waveform visualization
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)

      canvasCtx.fillStyle = 'rgb(249, 250, 251)'
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = 'rgb(147, 51, 234)'
      canvasCtx.beginPath()

      const sliceWidth = (canvas.width * 1.0) / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2

        if (i === 0) {
          canvasCtx.moveTo(x, y)
        } else {
          canvasCtx.lineTo(x, y)
        }

        x += sliceWidth
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2)
      canvasCtx.stroke()
    }

    draw()
  }

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Initialize audio context for visualization
      initializeAudioContext(stream)
      drawWaveform()

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setHasRecording(true)

        // Get duration
        const audio = new Audio(url)
        audio.onloadedmetadata = () => {
          setDuration(audio.duration)
        }

        // Stop visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast.success('Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast.error('Failed to access microphone')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }

      toast.success('Recording stopped')
    }
  }

  // Play preview
  const playPreview = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Pause preview
  const pausePreview = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  // Delete recording
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setHasRecording(false)
    setRecordingTime(0)
    setDuration(0)
    audioChunksRef.current = []
  }

  // Save recording
  const handleSave = async () => {
    if (!audioUrl) return

    setIsSaving(true)
    try {
      // Fetch the blob from the object URL
      const response = await fetch(audioUrl)
      const blob = await response.blob()

      // Create FormData for upload
      const formData = new FormData()
      formData.append('audio', blob, `voiceover-${Date.now()}.webm`)
      formData.append('category', 'voice_over')
      formData.append('duration', duration.toString())

      // Upload to server
      const uploadResponse = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const data = await uploadResponse.json()

      toast.success('Voice-over saved successfully')
      onSave(data.audioUrl, duration)
      onOpenChange(false)

      // Cleanup
      deleteRecording()
    } catch (error) {
      console.error('Failed to save recording:', error)
      toast.error('Failed to save recording')
    } finally {
      setIsSaving(false)
    }
  }

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Record Voice-Over
          </DialogTitle>
          <DialogDescription>
            Record audio narration to add to your video at {formatTime(Math.floor(currentTime))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Waveform Visualization */}
          <Card>
            <CardContent className="p-4">
              <canvas
                ref={canvasRef}
                width={640}
                height={150}
                className="w-full border rounded"
              />
            </CardContent>
          </Card>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4">
            {!hasRecording && !isRecording && (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {formatTime(recordingTime)}
                </div>
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Preview Controls */}
          {hasRecording && !isRecording && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                {!isPlaying ? (
                  <Button onClick={playPreview} size="lg">
                    <Play className="w-5 h-5 mr-2" />
                    Play Preview
                  </Button>
                ) : (
                  <Button onClick={pausePreview} size="lg">
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                )}
                <Button onClick={deleteRecording} size="lg" variant="outline">
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Volume: {volume[0]}%
                </label>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <audio
                ref={audioRef}
                src={audioUrl || undefined}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasRecording || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Add to Timeline
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
