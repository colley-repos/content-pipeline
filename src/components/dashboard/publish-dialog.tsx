'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Check } from 'lucide-react'

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentId: string
  caption: string
  videoUrl?: string
  onPublishComplete?: () => void
}

interface Platform {
  id: 'tiktok' | 'instagram'
  name: string
  icon: string
  connected: boolean
  supportsScheduling: boolean
}

export function PublishDialog({ 
  open, 
  onOpenChange, 
  contentId, 
  caption: initialCaption,
  videoUrl,
  onPublishComplete 
}: PublishDialogProps) {
  const platforms: Platform[] = [
    { id: 'tiktok', name: 'TikTok', icon: '📱', connected: false, supportsScheduling: true },
    { id: 'instagram', name: 'Instagram Reels', icon: '📷', connected: false, supportsScheduling: true },
  ]
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [caption, setCaption] = useState(initialCaption)
  const [publishing, setPublishing] = useState(false)
  const [publishStatus, setPublishStatus] = useState<{
    platform: string
    status: 'pending' | 'success' | 'error'
    message?: string
  }[]>([])

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const connectPlatform = async (platformId: string) => {
    // Open OAuth flow for platform
    window.open(`/api/social/connect/${platformId}?returnUrl=/dashboard`, '_blank')
  }

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform')
      return
    }

    setPublishing(true)
    setPublishStatus(
      selectedPlatforms.map(p => ({ platform: p, status: 'pending' }))
    )

    try {
      const response = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          platforms: selectedPlatforms,
          caption,
          videoUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish')
      }

      // Update status for each platform
      setPublishStatus(data.results.map((r: any) => ({
        platform: r.platform,
        status: r.success ? 'success' : 'error',
        message: r.message,
      })))

      if (data.results.every((r: any) => r.success)) {
        setTimeout(() => {
          onOpenChange(false)
          onPublishComplete?.()
        }, 2000)
      }
    } catch (error) {
      console.error('Publish error:', error)
      setPublishStatus(prev =>
        prev.map(p => ({ ...p, status: 'error', message: 'Failed to publish' }))
      )
    } finally {
      setPublishing(false)
    }
  }

  const allPlatformsConnected = platforms.filter(p => selectedPlatforms.includes(p.id)).every(p => p.connected)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Publish to Social Media</DialogTitle>
          <DialogDescription>
            Share your content to multiple platforms at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Select Platforms</Label>
            {platforms.map((platform) => (
              <div key={platform.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={platform.id}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => togglePlatform(platform.id)}
                    disabled={!platform.connected}
                  />
                  <label
                    htmlFor={platform.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <span>{platform.icon}</span>
                    {platform.name}
                  </label>
                </div>
                
                {!platform.connected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => connectPlatform(platform.id)}
                  >
                    Connect
                  </Button>
                ) : (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Connected
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Caption Editor */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption for your video..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {caption.length} characters
            </p>
          </div>

          {/* Publishing Status */}
          {publishStatus.length > 0 && (
            <div className="space-y-2">
              {publishStatus.map((status) => (
                <div
                  key={status.platform}
                  className={`flex items-center justify-between p-2 rounded ${
                    status.status === 'success' ? 'bg-green-50' :
                    status.status === 'error' ? 'bg-red-50' :
                    'bg-gray-50'
                  }`}
                >
                  <span className="text-sm capitalize">{status.platform}</span>
                  {status.status === 'pending' && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {status.status === 'success' && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  {status.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {selectedPlatforms.length > 0 && !allPlatformsConnected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect to selected platforms before publishing
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={publishing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              className="flex-1"
              disabled={!allPlatformsConnected || selectedPlatforms.length === 0 || publishing}
            >
              {publishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Now'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
