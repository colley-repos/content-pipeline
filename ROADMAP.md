# Content Pipeline - Product Roadmap

> **Last Updated:** January 12, 2026  
> **Current Sprint:** Video Editing Platform Foundation  
> **Next Milestone:** FFmpeg Processing Pipeline

---

## 🎯 Product Vision

Transform from a simple AI video generator into a comprehensive creator platform with:
- AI-powered video generation
- Native video editing with vibe-based presets
- Social media publishing (TikTok, Instagram)
- Analytics tracking and insights
- ML-powered preference learning and recommendations

---

## ✅ Completed (Sprint 1-3)

### Foundation & Infrastructure
- [x] Vercel deployment setup with Neon PostgreSQL
- [x] GPU cost tracking system (RunPod, Vast.ai, Lambda, self-hosted)
- [x] Usage enforcement (30/60 min/month limits based on tier)
- [x] Database schema with Prisma ORM
- [x] Authentication system (NextAuth/Clerk)

### Social Media Integration (Sprint 2)
- [x] TikTok OAuth flow (`/api/social/connect/tiktok`, `/api/social/callback/tiktok`)
- [x] Instagram OAuth flow (`/api/social/connect/instagram`, `/api/social/callback/instagram`)
- [x] Multi-platform publishing API (`/api/content/publish`)
- [x] Content library API with publication status (`/api/content/library`)
- [x] Analytics dashboard component (stats-first design)
- [x] Engagement metrics sync background job (`/api/cron/sync-analytics`)
- [x] Database models: `SocialAccount`, `Publication`

### Video Editing System (Sprint 3)
- [x] Database schema for editing features:
  - `UserProfile` (creator type, preferred vibes, editing style)
  - `EditingPreset` (vibe templates with settings)
  - `VideoEdit` (edit jobs, operations, status)
  - `SoundAsset` (royalty-free audio library)
  - `EditingHistory` (ML training data)
- [x] Creator onboarding wizard (12 creator types, 6 vibes)
- [x] Video editor component with timeline UI
- [x] Vibe preset system (Energetic, Chill, Professional, Funny, Dramatic)
- [x] API endpoints: `/api/profile`, `/api/editing/presets`, `/api/editing/process`
- [x] Edit button in content library (opens VideoEditor dialog)
- [x] Vercel cron job for analytics sync (every 6 hours)

---

## 🚧 In Progress (Sprint 4)

### Priority: High - Core Functionality

#### 📌 **Task 16: Implement FFmpeg Video Processing Pipeline**
**Status:** Not Started  
**Priority:** 🔥 Critical  
**Effort:** 8-13 hours  
**Dependencies:** None

**Objective:** Replace `simulateVideoProcessing()` placeholder with actual video editing capabilities.

**Requirements:**
- Process jump cuts (trim and concatenate segments)
- Overlay voice-overs at specified timestamps
- Mix sound effects with volume control
- Apply transitions (fade, zoom, slide)
- Apply color filters/grading
- Upload processed videos to storage

**Technical Approach:**
1. **Option A: AWS Lambda + FFmpeg Layer** (Recommended)
   - Use pre-built FFmpeg Lambda layer
   - Process videos serverlessly (max 15 min execution)
   - Store in S3/Cloudflare R2
   - Trigger from `/api/editing/process`

2. **Option B: Cloudflare Workers + FFmpeg WASM**
   - Use FFmpeg.wasm for browser-side processing
   - Limited by file size and processing power
   - Good for simple edits only

3. **Option C: Dedicated Processing Server**
   - Self-hosted or cloud VM with FFmpeg installed
   - Queue system (BullMQ, AWS SQS)
   - Best for heavy processing

**Implementation Steps:**
1. Set up FFmpeg environment (Lambda/Workers/Server)
2. Create video processing worker/function
3. Implement operations:
   - `jumpcut`: Extract segments, concatenate
   - `voiceover`: Mix audio tracks
   - `soundfx`: Overlay effects at timestamps
   - `transition`: Apply effects between segments
4. Update `VideoEdit` status during processing
5. Upload to storage, update `editedVideoUrl`
6. Send completion notification

**Files to Modify:**
- `src/app/api/editing/process/route.ts` - Replace placeholder
- Create `src/lib/video-processor.ts` - FFmpeg logic
- Create `src/workers/video-processing-worker.ts` (if using queue)

**Success Criteria:**
- [ ] Videos process with all edit operations applied
- [ ] Processed videos upload to storage successfully
- [ ] Processing time logged in `VideoEdit.processingTime`
- [ ] Error handling for failed processing
- [ ] Status updates reflected in database

---

#### 📌 **Task 20: Show Onboarding Wizard to New Users**
**Status:** Not Started  
**Priority:** 🔥 High  
**Effort:** 2-3 hours  
**Dependencies:** None

**Objective:** Trigger `OnboardingWizard` on first dashboard visit to capture creator preferences.

**Requirements:**
- Check if `UserProfile` exists for current user
- If not, show modal with `OnboardingWizard` component
- Save creator type and preferred vibes to database
- Dismiss modal and allow dashboard access after completion

**Implementation Steps:**
1. Add check in `src/app/dashboard/page.tsx`
2. Fetch user profile in `useEffect`
3. Show `OnboardingWizard` modal if profile missing
4. Call `/api/profile` POST on completion
5. Update local state to hide modal

**Files to Modify:**
- `src/app/dashboard/page.tsx` - Add onboarding trigger logic

**Success Criteria:**
- [ ] New users see onboarding wizard on first dashboard visit
- [ ] Wizard saves creator type and vibes to `UserProfile`
- [ ] Dashboard loads normally after completion
- [ ] Existing users don't see wizard again

---

### Priority: Medium - Differentiation Features

#### 📌 **Task 18: Populate Sound Asset Library**
**Status:** Not Started  
**Priority:** 🔸 Medium  
**Effort:** 5-8 hours  
**Dependencies:** None

**Objective:** Build royalty-free audio library with music and sound effects.

**Requirements:**
- Source royalty-free music collection
- Create sound effect library
- Build audio browser interface
- Implement audio preview player
- Tag assets by vibe, category, BPM

**Sound Sources:**
- Free: Incompetech, Purple Planet Music, Bensound, Freesound.org, Zapsplat
- Paid: Epidemic Sound, Artlist, AudioJungle

**Implementation Steps:**
1. Download/license audio files
2. Upload to storage (S3/R2)
3. Create seed script to populate `SoundAsset` table
4. Build `<SoundLibrary />` component
5. Add audio preview player
6. Integrate into `VideoEditor` component

**Files to Create:**
- `prisma/seed-sounds.js` - Seed sound assets
- `src/components/editor/sound-library.tsx` - Audio browser
- `src/components/editor/audio-player.tsx` - Preview player
- `src/app/api/sounds/route.ts` - Search/filter API

**Success Criteria:**
- [ ] At least 50 music tracks across all vibes
- [ ] At least 100 sound effects (whoosh, pop, cinematic, etc.)
- [ ] Audio preview works in browser
- [ ] Filter by vibe, category, BPM
- [ ] "Add to Timeline" button integrates with editor

---

#### 📌 **Task 17: Build Preference Learning Recommendation Engine**
**Status:** Not Started  
**Priority:** 🔸 Medium  
**Effort:** 8-13 hours  
**Dependencies:** Task 16 (need real edit data)

**Objective:** Analyze `EditingHistory` to predict best vibes for new content.

**Requirements:**
- Query user's editing history
- Calculate preset usage frequency
- Identify manual adjustment patterns
- Match creator type to content topic
- Weight recent history higher
- Return top 3 recommended vibes

**Algorithm:**
```
1. Get EditingHistory where userId = current AND approved = true
2. Count preset usage: { energetic: 15, chill: 8, professional: 3 }
3. Extract manual adjustments: { jumpCutFrequency: avg(user_values) }
4. Match content.type to UserProfile.creatorType recommendations
5. Calculate confidence scores per vibe
6. Return top 3 with reasoning
```

**Implementation Steps:**
1. Create `/api/recommendations/vibes` endpoint
2. Build recommendation logic
3. Add caching (Redis/in-memory)
4. Update `VideoEditor` to show recommendations
5. Add "Recommended for you" badges

**Files to Create:**
- `src/app/api/recommendations/vibes/route.ts` - Recommendation API
- `src/lib/recommendation-engine.ts` - ML/scoring logic

**Success Criteria:**
- [ ] API returns top 3 vibes with confidence scores
- [ ] Video editor shows "Recommended for you" badges
- [ ] Recommendations improve over time with more data
- [ ] Cold start handled (new users get creator type defaults)

---

### Priority: Low - UX Polish

#### 📌 **Task 19: Add Voice-Over Recording Interface**
**Status:** Not Started  
**Priority:** 🔹 Low  
**Effort:** 5-8 hours  
**Dependencies:** Task 18 (sound library structure)

**Objective:** Allow users to record voice-overs directly in the video editor.

**Requirements:**
- Browser MediaRecorder API for audio capture
- Waveform visualization during recording
- Preview playback before applying
- Timeline position selector
- Volume control slider
- Save to `SoundAsset` as `voice_over` category

**Implementation Steps:**
1. Create `<VoiceOverRecorder />` component
2. Implement MediaRecorder for audio capture
3. Add waveform visualization (wavesurfer.js)
4. Save recording to storage
5. Create `SoundAsset` record
6. Add to timeline as voice-over operation

**Files to Create:**
- `src/components/editor/voice-over-recorder.tsx` - Recording UI
- `src/app/api/audio/upload/route.ts` - Audio file upload

**Success Criteria:**
- [ ] User can record audio in browser
- [ ] Waveform displays during recording
- [ ] Preview playback works
- [ ] Recording saves to storage
- [ ] Voice-over adds to timeline at selected position

---

#### 📌 **Task 21: Add Real-Time Editing Progress Updates**
**Status:** Not Started  
**Priority:** 🔹 Low  
**Effort:** 3-5 hours  
**Dependencies:** Task 16 (video processing)

**Objective:** Show render progress (0-100%) during video processing.

**Requirements:**
- WebSockets or Server-Sent Events (SSE)
- Progress bar with percentage
- Status updates (processing, completed, failed)
- Estimated time remaining

**Implementation Steps:**
1. Add SSE endpoint: `/api/editing/progress?editId={id}`
2. Update video processor to emit progress events
3. Add progress bar to `VideoEditor`
4. Subscribe to progress updates on "Apply Edits"

**Files to Create:**
- `src/app/api/editing/progress/route.ts` - SSE endpoint

**Files to Modify:**
- `src/lib/video-processor.ts` - Emit progress events
- `src/components/editor/video-editor.tsx` - Progress bar UI

**Success Criteria:**
- [ ] Progress bar shows percentage (0-100%)
- [ ] Real-time updates during processing
- [ ] Final status shown on completion
- [ ] Error messages displayed on failure

---

#### 📌 **Task 22: Create Sound Effect Preview System**
**Status:** Not Started  
**Priority:** 🔹 Low  
**Effort:** 3-5 hours  
**Dependencies:** Task 18 (sound library)

**Objective:** Build sound library browser with preview functionality.

**Requirements:**
- Category/vibe filters
- Search by name/tags
- Waveform visualization
- Play/pause preview
- "Add to Timeline" button

**Implementation Steps:**
1. Create `<SoundPicker />` component
2. Add filter controls
3. Implement audio preview player
4. Add "Add to Timeline" action

**Files to Create:**
- `src/components/editor/sound-picker.tsx` - Sound browser

**Success Criteria:**
- [ ] Filter by category (music/sound_effect/voice_over)
- [ ] Filter by vibe (energetic/chill/etc.)
- [ ] Search by keywords
- [ ] Preview plays audio without adding to timeline
- [ ] "Add to Timeline" inserts at current playhead position

---

## 🔮 Future Enhancements (Backlog)

### Advanced Editing Features
- [ ] Multi-track timeline (video + 3 audio tracks)
- [ ] Keyframe animation system
- [ ] Green screen/chroma key
- [ ] Advanced color grading controls
- [ ] Speed adjustments (slow-mo, time-lapse)
- [ ] Text overlay editor with animations

### Creator-Specific Templates
- [ ] Food bloggers: "Recipe Reveal", "Taste Test"
- [ ] Fashion: "Outfit Transition", "Slow-Mo Runway"
- [ ] Travel: "Journey Montage", "Culture Immersion"
- [ ] Fitness: "Workout Flow", "Progress Transformation"

### Collaboration & Sharing
- [ ] Share presets with community
- [ ] Team workspaces
- [ ] Approval workflows
- [ ] Comment system on edits

### Platform Expansion
- [ ] YouTube Shorts support
- [ ] LinkedIn video publishing
- [ ] Twitter/X video posts
- [ ] Pinterest video pins

### Advanced Analytics
- [ ] A/B testing for different edits
- [ ] Best time to post recommendations
- [ ] Hashtag performance analysis
- [ ] Audience demographics breakdown

### Monetization
- [ ] Creator marketplace for custom presets
- [ ] White-label solution for agencies
- [ ] API access for developers
- [ ] Enterprise team plans

---

## 📊 Sprint Planning

### Current Sprint (Sprint 4): Video Processing Foundation
**Duration:** 2 weeks  
**Focus:** Implement core video processing and onboarding

**Goals:**
1. ✅ Complete FFmpeg processing pipeline (Task 16)
2. ✅ Launch onboarding wizard (Task 20)
3. ✅ Basic sound library (Task 18)

**Success Metrics:**
- Videos successfully process with all operations
- 80%+ of new users complete onboarding
- At least 30 audio assets available

### Next Sprint (Sprint 5): ML & Personalization
**Duration:** 2 weeks  
**Focus:** Recommendation engine and UX polish

**Goals:**
1. Build preference learning system (Task 17)
2. Add voice-over recording (Task 19)
3. Real-time progress updates (Task 21)

---

## 🎯 Key Performance Indicators (KPIs)

**Product Metrics:**
- Time to first published video: Target < 10 minutes
- Edit session completion rate: Target > 70%
- Video processing success rate: Target > 95%
- Average edits per user/month: Target > 5

**Technical Metrics:**
- Video processing time: Target < 2 minutes for 60s video
- API response time: Target < 500ms (p95)
- Build success rate: Target 100%
- Uptime: Target > 99.5%

**Business Metrics:**
- Monthly Active Users (MAU) growth: Target +20% MoM
- Paid conversion rate: Target > 5%
- Churn rate: Target < 3%
- NPS score: Target > 50

---

## 🚀 Release History

### v0.3.0 - Video Editing Platform (Current)
**Released:** January 12, 2026
- Video editor with timeline UI
- Vibe-based presets (5 defaults)
- Creator onboarding wizard
- Edit button in content library
- Analytics sync cron job

### v0.2.0 - Social Media Integration
**Released:** January 10, 2026
- TikTok OAuth and publishing
- Instagram OAuth and publishing
- Analytics dashboard
- Engagement metrics tracking

### v0.1.0 - Foundation
**Released:** December 2025
- AI video generation
- GPU cost tracking
- Usage limits and enforcement
- User authentication
- Basic dashboard

---

## 📝 Notes & Decisions

### Technology Choices
- **Video Processing:** Evaluating AWS Lambda (serverless) vs dedicated worker (scalability)
- **Audio Storage:** Cloudflare R2 (cost-effective, fast CDN)
- **Real-time Updates:** Server-Sent Events (simpler than WebSockets, sufficient for one-way updates)

### Design Principles
1. **Speed First:** Minimize time from idea to published video
2. **Learning System:** Platform gets smarter with every user interaction
3. **Creator-Centric:** Features tailored to specific creator niches
4. **No Lock-in:** Export videos, own your content

### Open Questions
- [ ] Should we support video uploads (edit user's own videos)?
- [ ] Pricing model for premium sound effects?
- [ ] Watermark on free tier videos?
- [ ] Mobile app for on-the-go editing?
