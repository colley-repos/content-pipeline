# Video Editing & User Preferences System

## Overview
Native video editing system with AI-powered "vibe" presets that learn from user preferences to auto-generate editing features based on creator type and style.

## ✅ Completed Features

### 1. User Profile System
Track user preferences and creator identity for personalized recommendations.

#### Database Schema
- **UserProfile Model**
  - `creatorType`: food, fashion, travel, cars, rave, cosplay, gaming, etc.
  - `preferredVibes`: array of favorite editing styles (energetic, chill, professional, etc.)
  - `editingStyle`: JSON storing preferred patterns (cut frequency, music volume)
  - `soundPreferences`: favorite sound effects and music genres
  - `colorGrading`: preferred color grading style

#### API Endpoints
- `GET /api/profile` - Fetch user profile
- `POST /api/profile` - Create/update profile with preferences

### 2. Creator Type Onboarding
Interactive wizard to set up user profile and preferences.

#### Component: `<OnboardingWizard />`
**Step 1: Creator Type Selection**
- 12 creator categories with icons:
  - Food & Cooking 🍽️
  - Fashion & Style 👗
  - Travel & Adventure ✈️
  - Cars & Automotive 🚗
  - Music & Dance 🎵
  - Cosplay & Anime 🎭
  - Photography 📷
  - Fitness & Health 💪
  - Education & Learning 📚
  - Art & Design 🎨
  - Gaming 🎮
  - Lifestyle & Wellness ❤️

**Step 2: Vibe Selection**
- Pre-selects recommended vibes based on creator type
- User can customize selections
- Vibe descriptions:
  - **Energetic** ⚡ - Fast-paced with quick cuts and upbeat music
  - **Chill** 😌 - Relaxed vibe with smooth transitions
  - **Professional** 💼 - Clean, polished, business-focused
  - **Funny** 😂 - Comedic timing with playful effects
  - **Dramatic** 🎭 - Bold effects and emotional music
  - **Motivational** 💪 - Inspiring music and powerful messaging

### 3. Editing Presets (Vibe Templates)
Pre-configured editing templates that apply consistent styles.

#### Database Schema
- **EditingPreset Model**
  - `name`: Preset name (unique)
  - `vibeCategory`: energetic, chill, professional, funny, dramatic
  - `creatorTypes`: which creator types this vibe suits
  - `jumpCutFrequency`: cuts per minute (0-20)
  - `transitionStyle`: fade, cut, zoom, slide
  - `musicTempo`: upbeat, medium, slow
  - `soundEffects`: array of sound effect IDs
  - `colorFilter`: filter/grading preset name
  - `textStyle`: caption styling (JSON)
  - `usageCount`: tracking popularity

#### Default Presets (Seeded)
1. **Energetic** - 10 cuts/min, upbeat music, vibrant colors
2. **Chill Vibes** - 2 cuts/min, slow music, warm colors
3. **Professional** - 3 cuts/min, medium music, neutral colors
4. **Funny** - 12 cuts/min, upbeat music, saturated colors
5. **Dramatic** - 4 cuts/min, slow music, cinematic colors

#### API Endpoints
- `GET /api/editing/presets` - List all public presets
- `GET /api/editing/presets/[id]` - Get preset details
- `POST /api/editing/presets` - Create custom preset

### 4. Video Editor Interface
Interactive timeline editor for applying editing features.

#### Component: `<VideoEditor />`
**Features:**
- Video preview with playback controls
- Visual timeline with edit markers
- Vibe preset selection (one-click apply)
- Manual controls:
  - Jump cuts (add at specific timestamps)
  - Voice-over overlays
  - Sound effects
  - Music volume control
- Real-time edit operation display
- Processing status tracking

**Edit Operations:**
- `jumpcut` - Trim/splice at timestamp
- `voiceover` - Add audio track overlay
- `soundfx` - Add sound effect at timestamp
- `transition` - Apply transition effect

### 5. Video Processing System
Backend infrastructure for applying edits to videos.

#### Database Schema
- **VideoEdit Model**
  - `contentId`: reference to original content
  - `userId`: owner
  - `presetId`: which preset was used (if any)
  - `status`: draft, processing, completed, failed
  - `originalVideoUrl`: source video
  - `editedVideoUrl`: processed output
  - `editOperations`: JSON array of all edits
  - `renderProgress`: 0-100%
  - `processingTime`: seconds taken to render
  - `approved`: user approved this edit

#### API Endpoints
- `POST /api/editing/process` - Queue video for processing
  - Accepts: contentId, videoUrl, presetId, operations[], settings
  - Returns: editId, status
  - Background: Queues job for video processing worker

- `GET /api/editing/process?editId=xxx` - Check processing status
  - Returns: edit details, progress, URLs

**Processing Flow:**
```
1. User selects vibe or adds manual edits
2. Frontend sends operations to /api/editing/process
3. Server creates VideoEdit record (status: processing)
4. Job queued to video processing worker
5. Worker uses FFmpeg to:
   - Apply jump cuts (trim/splice)
   - Overlay voice-overs
   - Add sound effects
   - Apply transitions
   - Add music tracks
6. Upload processed video to storage
7. Update VideoEdit record (status: completed, editedVideoUrl)
8. Notify user (email/push notification)
```

### 6. Preference Learning System
Track user editing behavior to improve recommendations.

#### Database Schema
- **EditingHistory Model**
  - `userId`: user who performed action
  - `videoEditId`: which edit
  - `action`: preset_applied, manual_edit, approved, rejected
  - `presetUsed`: preset name
  - `manualAdjustments`: what they changed from preset
  - `approved`: did they approve this style?
  - `timestamp`: when action occurred

**Learning Algorithm (Future):**
```
1. Track which presets user applies most
2. Track which manual adjustments they make after applying preset
3. Identify patterns:
   - Always increase music volume?
   - Prefer fewer jump cuts?
   - Like specific sound effects?
4. Update UserProfile.editingStyle with learned patterns
5. Use patterns to:
   - Recommend presets
   - Auto-adjust preset settings
   - Suggest sound effects
   - Pre-fill editing parameters
```

### 7. Sound Asset Library (Schema Ready)
Database structure for royalty-free audio.

#### Database Schema
- **SoundAsset Model**
  - `name`: asset name
  - `category`: music, sound_effect, voice_over
  - `vibe`: array (energetic, chill, funny, etc.)
  - `fileUrl`: audio file location
  - `duration`: seconds
  - `waveformUrl`: visual preview
  - `tags`: searchable keywords
  - `bpm`: beats per minute (music only)
  - `isRoyaltyFree`: licensing flag
  - `usageCount`: popularity tracking

**TODO: Implementation**
- Integrate royalty-free music library (Epidemic Sound, Artlist, etc.)
- Build sound effect collection
- Create audio search/browse interface
- Implement audio preview player

### 8. Analytics Sync Background Job
Periodically fetch engagement metrics from social platforms.

#### API Endpoint
- `GET /api/cron/sync-analytics` - Cron job endpoint
  - Requires: Authorization header with CRON_SECRET
  - Fetches metrics from TikTok and Instagram APIs
  - Updates Publication records with latest engagement

**TikTok Sync:**
- Uses Query Video List API
- Fetches view_count, like_count, comment_count, share_count
- Updates all publications with matching platformPostId

**Instagram Sync:**
- Uses Media Insights API
- Fetches impressions, likes, comments, shares
- Updates publications individually

**Cron Schedule (TODO):**
- Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync-analytics",
    "schedule": "0 */6 * * *"
  }]
}
```

## 🎯 User Experience Flow

### First-Time User Journey
1. **Sign up** → Account created
2. **Onboarding Wizard** appears
   - Select creator type (e.g., "Food & Cooking")
   - System recommends vibes (Energetic, Chill)
   - User confirms or customizes
3. **Profile saved** with preferences
4. **Dashboard loads** with analytics tab
5. **Create content** in Create tab
6. **Edit video** in Library tab:
   - Click "Edit" on generated video
   - Video editor opens
   - Select "Energetic" vibe
   - System auto-applies:
     - 10 jump cuts per minute
     - Upbeat background music
     - Vibrant color filter
   - User reviews on timeline
   - Make manual adjustments (optional)
   - Click "Apply Edits"
7. **Processing** (30-60 seconds)
8. **Preview edited video**
9. **Approve and publish** to TikTok/Instagram
10. **Track performance** on Analytics dashboard

### Returning User Journey
1. **Login** → Dashboard (analytics view)
2. **Create tab** → Generate new video
3. **Editor automatically suggests**:
   - Vibe based on past approvals
   - Pre-filled settings from learned preferences
   - Sound effects they've used before
4. **One-click apply** → Process → Publish
5. **System learns** from approval/rejection

## 📊 Data Models Overview

```
User
├── UserProfile (1:1)
│   └── Tracks: creator type, vibes, preferences
├── VideoEdits (1:Many)
│   ├── Original content reference
│   ├── Applied preset
│   ├── Edit operations
│   └── Processing status
└── EditingHistory (1:Many)
    └── Tracks: actions, approvals, patterns

Content (AI-generated videos)
└── VideoEdits (1:Many)
    └── Different edits of same content

EditingPreset (Vibe templates)
├── Vibe category
├── Suitable creator types
├── Default settings
└── VideoEdits (1:Many - usage tracking)

SoundAsset (Audio library)
├── Category (music/sfx/voiceover)
├── Vibe tags
└── Licensing info
```

## 🔧 Technical Implementation

### Video Processing (TODO: Production Setup)

**Current State:** Simulated processing (demo)
- Creates VideoEdit record
- Sets status to "processing"
- Simulates 5-second processing
- Returns placeholder edited video URL

**Production Implementation:**

#### Option 1: AWS Lambda + FFmpeg Layer
```javascript
// Lambda function
exports.handler = async (event) => {
  const { editId, videoUrl, operations, settings } = event
  
  // Download video from S3
  const inputPath = await downloadVideo(videoUrl)
  
  // Build FFmpeg command based on operations
  const ffmpegCmd = buildFFmpegCommand(operations, settings)
  
  // Process video
  const outputPath = await execFFmpeg(ffmpegCmd, inputPath)
  
  // Upload to S3
  const editedUrl = await uploadVideo(outputPath)
  
  // Update database
  await updateVideoEdit(editId, {
    status: 'completed',
    editedVideoUrl: editedUrl,
    processingTime: Date.now() - startTime
  })
}
```

#### Option 2: Cloudflare Workers + Stream
- Upload videos to Cloudflare Stream
- Use Stream's video editing API
- Process edits server-side
- Return processed video URL

#### Option 3: Third-Party Service
- Shotstack API (video editing as a service)
- Mux (video infrastructure)
- AWS Elastic Transcoder

### FFmpeg Command Examples

**Jump Cuts:**
```bash
# Cut segments from video
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]trim=0:5,setpts=PTS-STARTPTS[v1]; \
                   [0:v]trim=7:12,setpts=PTS-STARTPTS[v2]; \
                   [v1][v2]concat=n=2:v=1[out]" \
  -map "[out]" output.mp4
```

**Voice-Over Overlay:**
```bash
# Mix voice-over with original audio
ffmpeg -i video.mp4 -i voiceover.mp3 \
  -filter_complex "[0:a]volume=0.3[a1];[1:a]adelay=2000|2000[a2];[a1][a2]amix=inputs=2" \
  -c:v copy output.mp4
```

**Sound Effects:**
```bash
# Add sound effect at specific timestamp
ffmpeg -i video.mp4 -i soundfx.mp3 \
  -filter_complex "[1:a]adelay=5000|5000[s];[0:a][s]amix=inputs=2[a]" \
  -map 0:v -map "[a]" output.mp4
```

**Background Music:**
```bash
# Add background music with volume control
ffmpeg -i video.mp4 -i music.mp3 \
  -filter_complex "[1:a]volume=0.2[music];[0:a][music]amix=inputs=2:duration=first" \
  -c:v copy output.mp4
```

## 📋 Remaining Tasks

### High Priority
1. **Implement actual video processing**
   - Set up FFmpeg Lambda function or worker
   - Integrate video storage (S3, Cloudflare R2)
   - Build job queue (BullMQ, AWS SQS)
   - Add progress tracking (websockets or polling)

2. **Build sound asset library**
   - Source royalty-free music collection
   - Create sound effect library
   - Build audio browser interface
   - Implement audio preview player

3. **Set up analytics sync cron job**
   - Add `vercel.json` with cron configuration
   - Test TikTok/Instagram API integrations
   - Handle rate limits and errors
   - Add retry logic

### Medium Priority
4. **Implement preference learning**
   - Track all editing actions in EditingHistory
   - Build ML model or rule-based system
   - Auto-adjust preset recommendations
   - Show "suggested for you" presets

5. **Add video editor features**
   - Text overlay editor
   - Color grading controls
   - Speed adjustments (slow-mo, time-lapse)
   - Filters and effects library

6. **Improve onboarding**
   - Show example videos for each vibe
   - Allow preview before applying
   - Tutorial walkthrough for first edit

### Low Priority
7. **Advanced editing**
   - Multi-track timeline
   - Keyframe animation
   - Green screen/chroma key
   - Advanced audio mixing

8. **Collaboration features**
   - Share presets with community
   - Team templates
   - Approval workflows

## 🚀 Next Steps

1. **Test current implementation:**
   ```bash
   # Create user profile
   POST /api/profile
   {
     "creatorType": "food",
     "preferredVibes": ["energetic", "chill"]
   }
   
   # Apply vibe to video
   POST /api/editing/process
   {
     "contentId": "xxx",
     "videoUrl": "https://...",
     "presetId": "energetic",
     "operations": [...],
     "settings": { "jumpCutFrequency": 10, "musicVolume": 70 }
   }
   ```

2. **Deploy to production:**
   - Push code to GitHub
   - Vercel automatically deploys
   - Run migrations on production database
   - Seed presets on production

3. **Set up video processing:**
   - Choose processing solution (Lambda/Workers/Service)
   - Implement FFmpeg video editing
   - Configure storage (S3/R2)
   - Add job queue

4. **Launch cron job:**
   - Add vercel.json cron config
   - Test analytics sync
   - Monitor for errors

---

## Files Created/Modified

### New Database Models
- `UserProfile` - User preferences and creator type
- `EditingPreset` - Vibe-based editing templates
- `VideoEdit` - Applied edits to content
- `SoundAsset` - Audio library (music/sfx)
- `EditingHistory` - Preference learning data

### New Components
- `src/components/onboarding/onboarding-wizard.tsx` - Creator type wizard
- `src/components/editor/video-editor.tsx` - Video editing interface

### New API Routes
- `src/app/api/profile/route.ts` - User profile CRUD
- `src/app/api/editing/presets/route.ts` - List/create presets
- `src/app/api/editing/presets/[id]/route.ts` - Get preset by ID
- `src/app/api/editing/process/route.ts` - Process video edits
- `src/app/api/cron/sync-analytics/route.ts` - Analytics sync job

### Seed Data
- `prisma/seed-presets.js` - Default vibe presets

### Database Migrations
- `20260112092449_add_video_editing_and_user_profiles`
- `20260112093330_make_preset_name_unique`
