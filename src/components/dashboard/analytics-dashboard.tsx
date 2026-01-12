'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  TrendingUp, 
  Heart, 
  Eye,
  Users,
  Video,
  ArrowUpRight,
  AlertCircle,
  Sparkles
} from 'lucide-react'

interface DashboardStats {
  totalViews: number
  totalLikes: number
  totalComments: number
  totalFollowers: number
  engagementRate: number
  contentCount: number
  platformStats: {
    tiktok?: {
      connected: boolean
      views: number
      likes: number
      followers: number
    }
    instagram?: {
      connected: boolean
      views: number
      likes: number
      followers: number
    }
  }
  topContent: Array<{
    id: string
    output: string
    views: number
    likes: number
    platform: string
  }>
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const hasConnectedPlatforms = stats?.platformStats.tiktok?.connected || stats?.platformStats.instagram?.connected

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Track your content performance across platforms
        </p>
      </div>

      {/* Platform Connection CTAs */}
      {!hasConnectedPlatforms && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Connect your social media accounts</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>Start publishing and tracking your AI-generated content performance</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm">
                📱 Connect TikTok
              </Button>
              <Button size="sm" variant="outline">
                📷 Connect Instagram
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!stats?.platformStats.tiktok?.connected && hasConnectedPlatforms && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>TikTok not connected</AlertTitle>
          <AlertDescription className="mt-2">
            <Button size="sm">📱 Connect TikTok</Button>
          </AlertDescription>
        </Alert>
      )}

      {!stats?.platformStats.instagram?.connected && hasConnectedPlatforms && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Instagram not connected</AlertTitle>
          <AlertDescription className="mt-2">
            <Button size="sm">📷 Connect Instagram</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalViews || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.engagementRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Likes + Comments / Views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalLikes || 0)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats?.contentCount || 0} videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalFollowers || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Combined audience
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      {hasConnectedPlatforms && (
        <div className="grid gap-4 md:grid-cols-2">
          {stats?.platformStats.tiktok?.connected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📱</span>
                  TikTok Performance
                </CardTitle>
                <CardDescription>Your TikTok analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Views</span>
                  <span className="font-medium">{formatNumber(stats.platformStats.tiktok.views)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Likes</span>
                  <span className="font-medium">{formatNumber(stats.platformStats.tiktok.likes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Followers</span>
                  <span className="font-medium">{formatNumber(stats.platformStats.tiktok.followers)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {stats?.platformStats.instagram?.connected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📷</span>
                  Instagram Performance
                </CardTitle>
                <CardDescription>Your Instagram Reels analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Views</span>
                  <span className="font-medium">{formatNumber(stats.platformStats.instagram.views)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Likes</span>
                  <span className="font-medium">{formatNumber(stats.platformStats.instagram.likes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Followers</span>
                  <span className="font-medium">{formatNumber(stats.platformStats.instagram.followers)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Top Performing Content */}
      {stats?.topContent && stats.topContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Content
            </CardTitle>
            <CardDescription>Your best videos this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topContent.map((content, index) => (
                <div key={content.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{content.output}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {content.platform === 'tiktok' ? '📱' : '📷'} {content.platform}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(content.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatNumber(content.likes)}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {hasConnectedPlatforms && stats?.contentCount === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No published content yet</h3>
            <p className="text-muted-foreground mb-4">
              Create and publish your first video to start tracking analytics
            </p>
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Content
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
