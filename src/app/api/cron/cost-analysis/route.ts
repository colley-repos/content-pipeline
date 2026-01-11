import { NextResponse } from 'next/server'
import { runDailyCostAnalysis } from '@/lib/cost-analysis'

// This endpoint will be called by Vercel Cron
// Vercel automatically provides CRON_SECRET header for verification
export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Running nightly cost analysis...')

    // Run cost analysis for yesterday
    const result = await runDailyCostAnalysis()

    if (!result.success || !result.report) {
      console.error('❌ Nightly cost analysis failed:', result.error)
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Cost analysis failed',
        },
        { status: 500 }
      )
    }

    console.log('✅ Nightly cost analysis completed:', {
      reportDate: result.report.reportDate,
      totalRevenue: result.report.totalRevenue,
      totalCost: result.report.totalCost,
      profitMargin: result.report.profitMargin,
      alerts: result.report.metadata?.alerts?.length || 0,
    })

    return NextResponse.json({
      success: true,
      report: {
        reportDate: result.report.reportDate,
        profitMargin: result.report.profitMargin,
        netProfit: result.report.netProfit,
        alertCount: result.report.metadata?.alerts?.length || 0,
      },
    })
  } catch (error) {
    console.error('❌ Nightly cost analysis failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cost analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
