'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VideoEditor } from '@/components/editor/video-editor'

interface EditVideoDialogProps {
  contentId: string
  videoUrl: string
  isOpen: boolean
  onClose: () => void
  onEditComplete?: () => void
}

export function EditVideoDialog({
  contentId,
  videoUrl,
  isOpen,
  onClose,
  onEditComplete
}: EditVideoDialogProps) {
  const handleEditComplete = () => {
    if (onEditComplete) {
      onEditComplete()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
          <DialogDescription>
            Apply vibe presets or manually edit your video with jump cuts, voice-overs, and sound effects
          </DialogDescription>
        </DialogHeader>
        <VideoEditor
          contentId={contentId}
          videoUrl={videoUrl}
          onComplete={handleEditComplete}
        />
      </DialogContent>
    </Dialog>
  )
}
