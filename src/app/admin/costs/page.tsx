'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react'

interface CostReport {
  id: string
  reportDate: string
  totalRevenue: number
  totalCost: number
  netProfit: number
  profitMargin: number
  totalGenerations: number
  averageCostPerGen: number
  activeSubscriptions: number
  freeGenerations: number
  metadata: {
    alerts?: string[]
    recommendations?: string[]
    safeGenerationLimits?: {
      daily: number
      monthly: number
    }
  }
}

export default function CostAnalysisPage() {
  const [report, setReport] = useState<CostReport | null>(null)
  const [trends, setTrends] = useState<CostReport[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLatestReport()
    fetchTrends()
  }, [])

  const fetchLatestReport = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/cost-reports')
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Admin access required')
        }
        throw new Error('Failed to fetch cost reports')
      }

      const data = await response.json()
      setReport(data.latestReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cost reports')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrends = async () => {
    try {
      const response = await fetch('/api/admin/cost-reports?action=trends&days=30')
      
      if (!response.ok) return

      const data = await response.json()
      setTrends(data.trends || [])
    } catch (err) {
      console.error('Failed to fetch trends:', err)
    }
  }

  const runAnalysis = async () => {
    try {
      setAnalyzing(true)
      const response = await fetch('/api/admin/cost-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error('Failed to run cost analysis')
      }

      const data = await response.json()
      setReport(data.report)
      await fetchTrends()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run analysis')
    } finally {
      setAnalyzing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 0.75) return 'text-green-600'
    if (margin >= 0.60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProfitMarginBadge = (margin: number) => {
    if (margin >= 0.75) return <Badge className="bg-green-600">Healthy</Badge>
    if (margin >= 0.60) return <Badge className="bg-yellow-600">Acceptable</Badge>
    return <Badge className="bg-red-600">Critical</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cost Analysis Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor AI generation costs vs subscription revenue
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={analyzing}>
          {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Run Analysis
        </Button>
      </div>

      {!report ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No cost reports available yet. Run your first analysis.
            </p>
            <Button onClick={runAnalysis} disabled={analyzing}>
              {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run First Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Alerts */}
          {report.metadata.alerts && report.metadata.alerts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Alerts</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {report.metadata.alerts.map((alert, i) => (
                    <li key={i}>{alert}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(report.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  From {report.activeSubscriptions} active subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(report.totalCost)}</div>
                <p className="text-xs text-muted-foreground">
                  {report.totalGenerations} generations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(report.netProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(report.averageCostPerGen)} avg per generation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                {getProfitMarginBadge(report.profitMargin)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getProfitMarginColor(report.profitMargin)}`}>
                  {formatPercentage(report.profitMargin)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: 75% | Min: 60%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Report Details</CardTitle>
                <CardDescription>
                  Generated on {new Date(report.reportDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Generations:</span>
                  <span className="font-medium">{report.totalGenerations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Free Generations:</span>
                  <span className="font-medium">{report.freeGenerations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Subscriptions:</span>
                  <span className="font-medium">{report.activeSubscriptions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Cost/Generation:</span>
                  <span className="font-medium">{formatCurrency(report.averageCostPerGen)}</span>
                </div>
              </CardContent>
            </Card>

            {report.metadata.recommendations && report.metadata.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>Actions to improve profitability</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {report.metadata.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Safe Limits */}
          {report.metadata.safeGenerationLimits && (
            <Card>
              <CardHeader>
                <CardTitle>Safe Generation Limits</CardTitle>
                <CardDescription>
                  Recommended limits to maintain 75% profit margin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Safe Limit:</span>
                  <span className="font-medium">
                    {report.metadata.safeGenerationLimits.daily} generations/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Safe Limit:</span>
                  <span className="font-medium">
                    {report.metadata.safeGenerationLimits.monthly} generations/month
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trends */}
          {trends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>30-Day Trends</CardTitle>
                <CardDescription>Historical profit margin analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trends.slice(0, 10).map((trend) => (
                    <div key={trend.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm">
                        {new Date(trend.reportDate).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(trend.totalRevenue)} / {formatCurrency(trend.totalCost)}
                        </span>
                        <span className={`font-medium ${getProfitMarginColor(trend.profitMargin)}`}>
                          {formatPercentage(trend.profitMargin)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
