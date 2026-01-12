'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Video, 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Eye,
  Share2,
  Edit,
  Calendar,
  Clock
} from 'lucide-react'

interface ContentItem {
  id: string
  type: string
  output: string
  createdAt: string
  estimatedSeconds: number
  published: boolean
  platforms?: {
    tiktok?: { views: number; likes: number; comments: number }
    instagram?: { views: number; likes: number; comments: number }
  }
}

export function ContentLibrary() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'ready' | 'published'>('ready')

  useEffect(() => {
    fetchContent()
  }, [filter])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/content/library?filter=${filter}`)
      const data = await response.json()
      setContent(data.content || [])
    } catch (error) {
      console.error('Failed to fetch content:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Content Library</h2>
          <p className="text-muted-foreground">
            Review, edit, and publish your AI-generated videos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Content
          </Button>
          <Button
            variant={filter === 'ready' ? 'default' : 'outline'}
            onClick={() => setFilter('ready')}
          >
            Ready to Publish
          </Button>
          <Button
            variant={filter === 'published' ? 'default' : 'outline'}
            onClick={() => setFilter('published')}
          >
            Published
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading content...</p>
        </div>
      ) : content.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first video to get started
            </p>
            <Button>Generate Content</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {content.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Video Preview Placeholder */}
              <div className="aspect-[9/16] bg-gradient-to-br from-purple-500 to-pink-500 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="h-16 w-16 text-white/80" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(item.estimatedSeconds)}
                </div>
                {item.published && (
                  <Badge className="absolute top-2 left-2 bg-green-600">
                    Published
                  </Badge>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Content Preview */}
                <p className="text-sm line-clamp-2">{item.output}</p>

                {/* Stats (if published) */}
                {item.published && item.platforms && (
                  <div className="space-y-2">
                    {item.platforms.tiktok && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium">TikTok:</span>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(item.platforms.tiktok.views)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {formatNumber(item.platforms.tiktok.likes)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {formatNumber(item.platforms.tiktok.comments)}
                        </div>
                      </div>
                    )}
                    {item.platforms.instagram && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium">Instagram:</span>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(item.platforms.instagram.views)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {formatNumber(item.platforms.instagram.likes)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {formatNumber(item.platforms.instagram.comments)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {!item.published ? (
                    <>
                      <Button size="sm" className="flex-1" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" className="flex-1">
                        <Share2 className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="flex-1" variant="outline">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      View Analytics
                    </Button>
                  )}
                </div>

                {/* Created Date */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
