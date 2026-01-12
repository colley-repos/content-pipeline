// Simple in-memory progress tracking
// In production, use Redis or another persistent store
const progressStore = new Map<string, {
  progress: number
  status: 'processing' | 'completed' | 'failed'
  message?: string
  estimatedTimeRemaining?: number
}>()

// Helper functions to update progress (used by video processor)
export function updateProgress(
  editId: string,
  progress: number,
  message?: string,
  estimatedTimeRemaining?: number
) {
  progressStore.set(editId, {
    progress: Math.min(100, Math.max(0, progress)),
    status: 'processing',
    message,
    estimatedTimeRemaining,
  })
}

export function completeProgress(editId: string, message?: string) {
  progressStore.set(editId, {
    progress: 100,
    status: 'completed',
    message: message || 'Video processing completed successfully',
  })
  
  // Clean up after 30 seconds
  setTimeout(() => {
    progressStore.delete(editId)
  }, 30000)
}

export function failProgress(editId: string, message?: string) {
  progressStore.set(editId, {
    progress: 0,
    status: 'failed',
    message: message || 'Video processing failed',
  })
  
  // Clean up after 30 seconds
  setTimeout(() => {
    progressStore.delete(editId)
  }, 30000)
}

export function getProgress(editId: string) {
  return progressStore.get(editId)
}
