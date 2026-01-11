import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  runDailyCostAnalysis,
  getLatestCostReport,
  getCostTrends,
} from '@/lib/cost-analysis'

// Check if user is admin (you may want to add an isAdmin field to User model)
async function isAdminUser(_userId: string): Promise<boolean> {
  // For now, check against environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  
  const session = await getServerSession(authOptions)
  const userEmail = session?.user?.email
  
  return userEmail ? adminEmails.includes(userEmail) : false
}

// GET - View cost reports and trends
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    if (!(await isAdminUser(session.user.id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'latest'
    const days = parseInt(searchParams.get('days') || '30')

    if (action === 'trends') {
      const trends = await getCostTrends(days)
      return NextResponse.json({ trends })
    }

    const latestReport = await getLatestCostReport()
    
    if (!latestReport) {
      return NextResponse.json({
        message: 'No cost reports available yet. Run your first analysis.',
        latestReport: null,
      })
    }

    return NextResponse.json({
      latestReport,
      message: 'Latest cost report retrieved successfully',
    })
  } catch (error) {
    console.error('Cost report fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost reports' },
      { status: 500 }
    )
  }
}

// POST - Trigger manual cost analysis
export async function POST(_request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    if (!(await isAdminUser(session.user.id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Run cost analysis for yesterday
    const result = await runDailyCostAnalysis()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Cost analysis failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      report: result.report,
      message: 'Cost analysis completed successfully',
    })
  } catch (error) {
    console.error('Cost analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to run cost analysis' },
      { status: 500 }
    )
  }
}
