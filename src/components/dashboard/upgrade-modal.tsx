'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { useState, useEffect } from 'react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  prompt?: string
}

export function UpgradeModal({ isOpen, onClose, prompt }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 2847,
    usersJoinedToday: 23,
    contentGeneratedToday: 1250,
  })

  useEffect(() => {
    // Fetch social proof stats
    fetch('/api/stats/social-proof')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        console.log('📊 EXPERIMENT: Social proof loaded', data)
      })
      .catch(console.error)
      
    // Track modal view with social proof
    if (isOpen) {
      console.log('🎯 EXPERIMENT: Modal with social proof shown')
    }
  }, [isOpen])

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    setLoading(true)
    
    // Track modal conversion attempt
    console.log('🎯 EXPERIMENT: Upgrade from modal', { plan, hadPrompt: !!prompt })
    
    // Track in database
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        event: 'UPGRADE_FROM_MODAL', 
        metadata: { plan, hadPrompt: !!prompt } 
      }),
    }).catch(console.error)

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        throw new Error('Checkout failed')
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            🎉 You&apos;ve discovered the power of AI content!
          </DialogTitle>
          <DialogDescription className="text-base">
            {prompt ? (
              <>You were generating: &quot;{prompt.substring(0, 60)}{prompt.length > 60 ? '...' : ''}&quot;</>
            ) : (
              <>Continue generating unlimited content with a premium plan</>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Social Proof Banner */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-200">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <div>
                <div className="font-bold text-purple-900">{stats.totalUsers.toLocaleString()}+</div>
                <div className="text-purple-700">Active Creators</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <div>
                <div className="font-bold text-purple-900">{stats.contentGeneratedToday.toLocaleString()}+</div>
                <div className="text-purple-700">Generated Today</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="font-bold text-purple-900">{stats.usersJoinedToday} creators</div>
                <div className="text-purple-700">Joined Today</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Monthly Plan */}
          <div className="border-2 rounded-lg p-6 hover:border-purple-300 transition-colors">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold mb-2">Monthly</h3>
              <div className="text-4xl font-bold mb-1">$29</div>
              <div className="text-gray-600">per month</div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-sm">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>Unlimited content generation</span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>All 6 content types</span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>Shareable outputs with CTAs</span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>Full content history</span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>Priority support</span>
              </li>
            </ul>

            <Button 
              className="w-full" 
              size="lg"
              onClick={() => handleUpgrade('monthly')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Start Monthly Plan'}
            </Button>
          </div>

          {/* Yearly Plan */}
          <div className="border-2 border-purple-600 rounded-lg p-6 bg-purple-50 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                BEST VALUE - SAVE 17%
              </span>
            </div>

            <div className="text-center mb-4 mt-2">
              <h3 className="text-xl font-bold mb-2">Yearly</h3>
              <div className="text-4xl font-bold mb-1">$290</div>
              <div className="text-gray-600">per year</div>
              <div className="text-green-600 font-medium text-sm mt-1">Save $58/year!</div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-sm">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span><strong>Everything in Monthly</strong></span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>2 months free (17% savings)</span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>Custom templates</span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>Weekly content inspiration packs</span>
              </li>
            </ul>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              size="lg"
              onClick={() => handleUpgrade('yearly')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Start Yearly Plan'}
            </Button>
          </div>
        </div>

        <div className="text-center mt-4 text-sm text-gray-600">
          <p className="flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              💳 Cancel anytime
            </span>
            <span className="flex items-center gap-1">
              🔒 Secure payment via Stripe
            </span>
            <span className="flex items-center gap-1">
              ✅ Start creating instantly
            </span>
          </p>
          <p className="mt-2 text-xs text-purple-600 font-medium">
            ⚡ Join {stats.usersJoinedToday} creators who upgraded today
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
