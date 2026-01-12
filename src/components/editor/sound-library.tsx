'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Music, 
  Volume2, 
  Mic, 
  Play, 
  Pause, 
  Plus, 
  Search,
  Filter
} from 'lucide-react'

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

interface SoundLibraryProps {
  onAddSound: (sound: SoundAsset) => void
}

export function SoundLibrary({ onAddSound }: SoundLibraryProps) {
  const [sounds, setSounds] = useState<SoundAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedVibe, setSelectedVibe] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [playingSound, setPlayingSound] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetchSounds()
  }, [selectedCategory, selectedVibe, searchQuery])

  const fetchSounds = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      
      if (selectedVibe !== 'all') {
        params.append('vibe', selectedVibe)
      }
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/sounds?${params}`)
      const data = await response.json()
      setSounds(data.sounds || [])
    } catch (error) {
      console.error('Failed to fetch sounds:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayPause = (sound: SoundAsset) => {
    if (playingSound === sound.id) {
      audioRef.current?.pause()
      setPlayingSound(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = sound.fileUrl
        audioRef.current.play()
      }
      setPlayingSound(sound.id)
    }
  }

  const handleAudioEnd = () => {
    setPlayingSound(null)
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'music':
        return <Music className="w-4 h-4" />
      case 'sound_effect':
        return <Volume2 className="w-4 h-4" />
      case 'voice_over':
        return <Mic className="w-4 h-4" />
      default:
        return <Music className="w-4 h-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Sound Library
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search sounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'music' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('music')}
            >
              <Music className="w-3 h-3 mr-1" />
              Music
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'sound_effect' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('sound_effect')}
            >
              <Volume2 className="w-3 h-3 mr-1" />
              Effects
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'voice_over' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('voice_over')}
            >
              <Mic className="w-3 h-3 mr-1" />
              Voice
            </Button>
          </div>

          {/* Vibe Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Vibe:</span>
            <Button
              size="sm"
              variant={selectedVibe === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedVibe('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={selectedVibe === 'energetic' ? 'default' : 'outline'}
              onClick={() => setSelectedVibe('energetic')}
            >
              ⚡ Energetic
            </Button>
            <Button
              size="sm"
              variant={selectedVibe === 'chill' ? 'default' : 'outline'}
              onClick={() => setSelectedVibe('chill')}
            >
              😌 Chill
            </Button>
            <Button
              size="sm"
              variant={selectedVibe === 'professional' ? 'default' : 'outline'}
              onClick={() => setSelectedVibe('professional')}
            >
              💼 Professional
            </Button>
            <Button
              size="sm"
              variant={selectedVibe === 'funny' ? 'default' : 'outline'}
              onClick={() => setSelectedVibe('funny')}
            >
              😂 Funny
            </Button>
            <Button
              size="sm"
              variant={selectedVibe === 'dramatic' ? 'default' : 'outline'}
              onClick={() => setSelectedVibe('dramatic')}
            >
              🎭 Dramatic
            </Button>
          </div>
        </div>

        {/* Sound List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <p className="text-sm text-gray-500 mt-2">Loading sounds...</p>
          </div>
        ) : sounds.length === 0 ? (
          <div className="text-center py-8">
            <Music className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No sounds found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {sounds.map((sound) => (
              <div
                key={sound.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getCategoryIcon(sound.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{sound.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatDuration(sound.duration)}
                      </span>
                      {sound.bpm && (
                        <span className="text-xs text-gray-500">
                          {sound.bpm} BPM
                        </span>
                      )}
                      <div className="flex gap-1">
                        {sound.vibe.slice(0, 2).map((v) => (
                          <Badge key={v} variant="secondary" className="text-xs">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePlayPause(sound)}
                  >
                    {playingSound === sound.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAddSound(sound)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hidden audio player */}
        <audio
          ref={audioRef}
          onEnded={handleAudioEnd}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}
