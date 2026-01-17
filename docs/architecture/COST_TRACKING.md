# Cost Tracking & Analysis System

## Overview
Automated system to track **GPU compute costs** for video generation vs subscription revenue to ensure profitability. Runs nightly to prevent financial losses.

**Important**: This system tracks **video generation costs** (GPU compute time), NOT text generation. We use open source models for text and ITX-2 for video generation.

## Business Model

### What We're Tracking:
- **GPU compute hours** (cloud or self-hosted)
- **Video generation time** (ITX-2 model inference)
- **Cost per video** generated
- **Multiple cloud providers** (RunPod, Vast.ai, Lambda Labs, self-hosted)

### What We're NOT Tracking:
- ❌ OpenAI API costs (we use open source text models)
- ❌ Token usage (irrelevant for video generation)

### Revenue:
- Creator: $29/month (30 minutes of content)
- Pro Creator: $290/year = $24.17/month (60 minutes of content)

## What Was Implemented

### 1. GPU Compute Time & Cost Tracking
**Files**: `src/lib/cost-tracking.ts`, `src/app/api/content/generate/route.ts`

- Tracks GPU compute time in seconds for each video generation
- Calculates cost based on GPU provider hourly rates
- Supports multiple providers:
  - RunPod RTX 4090: $0.69/hour
  - Vast.ai RTX 4090: $0.50/hour (spot)
  - Lambda Labs RTX 4090: $1.10/hour
  - Self-hosted RTX 3090: $0.15/hour (electricity estimate)
  - Self-hosted RTX 4090: $0.20/hour (electricity estimate)
  - Default: $0.60/hour (average)
- Saves `computeSeconds`, `gpuProvider`, and `costUsd` to each Content record
- Database schema updated via migration `20260111102646_switch_to_gpu_compute_tracking`

**Flexible Cost Tracking:**
Since your GPU costs will be highly variable (different models, different providers, different hardware), the system allows:
- Setting custom hourly rates via `customRate` parameter
- Switching providers on-the-fly
- Tracking which provider was used per generation
- Easily updating provider rates in `GPU_PRICING` constant

### 2. Cost Calculation Utilities
**File**: `src/lib/cost-tracking.ts`

Functions:
- `calculateGenerationCost(computeSeconds, provider, customRate?)` - Converts GPU seconds to USD
  - Takes compute time in seconds
  - Uses provider-specific hourly rate (or custom rate)
  - Returns cost in USD
- `calculateProfitability(revenue, costs, ...)` - Computes profit margin, net profit, status
- `shouldAlert(metrics)` - Detects dangerous cost levels (<60% margin)
- `calculateSafeGenerationLimits(avgCost)` - Recommends safe daily/monthly video limits
- `formatCurrency()`, `formatPercentage()` - Display helpers

Constants:
- `GPU_PRICING` - Hourly rates for various cloud providers and self-hosted GPUs
- `PROFIT_TARGETS` - Target 75%, Minimum 60%, Warning 50%

**Easy to Update:**
Just edit `GPU_PRICING` in `cost-tracking.ts` when you switch providers or find cheaper options.

### 3. Cost Analysis Service
**File**: `src/lib/cost-analysis.ts`

Functions:
- `runCostAnalysis(startDate, endDate)` - Analyze specific date range
- `runDailyCostAnalysis()` - Analyze yesterday (for nightly cron)
- `getLatestCostReport()` - Fetch most recent report
- `getCostTrends(days)` - Get historical trend data

Features:
- Aggregates content costs from `Content.costUsd`
- Calculates revenue from active subscriptions
- Generates profitability metrics and alerts
- Stores daily reports in `CostReport` table
- Recommends safe generation limits

### 4. API Endpoints

**Admin Cost Reports** - `src/app/api/admin/cost-reports/route.ts`
- `GET /api/admin/cost-reports` - View latest report
- `GET /api/admin/cost-reports?action=trends&days=30` - View 30-day trends
- `POST /api/admin/cost-reports` - Trigger manual analysis
- Requires admin email in `ADMIN_EMAILS` env var

**Cron Job** - `src/app/api/cron/cost-analysis/route.ts`
- `GET /api/cron/cost-analysis` - Nightly analysis endpoint
- Protected by `CRON_SECRET` (Bearer token)
- Runs at 2 AM UTC daily via Vercel Cron

### 5. Admin Dashboard
**File**: `src/app/admin/costs/page.tsx`

Features:
- View latest profitability report
- Key metrics cards:
  - Total Revenue (from active subscriptions)
  - Total Cost (from OpenAI usage)
  - Net Profit (revenue - cost)
  - Profit Margin % with health indicator
- 30-day trend chart
- Critical alerts section
- Safe generation limit recommendations
- Manual analysis trigger button

### 6. Database Schema Changes
**Migration**: `prisma/migrations/20260111102646_switch_to_gpu_compute_tracking/migration.sql`

**Content Model** - Updated:
- ~~`tokensUsed`~~ → **Removed** (not needed for video generation)
- `computeSeconds` Int - GPU compute time in seconds
- `gpuProvider` String - Which provider/hardware was used
- `costUsd` Float - Actual cost in USD
- Index on `costUsd` for fast queries
- Index on `gpuProvider` for per-provider analysis

**CostReport Model** - No changes needed:
- Still tracks daily profitability
- Works with any cost source (GPU, API, etc.)
- Stores alerts and recommendations

### 7. Vercel Cron Configuration
**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/cost-analysis",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Runs daily at 2:00 AM UTC to analyze previous day's costs vs revenue.

## Profit Margin Targets

| Status | Profit Margin | Description |
|--------|--------------|-------------|
| **Healthy** | ≥75% | Target profit margin - business is thriving |
| **Acceptable** | 60-74% | Minimum acceptable margin - sustainable |
| **Warning** | 50-59% | Low margin - requires attention |
| **Critical** | <50% | Dangerous - immediate action required |

## Alert Conditions

The system generates alerts when:
1. **Profit margin drops below 60%** (minimum threshold)
2. **Net profit becomes negative** (losing money)
3. **Break-even generations < 50** (not sustainable)

Alerts include:
- Severity level (warning/critical)
- Specific reasons for alert
- Recommended actions
- Safe generation limits

## Environment Variables

Added to Vercel production environment:

```bash
# Secret for protecting cron endpoint
CRON_SECRET="[auto-generated-32-char-secret]"

# Comma-separated list of admin emails
ADMIN_EMAILS="your-admin-email@gmail.com"
```

## How It Works

### Daily Flow:
1. **2:00 AM UTC**: Vercel Cron triggers `/api/cron/cost-analysis`
2. **Analysis Runs**: `runDailyCostAnalysis()` analyzes yesterday's data
3. **Metrics Calculated**:
   - Sum all `Content.costUsd` from yesterday
   - Count active subscriptions
   - Calculate monthly revenue (Creator: $29, Pro: $24.17)
   - Compute profit margin: `(revenue - cost) / revenue`
4. **Alert Check**: If margin < 60%, generate alert
5. **Report Saved**: Store in `CostReport` table
6. **Logging**: Results logged to Vercel console

### Per-Generation Tracking:
1. User requests content generation
2. OpenAI API returns token usage
3. `calculateGenerationCost()` converts to USD
4. Saved to `Content.tokensUsed` and `Content.costUsd`
5. Included in next nightly analysis

## Usage Examples

### View Latest Report (Admin Dashboard)
Visit: `https://content-pipeline-ten.vercel.app/admin/costs`

Requires:
- Your email must be in `ADMIN_EMAILS` environment variable
- Must be logged in

### Manual Analysis Trigger
Click "Run Analysis" button on admin dashboard, or:

```bash
curl -X POST https://content-pipeline-ten.vercel.app/api/admin/cost-reports \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### View Trends
GET `/api/admin/cost-reports?action=trends&days=30`

Returns last 30 days of cost reports with profit margins.

## Safe Generation Limits

The system calculates safe limits to maintain 75% target profit margin:

**Formula**:
```
Safe Generations = (Monthly Revenue * 0.75) / Avg Cost Per Generation
```

Example:
- Creator plan: $29/month
- Target profit: 75% ($21.75)
- Avg cost: $0.10/generation
- **Safe limit**: 217 generations/month (7/day)

Recommendations update automatically based on actual costs.

## Next Steps

### 1. Update Admin Email
```bash
# Via Vercel CLI
vercel env add ADMIN_EMAILS production
# Enter: your-real-email@example.com

# Or via Vercel Dashboard:
# Settings > Environment Variables > Edit ADMIN_EMAILS
```

### 2. Verify Cron Job
- Check Vercel Dashboard > Deployments > Cron Jobs
- Should show `/api/cron/cost-analysis` scheduled at "0 2 * * *"
- First run will be 2 AM UTC after deployment

### 3. Access Admin Dashboard
1. Navigate to `/admin/costs`
2. Login with your admin email
3. View latest profitability metrics
4. Check for any alerts

### 4. Monitor First Report
After first nightly run (2 AM UTC):
- Check Vercel logs for "✅ Nightly cost analysis completed"
- View report in admin dashboard
- Review profit margin vs targets
- Adjust limits if needed

## Technical Details

### OpenAI Pricing (GPT-4 Turbo)
```typescript
{
  gpt4_turbo: {
    input: 0.00001,   // $0.01 per 1K tokens
    output: 0.00003,  // $0.03 per 1K tokens
  }
}
```

### Cost Calculation Example
```typescript
Input tokens: 500
Output tokens: 200

Cost = (500 * $0.00001) + (200 * $0.00003)
     = $0.005 + $0.006
     = $0.011 (1.1 cents per generation)
```

### Revenue Calculation
```typescript
Creator Plan: $29/month ÷ 30 days = $0.97/day
Pro Plan: $290/year ÷ 365 days = $0.79/day

Monthly revenue = (creator_count * $29) + (pro_count * $24.17)
```

### Profit Margin Formula
```typescript
profitMargin = (totalRevenue - totalCost) / totalRevenue

Example:
Revenue: $1000
Cost: $200
Margin: ($1000 - $200) / $1000 = 0.80 = 80% ✅ Healthy
```

## Troubleshooting

### Admin Dashboard Access Denied
- **Error**: "Admin access required"
- **Fix**: Add your email to `ADMIN_EMAILS` env var in Vercel
- **Verify**: `echo $ADMIN_EMAILS` should include your email

### Cron Job Not Running
- **Check**: Vercel Dashboard > Cron Jobs
- **Verify**: `vercel.json` is committed to repo
- **Logs**: Check Vercel Logs for cron execution at 2 AM UTC
- **Manual Trigger**: POST `/api/admin/cost-reports` from admin dashboard

### No Cost Data Showing
- **Cause**: OpenAI API key might be placeholder
- **Check**: Verify real OpenAI key is set in Vercel env vars
- **Alternative**: Generate test content to populate tokensUsed/costUsd fields

### Negative Profit Alert
- **Meaning**: Costs exceed revenue (losing money)
- **Actions**:
  1. Review `averageCostPerGen` in report
  2. Check if using expensive OpenAI model (GPT-4)
  3. Consider increasing subscription prices
  4. Implement stricter usage limits
  5. Reduce token usage (shorter prompts/responses)

## Files Modified/Created

### New Files
- `src/lib/cost-tracking.ts` - Cost calculation utilities
- `src/lib/cost-analysis.ts` - Analysis service
- `src/app/api/admin/cost-reports/route.ts` - Admin API
- `src/app/api/cron/cost-analysis/route.ts` - Cron endpoint
- `src/app/admin/costs/page.tsx` - Admin dashboard UI
- `src/components/ui/alert.tsx` - Alert component
- `src/components/ui/badge.tsx` - Badge component
- `vercel.json` - Cron configuration
- `COST_TRACKING.md` - This documentation

### Modified Files
- `src/lib/openai.ts` - Return token usage
- `src/app/api/content/generate/route.ts` - Track costs
- `prisma/schema.prisma` - Added tokensUsed, costUsd, CostReport
- `.env` - Added CRON_SECRET, ADMIN_EMAILS

### Database Migrations
- `20260111100224_add_cost_tracking` - Applied to production

## Summary

✅ **Token usage tracked** per generation (input/output tokens)
✅ **Cost calculated** using OpenAI pricing ($0.01/$0.03 per 1K tokens)
✅ **Nightly profitability reports** (2 AM UTC via Vercel Cron)
✅ **Alert system** when profit margins drop below 60%
✅ **Safe generation limits** recommended dynamically
✅ **Admin dashboard** at `/admin/costs` for monitoring
✅ **Profit margin targets**: 75% healthy, 60% minimum, <50% critical

The system will now automatically track every generation's cost and compare against subscription revenue to ensure you stay profitable and never get "ripped off" by AI costs exceeding your subscription income!
