'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SoundLibrary } from './sound-library'
import { VoiceOverRecorder } from './voice-over-recorder'
import { 
  Play, 
  Pause, 
  Scissors, 
  Mic, 
  Volume2, 
  Wand2,
  Sparkles,
  Loader2,
  Music
} from 'lucide-react'

interface VideoEditorProps {
  contentId: string
  videoUrl: string
  duration?: number
  onSave?: (editId: string) => void
  onComplete?: () => void
}

interface EditOperation {
  type: 'jumpcut' | 'voiceover' | 'soundfx' | 'transition'
  timestamp: number
  duration?: number
  data?: any
}

interface SoundAsset {
  id: string
  name: string
  category: 'music' | 'sound_effect' | 'voice_over'
  vibe: string[]
  fileUrl: string
  duration: number
  bpm: number | null
  tags: string[]
  usageCount: number
}

const VIBE_PRESETS = [
  { id: 'energetic', name: 'Energetic', emoji: '⚡', description: 'Fast cuts, upbeat music' },
  { id: 'chill', name: 'Chill Vibes', emoji: '😌', description: 'Smooth, relaxed flow' },
  { id: 'professional', name: 'Professional', emoji: '💼', description: 'Clean, polished' },
  { id: 'funny', name: 'Funny', emoji: '😂', description: 'Comedic timing' },
  { id: 'dramatic', name: 'Dramatic', emoji: '🎭', description: 'Bold, emotional' },
]

export function VideoEditor({ contentId, videoUrl, duration = 60, onSave, onComplete }: VideoEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime] = useState(0)
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [editOps, setEditOps] = useState<EditOperation[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [jumpCutFrequency, setJumpCutFrequency] = useState(5) // cuts per minute
  const [musicVolume, setMusicVolume] = useState(70)
  const [showSoundLibrary, setShowSoundLibrary] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(true)

  // Fetch recommendations on mount
  useState(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/recommendations/vibes')
        if (response.ok) {
          const data = await response.json()
          setRecommendations(data.recommendations || [])
        }
      } catch (error) {
        console.error('Failed to load recommendations:', error)
      } finally {
        setLoadingRecommendations(false)
      }
    }
    fetchRecommendations()
  })

  const handleVibeSelect = async (vibeId: string) => {
    setSelectedVibe(vibeId)
    
    // Fetch preset configuration for this vibe
    try {
      const response = await fetch(`/api/editing/presets/${vibeId}`)
      const preset = await response.json()
      
      // Apply preset defaults
      setJumpCutFrequency(preset.jumpCutFrequency || 5)
      setMusicVolume(preset.musicVolume || 70)
      
      // Generate edit operations based on preset
      const operations: EditOperation[] = []
      
      // Add jump cuts based on frequency
      if (preset.jumpCutFrequency > 0) {
        const interval = 60 / preset.jumpCutFrequency // seconds between cuts
        for (let t = interval; t < duration; t += interval) {
          operations.push({
            type: 'jumpcut',
            timestamp: t,
          })
        }
      }
      
      setEditOps(operations)
    } catch (error) {
      console.error('Failed to load preset:', error)
    }
  }

  const addJumpCut = () => {
    setEditOps([...editOps, {
      type: 'jumpcut',
      timestamp: currentTime,
    }])
  }

  const addVoiceOver = () => {
    setShowVoiceRecorder(true)
  }

  const handleVoiceOverSave = (audioUrl: string, duration: number) => {
    setEditOps([...editOps, {
      type: 'voiceover',
      timestamp: currentTime,
      duration,
      data: {
        audioUrl,
        volume: 100,
      },
    }])
  }

  const handleAddSound = (sound: SoundAsset) => {
    setEditOps([...editOps, {
      type: 'soundfx',
      timestamp: currentTime,
      duration: sound.duration,
      data: {
        soundId: sound.id,
        name: sound.name,
        fileUrl: sound.fileUrl,
        category: sound.category,
      },
    }])
    setShowSoundLibrary(false)
  }

  const removeOperation = (index: number) => {
    setEditOps(editOps.filter((_, i) => i !== index))
  }

  const handleApplyEdits = async () => {
    setProcessing(true)
    setProgress(0)
    setProgressMessage('Starting video processing...')
    
    try {
      const response = await fetch('/api/editing/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          videoUrl,
          presetId: selectedVibe,
          operations: editOps,
          settings: {
            jumpCutFrequency,
            musicVolume,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process video')
      }

      const data = await response.json()
      
      // Subscribe to progress updates via SSE
      const eventSource = new EventSource(`/api/editing/progress?editId=${data.editId}`)
      
      eventSource.onmessage = (event) => {
        const progressData = JSON.parse(event.data)
        setProgress(progressData.progress)
        setProgressMessage(progressData.message || '')
        
        // Close connection when completed or failed
        if (progressData.status === 'completed') {
          eventSource.close()
          setProcessing(false)
          
          if (onSave) {
            onSave(data.editId)
          }
          
          // Call onComplete after successful edit
          if (onComplete) {
            setTimeout(() => {
              onComplete()
            }, 1000) // Small delay to show success state
          }
        } else if (progressData.status === 'failed') {
          eventSource.close()
          setProcessing(false)
          alert(`Processing failed: ${progressData.message || 'Unknown error'}`)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        eventSource.close()
        setProcessing(false)
      }
    } catch (error) {
      console.error('Processing error:', error)
      alert('Failed to process video. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Video Preview */}
      <Card>
        <CardContent className="p-6">
          <div className="bg-black rounded-lg aspect-video flex items-center justify-center mb-4">
            <video 
              src={videoUrl}
              className="w-full h-full rounded-lg"
              controls={false}
            />
          </div>
          
          {/* Timeline */}
          <div className="mb-4">
            <div className="relative h-12 bg-gray-100 rounded">
              {/* Edit markers */}
              {editOps.map((op, index) => (
                <div
                  key={index}
                  className="absolute top-0 h-full w-1 bg-purple-600 cursor-pointer"
                  style={{ left: `${(op.timestamp / duration) * 100}%` }}
                  onClick={() => removeOperation(index)}
                  title={`${op.type} at ${op.timestamp.toFixed(1)}s`}
                >
                  <div className="absolute -top-6 left-0 transform -translate-x-1/2">
                    {op.type === 'jumpcut' && <Scissors className="w-4 h-4" />}
                    {op.type === 'voiceover' && <Mic className="w-4 h-4" />}
                    {op.type === 'soundfx' && <Volume2 className="w-4 h-4" />}
                  </div>
                </div>
              ))}
              
              {/* Playhead */}
              <div
                className="absolute top-0 h-full w-0.5 bg-red-500"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            
            {/* Timeline controls */}
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span>{currentTime.toFixed(1)}s</span>
              <span>{duration.toFixed(1)}s</span>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vibe Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Choose Your Vibe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {VIBE_PRESETS.map((vibe) => {
              const recommendation = recommendations.find(r => r.vibeId === vibe.id);
              
              return (
                <button
                  key={vibe.id}
                  onClick={() => handleVibeSelect(vibe.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-center relative ${
                    selectedVibe === vibe.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {recommendation && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {recommendation.confidence}%
                      </Badge>
                    </div>
                  )}
                  <div className="text-3xl mb-2">{vibe.emoji}</div>
                  <div className={`font-semibold mb-1 ${
                    selectedVibe === vibe.id ? 'text-purple-600' : 'text-gray-900'
                  }`}>
                    {vibe.name}
                  </div>
                  <div className="text-xs text-gray-600">{vibe.description}</div>
                  {recommendation && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                      {recommendation.reason}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Manual Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Jump Cuts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Jump Cuts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Cuts per minute: {jumpCutFrequency}
              </label>
              <Slider
                value={[jumpCutFrequency]}
                onValueChange={(val) => setJumpCutFrequency(val[0])}
                min={0}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addJumpCut}
              className="w-full"
            >
              <Scissors className="w-4 h-4 mr-2" />
              Add Cut at Current Time
            </Button>
          </CardContent>
        </Card>

        {/* Sound & Music */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Music Volume: {musicVolume}%
              </label>
              <Slider
                value={[musicVolume]}
                onValueChange={(val) => setMusicVolume(val[0])}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSoundLibrary(true)}
              className="w-full"
            >
              <Music className="w-4 h-4 mr-2" />
              Browse Sound Library
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addVoiceOver}
              className="w-full"
            >
              <Mic className="w-4 h-4 mr-2" />
              Add Voice-Over
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Edit Summary */}
      {editOps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Applied Edits ({editOps.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {editOps.map((op, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    {op.type === 'jumpcut' && <Scissors className="w-4 h-4" />}
                    {op.type === 'voiceover' && <Mic className="w-4 h-4" />}
                    {op.type === 'soundfx' && <Volume2 className="w-4 h-4" />}
                    <span className="capitalize font-medium">{op.type}</span>
                    {op.data?.name && (
                      <span className="text-sm text-gray-500">- {op.data.name}</span>
                    )}
                    <Badge variant="outline">{op.timestamp.toFixed(1)}s</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOperation(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setEditOps([])
            setSelectedVibe(null)
          }}
        >
          Reset
        </Button>
        <Button
          onClick={handleApplyEdits}
          disabled={processing || editOps.length === 0}
          className="min-w-[160px]"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Apply Edits
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      {processing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing Video</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {progressMessage && (
                <p className="text-sm text-gray-500">{progressMessage}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sound Library Modal */}
      <Dialog open={showSoundLibrary} onOpenChange={setShowSoundLibrary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sound Library</DialogTitle>
            <DialogDescription>
              Browse music, sound effects, and voice-overs to add to your video
            </DialogDescription>
          </DialogHeader>
          <SoundLibrary onAddSound={handleAddSound} />
        </DialogContent>
      </Dialog>

      {/* Voice-Over Recorder Dialog */}
      <VoiceOverRecorder
        open={showVoiceRecorder}
        onOpenChange={setShowVoiceRecorder}
        onSave={handleVoiceOverSave}
        currentTime={currentTime}
      />
    </div>
  )
}
