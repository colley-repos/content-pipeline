# Social Media Integration Summary

## ✅ Completed Features

### 1. Dashboard Redesign
- **Main Dashboard** → Now shows **Analytics/Stats** (NOT text boxes)
- **Content Library Tab** → Grid view of generated videos ready for publishing
- **Create Tab** → Moved content generation tools here
- Default view is **Analytics Dashboard** with engagement metrics

### 2. Database Schema
- ✅ **SocialAccount Model** - Stores OAuth tokens for TikTok/Instagram
  - Fields: platform, accessToken, refreshToken, tokenExpiresAt, scopes, metadata, isActive
  - Tracks: follower counts, platform user IDs, connection status
  
- ✅ **Publication Model** - Tracks published content across platforms
  - Fields: contentId, socialAccountId, platform, platformPostId, views, likes, comments, shares, status
  - Status options: 'pending', 'published', 'failed'
  
- ✅ **Migration Applied**: `20260112085436_add_social_media_integration`

### 3. OAuth Integration
Created OAuth flows for both platforms:

#### TikTok OAuth
- `/api/social/connect/tiktok` - Initiates OAuth with TikTok
- `/api/social/callback/tiktok` - Handles OAuth callback, exchanges code for tokens
- Scopes: `user.info.basic`, `video.list`, `video.upload`
- Stores: access_token, refresh_token, open_id, follower_count

#### Instagram OAuth  
- `/api/social/connect/instagram` - Initiates OAuth with Instagram/Facebook
- `/api/social/callback/instagram` - Handles OAuth callback
- Scopes: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
- Exchanges short-lived token → long-lived token (60 days)
- Retrieves Instagram Business Account ID

### 4. Publishing System
- `/api/content/publish` - Multi-platform publishing endpoint
  - Accepts: contentId, platforms[], caption
  - Publishes to TikTok (Content Posting API)
  - Publishes to Instagram (Reels via Graph API)
  - Creates Publication records for each platform
  - Returns success/failure status per platform

### 5. Analytics Dashboard
- `/api/dashboard/stats` - Aggregates engagement metrics
  - Returns: totalViews, totalLikes, totalComments, totalFollowers
  - Calculates engagementRate ((likes + comments) / views × 100)
  - Platform breakdown (TikTok vs Instagram stats)
  - Top 5 performing content

- `<AnalyticsDashboard />` Component
  - Overview cards (Views, Engagement Rate, Likes, Followers)
  - Platform-specific stats (TikTok/Instagram)
  - Top performing content leaderboard
  - CTAs to connect platforms when not connected

### 6. Content Library
- `/api/content/library` - Fetches user's content with publication status
  - Filter options: 'all', 'ready', 'published'
  - Returns engagement metrics per platform
  - Shows which platforms content is published to

- `<ContentLibrary />` Component
  - Video grid with thumbnails
  - Filter tabs (All/Ready to Publish/Published)
  - Engagement stats for published content
  - Publish button opens multi-platform dialog

### 7. UI Components
- `<PublishDialog />` - Multi-platform publishing modal
  - Platform selection (TikTok/Instagram checkboxes)
  - Caption editing
  - OAuth connection buttons for unconnected platforms
  - Publishing status per platform
  
- Tab Navigation
  - Analytics (default) - Stats dashboard
  - Library - Content management
  - Create - Content generation

## 📝 Configuration Required

### Environment Variables
Add to Vercel/local `.env`:

```env
# TikTok API Credentials
# Get from: https://developers.tiktok.com
TIKTOK_CLIENT_ID="your-tiktok-client-id"
TIKTOK_CLIENT_SECRET="your-tiktok-client-secret"

# Instagram API Credentials  
# Get from: https://developers.facebook.com
INSTAGRAM_CLIENT_ID="your-instagram-app-id"
INSTAGRAM_CLIENT_SECRET="your-instagram-app-secret"
```

### API Credentials Setup

#### TikTok
1. Go to https://developers.tiktok.com
2. Create new app
3. Enable "Content Posting API"
4. Add redirect URI: `https://your-domain.com/api/social/callback/tiktok`
5. Copy Client Key → TIKTOK_CLIENT_ID
6. Copy Client Secret → TIKTOK_CLIENT_SECRET

#### Instagram
1. Go to https://developers.facebook.com
2. Create new app
3. Add "Instagram Graph API" product
4. Configure OAuth redirect: `https://your-domain.com/api/social/callback/instagram`
5. Copy App ID → INSTAGRAM_CLIENT_ID
6. Copy App Secret → INSTAGRAM_CLIENT_SECRET
7. Note: Users must have Instagram Business Account linked to Facebook Page

## 🚀 How It Works

### User Journey
1. **Generate Content** (Create Tab)
   - User creates video content using AI generation
   - Content saved to database

2. **Review Content** (Library Tab)
   - User sees all generated videos in grid
   - Filter by publication status
   - Select content to publish

3. **Connect Platforms** (First Time)
   - Click "Connect TikTok" or "Connect Instagram"
   - OAuth flow opens in new window
   - Returns to dashboard with connected status

4. **Publish Content** (Library Tab)
   - Click "Publish" on content
   - Select platforms (TikTok/Instagram)
   - Edit caption
   - Click "Publish to Selected Platforms"
   - System publishes simultaneously to both platforms

5. **Track Performance** (Analytics Tab - Default View)
   - View total engagement (views, likes, comments)
   - See engagement rate
   - Compare TikTok vs Instagram performance
   - Identify top performing content

### Publishing Flow
```
Content → Select Platforms → Edit Caption → Publish
   ↓              ↓               ↓            ↓
 Get Video → Check OAuth → Update Text → Upload to APIs
               Token           ↓              ↓
                          Save Caption   Create Publication
                                         Record Status
```

### Analytics Flow
```
Every N hours (Background Job - TODO)
   ↓
Fetch Engagement from TikTok API (views, likes, comments)
   ↓
Fetch Engagement from Instagram API (views, likes, comments)
   ↓
Update Publication Records
   ↓
Dashboard Displays Updated Stats
```

## 📋 Pending Tasks

### High Priority
1. **Get API Credentials**
   - Apply for TikTok developer account
   - Create Facebook/Instagram app
   - Add credentials to Vercel environment variables

2. **Build Analytics Sync Job**
   - Create `/api/cron/sync-analytics` endpoint
   - Fetch metrics from TikTok API (Query Video List)
   - Fetch metrics from Instagram API (Media Insights)
   - Update Publication records with latest engagement
   - Schedule with Vercel Cron (every 6-12 hours)

3. **Video Generation Integration**
   - Replace OpenAI placeholder with ITX-2 integration
   - Save actual video file URL
   - Generate thumbnails
   - Update Content model with videoUrl field

### Medium Priority
4. **Token Refresh Logic**
   - Implement automatic token refresh before expiry
   - Instagram: Exchange long-lived token for new one
   - TikTok: Use refresh_token to get new access_token

5. **Error Handling**
   - Retry failed publications
   - Handle expired tokens gracefully
   - Show user-friendly error messages

6. **Content Scheduling**
   - Allow users to schedule posts for future
   - Implement job queue for scheduled posts

### Low Priority
7. **Additional Features**
   - Post editing (update caption after publish)
   - Content calendar view
   - Hashtag suggestions
   - Best time to post recommendations

## 🔧 Technical Notes

### Authentication
- Uses NextAuth session for user authentication
- OAuth tokens stored securely in database (encrypted in production)
- Scopes grant permissions for posting and reading engagement

### API Limits
- **TikTok**: Check rate limits in developer docs
- **Instagram**: 25 API calls per user per hour (Graph API)

### Content Model Changes
- Changed from `tokensUsed` (OpenAI) → `computeSeconds` (GPU tracking)
- Cost tracking now uses GPU hourly rates instead of token pricing
- `output` field currently used as video URL placeholder

### Build Status
✅ **Build Successful** (with warnings about console.log statements - safe to ignore)

## 🎯 Next Steps

1. **Deploy to Vercel** (push changes)
2. **Add environment variables** (TikTok/Instagram credentials)
3. **Test OAuth flows** (connect accounts)
4. **Implement analytics sync** (background job)
5. **Integrate real video generation** (ITX-2 model)

---

## Files Created/Modified

### New API Routes
- `src/app/api/social/connect/tiktok/route.ts`
- `src/app/api/social/connect/instagram/route.ts`
- `src/app/api/social/callback/tiktok/route.ts`
- `src/app/api/social/callback/instagram/route.ts`
- `src/app/api/content/publish/route.ts`
- `src/app/api/content/library/route.ts`
- `src/app/api/dashboard/stats/route.ts`

### New Components
- `src/components/dashboard/analytics-dashboard.tsx`
- `src/components/dashboard/content-library.tsx`
- `src/components/dashboard/publish-dialog.tsx`
- `src/components/ui/checkbox.tsx`

### Modified Files
- `src/app/dashboard/page.tsx` - Added tab navigation, Analytics as default
- `prisma/schema.prisma` - Added SocialAccount and Publication models
- `.env` - Added social media API credential placeholders

### Database Migrations
- `migrations/20260112085436_add_social_media_integration/`
