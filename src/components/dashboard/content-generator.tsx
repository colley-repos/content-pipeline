'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UpgradeModal } from './upgrade-modal'

interface ContentGeneratorProps {
  type: 'social_post' | 'caption' | 'script' | 'bio' | 'reply' | 'content_calendar'
  title: string
  description: string
}

export function ContentGenerator({ type, title, description }: ContentGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setLoading(true)
    setError('')
    setOutput('')
    setShareUrl('')

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          prompt,
          tone: 'casual',
          length: 'medium',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to generate content')
        
        // Show modal if out of credits
        if (data.error === 'No credits remaining') {
          setShowUpgradeModal(true)
          console.log('🎯 EXPERIMENT: Showing upgrade modal', { prompt: prompt.substring(0, 50) })
          
          // Track modal view
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'UPGRADE_MODAL_VIEWED', metadata: { source: type } }),
          }).catch(console.error)
        }
        return
      }

      const data = await response.json()
      setOutput(data.output)
      setShareUrl(data.shareUrl)
      setCreditsRemaining(data.creditsRemaining)
      setHasSubscription(data.hasActiveSubscription)
      
      // Track successful generation
      console.log('✅ EXPERIMENT: Content Generated', {
        type,
        creditsRemaining: data.creditsRemaining,
        hasSubscription: data.hasActiveSubscription,
      })
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    alert('Copied to clipboard!')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">What do you want to create?</Label>
          <Textarea
            id="prompt"
            placeholder="E.g., Create a motivational post about starting a new business"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={loading}
          />
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? 'Generating...' : 'Generate Content'}
        </Button>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
            {error.includes('No credits') && (
              <div className="mt-2">
                <a href="/pricing" className="underline font-medium">
                  Upgrade now to continue →
                </a>
              </div>
            )}
          </div>
        )}

        {!hasSubscription && creditsRemaining !== null && creditsRemaining < 3 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded-md">
            <strong>⚡ {creditsRemaining} free {creditsRemaining === 1 ? 'credit' : 'credits'} remaining!</strong>
            {creditsRemaining === 0 ? (
              <div className="mt-1">
                <a href="/pricing" className="underline font-medium">
                  Upgrade to generate unlimited content →
                </a>
              </div>
            ) : (
              <div className="mt-1">
                <a href="/pricing" className="underline font-medium">
                  Upgrade for unlimited generations →
                </a>
              </div>
            )}
          </div>
        )}

        {output && (
          <div className="space-y-3">
            <div className="bg-muted p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="flex-1">
                Copy to Clipboard
              </Button>
              {shareUrl && (
                <Button
                  onClick={() => window.open(shareUrl, '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  Share
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        prompt={prompt}
      />
    </Card>
  )
}
