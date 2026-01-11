'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SocialProofStats {
  totalUsers: number
  usersJoinedToday: number
}

export function CreditsDisplay() {
  const [credits, setCredits] = useState<number | null>(null)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SocialProofStats>({ totalUsers: 2847, usersJoinedToday: 23 })

  useEffect(() => {
    async function fetchStatus() {
      try {
        const [statusRes, statsRes] = await Promise.all([
          fetch('/api/user/status'),
          fetch('/api/stats/social-proof'),
        ])
        
        if (statusRes.ok) {
          const data = await statusRes.json()
          setCredits(data.freeCreditsRemaining)
          setHasSubscription(data.hasActiveSubscription)
        }
        
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error('Failed to fetch user status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  if (loading || hasSubscription) {
    return null
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">
              Free Trial: <span className="text-xl font-bold text-purple-600">{credits}</span> credits remaining
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {credits === 0 
                ? 'Upgrade to continue generating content' 
                : `Try the platform before upgrading • ${stats.totalUsers.toLocaleString()}+ creators trust us`}
            </p>
          </div>
          <Link href="/pricing">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              {credits === 0 ? 'Upgrade Now' : 'See Plans'}
            </Button>
          </Link>
        </div>
        {credits !== null && credits > 0 && (
          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-xs text-purple-700">
              ⚡ <strong>{stats.usersJoinedToday} creators</strong> upgraded today to unlock unlimited content
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
