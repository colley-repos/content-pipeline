# Synthia AI Content Platform - AI Agent Instructions

## Architecture Overview

**Synthia** is a Next.js 14 SaaS platform for AI-powered video content generation with editing, social publishing, and analytics. Core tech: Next.js App Router, PostgreSQL via Prisma, NextAuth.js, Stripe, OpenAI, FFmpeg video processing.

**Key architectural patterns:**
- **App Router API Routes**: All backend logic in `src/app/api/*/route.ts` (not Pages Router)
- **Server-first auth**: Use `getServerSession(authOptions)` from `@/lib/auth` in API routes, not client-side session hooks
- **Prisma client singleton**: Always import from `@/lib/prisma`, never instantiate new `PrismaClient()`
- **Middleware auth**: Role-based access (ADMIN vs USER) handled in `src/middleware.ts`

## Critical Development Workflows

### Database Changes
```bash
# After editing prisma/schema.prisma:
npm run prisma:generate       # Update Prisma client types
npm run prisma:migrate        # Create and apply migration (dev)
npm run prisma:migrate:prod   # Deploy migration (production)
npm run prisma:studio         # Visual database browser
```

### Building & Testing
```bash
npm run dev          # Local dev server (localhost:3000)
npm run build        # Production build (runs prisma generate first)
npm run lint         # ESLint check
npm run test         # Jest test suite
```

### Deployment
- **Platform**: Vercel (automatic deploys on push to master)
- **Database**: Neon PostgreSQL (serverless, configured via DATABASE_URL)
- **Cron jobs**: Defined in `vercel.json` (limited to daily on Hobby plan)
- **Environment**: Manage via `vercel env` CLI or Vercel dashboard

## Project-Specific Conventions

### API Route Structure
```typescript
// src/app/api/example/route.ts - ALWAYS use this pattern:
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  // 1. Authenticate
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // 2. Rate limit check (for high-traffic endpoints)
  const rateLimit = checkRateLimit(request, 'endpoint-name', RATE_LIMITS.API)
  if (rateLimit.limited) return createRateLimitResponse(...)
  
  // 3. Input validation with Zod
  const body = await request.json()
  const validated = schema.parse(body) // throws on invalid input
  
  // 4. Business logic
  const data = await prisma.model.findMany(...)
  
  // 5. Return response
  return NextResponse.json(data)
}
```

### UI Components (shadcn/ui)
- **Location**: `src/components/ui/` (auto-generated via `npx shadcn@latest add [component]`)
- **Styling**: Use `cn()` utility from `@/lib/cn` for conditional classes
- **Variants**: Components use `class-variance-authority` (see `button.tsx` for example)
- **Icons**: Use `lucide-react` icons, NOT emojis (already removed from codebase)
- **Dark mode**: Implemented with `next-themes`, use CSS variables (`bg-background`, `text-foreground`, etc.)

### Authentication Patterns
```typescript
// Client component (pages):
'use client'
import { useSession } from 'next-auth/react'

export default function Page() {
  const { data: session } = useSession()
  if (!session) return <LoginPrompt />
  // ...
}

// API route:
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  // session.user.id, session.user.email, etc.
}
```

### Video Processing (FFmpeg)
- **Local dev**: Uses Node.js `child_process` + FFmpeg CLI (must be installed)
- **Production**: Designed for AWS Lambda with FFmpeg layer (see `docs/features/FFMPEG_DEPLOYMENT.md`)
- **Implementation**: `src/lib/video-processor.ts` - async processing with progress callbacks
- **File storage**: Temporary files in `/tmp`, final outputs to Vercel Blob or S3

### Rate Limiting
All authenticated API routes should use rate limiting from `@/lib/rate-limit`:
```typescript
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

const limit = checkRateLimit(request, 'content-generate', RATE_LIMITS.CONTENT_GENERATION)
if (limit.limited) return createRateLimitResponse(limit.remaining, limit.resetTime)
```

**Rate limit tiers** (from `RATE_LIMITS` constant):
- `AUTH_LOGIN`: 5 per 15 min
- `AUTH_REGISTER`: 3 per hour
- `CONTENT_GENERATION`: 2/min (free), 10/min (paid)
- `API`: 60/min general

### Database Models (Key Relationships)
- **User** → has many: `Content`, `Subscription`, `UserProfile`, `SocialAccount`, `Publication`
- **Content** → has many: `VideoEdit`, `Publication` (shareable via `shareToken`)
- **UserProfile** → defines: creator type, preferred vibes (for ML recommendations)
- **EditingPreset** → vibe templates (Energetic, Chill, Professional, etc.) with FFmpeg settings
- **VideoEdit** → tracks edit jobs, links to `Content` and `EditingPreset`

### Security Best Practices (Enforced)
1. **Input sanitization**: Use `sanitizeInput()` from `@/lib/sanitization` for user-generated content
2. **Admin routes**: Protected by middleware (`src/middleware.ts`), check `token?.role === 'ADMIN'`
3. **Environment secrets**: Never commit `.env`, use Vercel env vars for production
4. **Webhook verification**: Stripe webhooks verify signature (see `src/app/api/webhooks/stripe/route.ts`)
5. **SQL injection**: Prisma ORM prevents this, but always validate input with Zod first

## Task Management Workflow

**Always check `ROADMAP.md` first** - it's the single source of truth for priority and task status.

When implementing tasks:
1. Review `ROADMAP.md` for context and dependencies
2. Check `docs/architecture/WORKFLOW.md` for detailed guidelines
3. Create plan with file list before coding
4. Test locally with `npm run build` before committing
5. Update `ROADMAP.md` task status after completion
6. Commit with conventional commit format: `feat:`, `fix:`, `docs:`, `refactor:`

## Common Pitfalls to Avoid

❌ **Don't** use `new PrismaClient()` - import from `@/lib/prisma`  
❌ **Don't** use emojis in UI - use `lucide-react` icons instead  
❌ **Don't** forget `prisma generate` after schema changes  
❌ **Don't** use `request.headers` without Next.js `headers()` function in App Router  
❌ **Don't** set cron schedules to run more than daily on Vercel Hobby plan  
❌ **Don't** forget to add `'use client'` directive for components using React hooks  

## File Structure Reference

```
src/
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API routes (GET/POST handlers)
│   ├── dashboard/            # Protected user pages
│   ├── admin/                # Protected admin pages (role check)
│   └── layout.tsx            # Root layout with ThemeProvider
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── theme-toggle.tsx      # Dark mode switcher
├── lib/                      # Shared utilities
│   ├── auth.ts               # NextAuth configuration (authOptions)
│   ├── prisma.ts             # Prisma client singleton
│   ├── rate-limit.ts         # Rate limiting logic
│   ├── video-processor.ts    # FFmpeg video editing
│   └── openai.ts             # OpenAI API wrapper
├── config/                   # App configuration
└── middleware.ts             # Auth & route protection

docs/
├── architecture/             # System design docs
├── features/                 # Feature-specific guides (FFmpeg, social)
└── security/                 # Security policies & implementation
```

## External Integration Notes

- **Stripe**: Use `@/lib/stripe` singleton, webhook secret validation required
- **OpenAI**: Configured in `@/lib/openai`, supports Azure OpenAI fallback
- **Social APIs**: TikTok/Instagram OAuth flows in `src/app/api/social/`
- **Analytics**: Synced via cron job (`/api/cron/sync-analytics`) to `Publication` model

## Questions to Ask When Stuck

1. Is this an App Router route? (Check for `route.ts`, not `pages/*.tsx`)
2. Did I run `prisma generate` after schema changes?
3. Is this endpoint rate-limited? (Check `@/lib/rate-limit`)
4. Am I using server-side auth correctly? (`getServerSession`, not `useSession`)
5. Is the environment variable set in Vercel? (Check `vercel env ls`)
