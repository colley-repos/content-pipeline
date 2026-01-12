# Development Workflow & Guidelines

> **Purpose:** This document codifies our development process to ensure consistent, high-quality progress on the Content Pipeline project.

---

## 🔄 Core Development Loop

```
1. CHECK ROADMAP     → Review ROADMAP.md for next priority task
2. SELECT TASK       → Choose highest priority unstarted task
3. PLAN             → Break down into subtasks, identify files to modify
4. IMPLEMENT        → Write code, following best practices
5. TEST             → Build, run, verify functionality
6. ITERATE          → Fix errors, refine implementation
7. COMMIT & PUSH    → Document changes, deploy
8. UPDATE ROADMAP   → Mark task complete, move to next
9. REPEAT           → Go to step 1
```

---

## 📋 Step-by-Step Process

### Step 1: Check Roadmap
**Action:** Open `ROADMAP.md` and review current sprint section.

**Questions to Answer:**
- What is the current sprint focus?
- Which task is highest priority?
- Are there any blockers or dependencies?
- What is the estimated effort?

**Output:** Selected task ID and objective.

---

### Step 2: Select Task
**Action:** Choose the next task based on priority.

**Priority Levels:**
- 🔥 **Critical:** Core functionality, blocking other work
- 🔸 **High:** Important features, user-facing
- 🔹 **Medium:** Nice-to-have, enhancements
- ⚪ **Low:** Polish, optimization

**Selection Criteria:**
1. No unmet dependencies
2. Fits within available time/complexity budget
3. Highest priority among eligible tasks
4. Clear success criteria defined

**Output:** Task number, title, and requirements document.

---

### Step 3: Plan Implementation

**Action:** Break down task into concrete subtasks.

**Planning Checklist:**
- [ ] List all files that need to be created
- [ ] List all files that need to be modified
- [ ] Identify external dependencies (npm packages, APIs)
- [ ] Define success criteria (specific, testable)
- [ ] Estimate time for each subtask
- [ ] Check for potential conflicts with existing code

**Example Plan:**
```
Task 20: Show Onboarding Wizard to New Users

Files to Modify:
- src/app/dashboard/page.tsx (add onboarding check)

Subtasks:
1. Add state for showing onboarding modal [10 min]
2. Fetch user profile in useEffect [5 min]
3. Conditional rendering of OnboardingWizard [5 min]
4. Handle completion callback [10 min]
5. Test with new user account [15 min]

Total Estimate: 45 minutes
Dependencies: None
Success: New users see wizard, existing users don't
```

**Output:** Detailed implementation plan with file list.

---

### Step 4: Implement

**Action:** Write code following best practices.

#### Code Quality Standards

**File Organization:**
```
src/
├── app/
│   ├── api/              # API routes (server-side)
│   └── [pages]/          # Page components
├── components/
│   ├── ui/               # Reusable UI primitives
│   ├── dashboard/        # Dashboard-specific
│   ├── editor/           # Video editor components
│   └── onboarding/       # Onboarding flow
├── lib/
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # Authentication
│   └── utils.ts          # Helper functions
└── workers/              # Background jobs
```

**Naming Conventions:**
- **Components:** PascalCase (`VideoEditor.tsx`, `SoundPicker.tsx`)
- **Files:** kebab-case (`video-processor.ts`, `sound-library.tsx`)
- **Functions:** camelCase (`processVideo()`, `fetchPresets()`)
- **Constants:** UPPER_SNAKE_CASE (`VIBE_PRESETS`, `MAX_FILE_SIZE`)
- **Types/Interfaces:** PascalCase (`VideoEditProps`, `EditOperation`)

**API Route Structure:**
```typescript
// Always add dynamic config for API routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Input validation
    const { searchParams } = new URL(request.url)
    const param = searchParams.get('param')
    
    // 3. Database query
    const data = await prisma.model.findMany({ where: { ... } })
    
    // 4. Return response
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Component Structure:**
```typescript
'use client'

// 1. Imports (grouped: React, UI, icons, utils)
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Video } from 'lucide-react'
import { cn } from '@/lib/utils'

// 2. Types/Interfaces
interface MyComponentProps {
  id: string
  onComplete?: () => void
}

// 3. Component
export function MyComponent({ id, onComplete }: MyComponentProps) {
  // State
  const [loading, setLoading] = useState(false)
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [])
  
  // Handlers
  const handleClick = async () => {
    // Logic
  }
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

**Error Handling:**
- Always wrap async operations in try-catch
- Log errors to console (will appear in Vercel logs)
- Return user-friendly error messages
- Use appropriate HTTP status codes

**Performance Best Practices:**
- Use React.memo for expensive components
- Debounce user inputs (search, filters)
- Paginate large lists
- Lazy load images and videos
- Use Suspense boundaries for async data

**Accessibility:**
- Use semantic HTML elements
- Add ARIA labels for icon buttons
- Ensure keyboard navigation works
- Maintain color contrast ratios
- Test with screen readers

---

### Step 5: Test

**Action:** Verify implementation works as expected.

#### Testing Checklist

**Build Test:**
```bash
npm run build
```
✅ **Pass Criteria:** `✓ Compiled successfully`  
❌ **Fail:** Fix TypeScript errors, missing imports, linting issues

**Local Development:**
```bash
npm run dev
```
- Navigate to relevant page
- Test all user interactions
- Check console for errors
- Verify API responses
- Test edge cases (empty states, errors)

**Database Verification:**
```bash
npx prisma studio
```
- Verify data is saved correctly
- Check relationships between models
- Confirm migrations applied

**Manual Testing Matrix:**

| Feature | Happy Path | Error Case | Edge Case |
|---------|-----------|------------|-----------|
| Onboarding | Complete wizard | Skip wizard | Reload mid-flow |
| Video Edit | Apply vibe | Processing fails | Multiple edits |
| Publishing | Post to TikTok | Auth expired | Network error |

**Browser Testing:**
- Chrome (primary)
- Firefox
- Safari (if available)
- Mobile responsive (DevTools)

---

### Step 6: Iterate

**Action:** Fix bugs and refine implementation.

**Common Issues & Solutions:**

**Build Errors:**
```
Error: Module not found: Can't resolve '@/components/...'
→ Solution: Check import path, verify file exists
```

```
Error: Dynamic server usage: Route couldn't be rendered statically
→ Solution: Add `export const dynamic = 'force-dynamic'` to API route
```

```
Error: Type 'X' is not assignable to type 'Y'
→ Solution: Fix TypeScript types, add proper interfaces
```

**Runtime Errors:**
```
Error: Unauthorized
→ Solution: Check authentication, verify session exists
```

```
Error: Prisma query failed
→ Solution: Check database schema, verify relations exist
```

**Debugging Process:**
1. Read error message carefully
2. Check browser console for additional context
3. Use `console.log()` to trace execution
4. Verify data structure matches expectations
5. Check API responses in Network tab
6. Review recent code changes

---

### Step 7: Commit & Push

**Action:** Document changes and deploy to production.

**Commit Message Format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructure (no behavior change)
- `style:` Formatting, whitespace
- `docs:` Documentation only
- `test:` Adding tests
- `chore:` Build process, dependencies

**Example Commit:**
```
feat: Add onboarding wizard to dashboard

Completed Features:
- Trigger OnboardingWizard on first dashboard visit
- Check for UserProfile existence in useEffect
- Modal automatically shows for new users
- Save creator type and vibes to database on completion

Implementation:
- Modified src/app/dashboard/page.tsx
  - Added showOnboarding state
  - Fetch user profile on mount
  - Conditional rendering of OnboardingWizard modal
  - handleOnboardingComplete callback
  
Files Modified:
- src/app/dashboard/page.tsx

Success Criteria: ✅ All met
- New users see wizard on first visit
- Wizard saves data to UserProfile table
- Dashboard loads normally after completion
- Existing users don't see wizard again

Closes: Task #20
```

**Git Workflow:**
```bash
# 1. Stage changes
git add .

# 2. Commit with detailed message
git commit -m "feat: descriptive message"

# 3. Push to GitHub (triggers Vercel deployment)
git push origin master

# 4. Verify Vercel deployment succeeds
# Check: https://vercel.com/dashboard
```

**Deployment Verification:**
- Wait for Vercel build to complete (~2-3 minutes)
- Check deployment logs for errors
- Visit production URL to test changes
- Verify database migrations applied (if any)

---

### Step 8: Update Roadmap

**Action:** Mark task complete and document outcome.

**Update Checklist:**
- [ ] Change task status: `Not Started` → `Completed`
- [ ] Add completion date
- [ ] Document any deviations from plan
- [ ] Note any new issues discovered
- [ ] Update sprint progress

**Example Update:**
```markdown
#### 📌 **Task 20: Show Onboarding Wizard to New Users**
**Status:** ✅ Completed (January 12, 2026)  
**Priority:** 🔥 High  
**Actual Effort:** 45 minutes (matched estimate)

**Implementation Notes:**
- Used Dialog component for modal
- Added useEffect to fetch profile
- handleOnboardingComplete updates state

**Files Modified:**
- src/app/dashboard/page.tsx

**Success Criteria:** ✅ All met
- [x] New users see onboarding wizard on first dashboard visit
- [x] Wizard saves creator type and vibes to `UserProfile`
- [x] Dashboard loads normally after completion
- [x] Existing users don't see wizard again

**Issues Encountered:** None
**Next Task:** #16 - Implement FFmpeg video processing pipeline
```

---

### Step 9: Repeat

**Action:** Return to Step 1 and continue the loop.

**Before Starting Next Task:**
- Commit all current changes
- Clear mind, take short break if needed
- Review roadmap for any priority changes
- Check if any blockers have been resolved

---

## 🎯 Quality Gates

**Before Committing:**
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Manual testing passed
- [ ] Code follows conventions
- [ ] Comments added for complex logic

**Before Deploying:**
- [ ] All files committed
- [ ] Commit message is descriptive
- [ ] Roadmap updated
- [ ] No breaking changes to existing features

**After Deploying:**
- [ ] Vercel build succeeded
- [ ] Production site loads correctly
- [ ] New feature works in production
- [ ] Database migrations applied (if any)

---

## 🚨 Emergency Procedures

### Production Bug Detected

**Immediate Actions:**
1. Verify bug in production (not just local)
2. Assess severity (blocker, major, minor)
3. Check recent deployments for cause
4. Roll back if necessary: `git revert <commit>`

**Investigation:**
1. Check Vercel logs for errors
2. Review database for data issues
3. Test locally to reproduce
4. Identify root cause

**Resolution:**
1. Create hotfix branch (if major bug)
2. Implement fix with minimal changes
3. Test thoroughly
4. Deploy immediately
5. Document incident in ROADMAP.md

### Build Failures

**Diagnosis:**
```bash
# Get detailed error output
npm run build 2>&1 | tee build-error.log

# Check for:
- TypeScript errors
- Missing dependencies
- Syntax errors
- Import path issues
```

**Common Fixes:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build

# Update dependencies
npm update
npm audit fix

# Reset Prisma client
npx prisma generate
```

---

## 📚 Reference

**Key Files:**
- `ROADMAP.md` - Project roadmap and task list
- `VIDEO_EDITING_SYSTEM.md` - Editing system documentation
- `README.md` - Project setup and overview
- `prisma/schema.prisma` - Database schema

**Important Commands:**
```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build           # Production build
npm run start           # Run production build locally

# Database
npx prisma studio       # Visual database editor
npx prisma migrate dev  # Create and apply migration
npx prisma generate     # Regenerate Prisma client
node prisma/seed-presets.js  # Seed editing presets

# Deployment
git push origin master  # Deploy to Vercel
vercel --prod          # Manual deployment
```

**External Documentation:**
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Lucide Icons](https://lucide.dev/)

---

## 🎓 Best Practices Summary

1. **Always check ROADMAP.md before starting work**
2. **Plan before coding** - saves time debugging
3. **Test locally before pushing** - catch errors early
4. **Write descriptive commits** - helps future debugging
5. **Update roadmap immediately** - maintain accurate project state
6. **Follow naming conventions** - keeps codebase consistent
7. **Handle errors gracefully** - better user experience
8. **Document complex logic** - helps future maintainers
9. **Iterate quickly** - small commits, frequent deploys
10. **Communicate progress** - update roadmap status regularly

---

## 🔮 Continuous Improvement

This workflow document should be updated as we discover better processes. When you identify an improvement:

1. Document the issue or inefficiency
2. Propose a solution
3. Update this file
4. Commit with `docs: Update workflow - <reason>`

**Recent Updates:**
- January 12, 2026: Initial workflow documentation
