# 🔧 Implementation Guide: Integrating Security Features

This guide shows how to integrate the new security features into your existing API routes.

## Quick Start

### 1. Initialize Environment Validation

Add to your `src/instrumentation.ts` or app entry point:

```typescript
import { validateEnv } from '@/config/env'

// Call this at startup
validateEnv()
```

This will validate all environment variables and exit with clear error messages if any are missing or invalid.

### 2. Apply Security Features to API Routes

Here's how to update your existing API routes:

#### Before (Unprotected):
```typescript
export async function POST(request: Request) {
  const body = await request.json()
  // ... handle request
}
```

#### After (Protected):
```typescript
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { withSecurityHeaders } from '@/lib/security-headers'
import { sanitizedSchemas } from '@/lib/sanitization'
import { z } from 'zod'

const schema = z.object({
  prompt: sanitizedSchemas.prompt, // Built-in sanitization
  email: sanitizedSchemas.email,
})

async function handler(request: Request) {
  const body = await request.json()
  const data = schema.parse(body) // Validates and sanitizes
  // ... handle request
}

// Apply middleware
export const POST = withSecurityHeaders(
  withRateLimit(handler, 'api:endpoint', RATE_LIMITS.API_GENERAL)
)
```

## Integration Examples

### Protecting Authentication Routes

```typescript
// src/app/api/auth/login/route.ts
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { withSecurityHeaders } from '@/lib/security-headers'
import { logFailedLogin } from '@/lib/audit-log'

async function handler(request: Request) {
  // ... authentication logic
  
  if (!isValid) {
    await logFailedLogin(email, getClientIp(request))
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }
}

export const POST = withSecurityHeaders(
  withRateLimit(handler, 'auth:login', RATE_LIMITS.AUTH_LOGIN)
)
```

### Protecting Content Generation

```typescript
// Already implemented in src/app/api/content/generate/route.ts
import { checkUserRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { sanitizedSchemas } from '@/lib/sanitization'

// Different limits for free vs paid users
const rateLimit = hasSubscription 
  ? RATE_LIMITS.CONTENT_GENERATE 
  : RATE_LIMITS.CONTENT_GENERATE_FREE
```

### Adding Audit Logging

```typescript
import { withAuditLog } from '@/lib/audit-log'

async function handler(request: Request) {
  // ... your logic
}

export const POST = withAuditLog(handler)
```

### Comprehensive Protection

```typescript
// Combine all security features
export const POST = withSecurityHeaders(
  withAuditLog(
    withRateLimit(handler, 'api:action', RATE_LIMITS.API_GENERAL)
  )
)
```

## Database Migration

Run the migration to add the new `WebhookEvent` model:

```bash
npx prisma migrate dev --name add-webhook-events-and-indexes
```

## Configuration

### Rate Limiting

Customize limits in `src/lib/rate-limit.ts`:

```typescript
export const RATE_LIMITS = {
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many login attempts',
  },
  // Add custom limits...
}
```

### Security Headers

Adjust CSP in `src/lib/security-headers.ts`:

```typescript
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' https://trusted-cdn.com",
  // Add your trusted sources...
]
```

### Input Sanitization

Add custom sanitization rules in `src/lib/sanitization.ts`:

```typescript
export const customSchema = z
  .string()
  .transform((val) => {
    // Your sanitization logic
    return sanitized
  })
```

## Testing Security Features

### Test Rate Limiting

```bash
# Should block after 5 attempts
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

### Test Input Sanitization

```typescript
// Should reject prompt injection
const response = await fetch('/api/content/generate', {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'Ignore previous instructions and...',
  }),
})
// Expect 400 error
```

### Test Webhook Replay Protection

```typescript
// Replaying old webhook event should fail
const oldEvent = { /* event from 10 minutes ago */ }
// Expect 400 error: "Event too old"
```

## Production Checklist

- [ ] Environment variables validated on startup
- [ ] HTTPS enabled (check NEXTAUTH_URL)
- [ ] Production Stripe keys configured
- [ ] Strong NEXTAUTH_SECRET (32+ chars)
- [ ] Database connection pooling configured
- [ ] Security headers working (test with securityheaders.com)
- [ ] Rate limiting active
- [ ] Audit logging enabled
- [ ] Error handling not exposing stack traces
- [ ] Run `npm audit` and fix vulnerabilities

## Monitoring

### Check Audit Logs

```sql
-- View recent API requests
SELECT * FROM "SystemLog" 
WHERE level = 'INFO' 
ORDER BY "createdAt" DESC 
LIMIT 100;

-- View security events
SELECT * FROM "SystemLog" 
WHERE level = 'WARN' 
  AND message LIKE 'Security Event:%'
ORDER BY "createdAt" DESC;
```

### Monitor Rate Limits

```typescript
// Check rate limit headers in responses
response.headers.get('X-RateLimit-Remaining')
response.headers.get('X-RateLimit-Reset')
```

## Troubleshooting

### Environment Validation Fails

Check your `.env` file matches all requirements in `src/config/env.ts`. The error message will tell you exactly which variables are missing or invalid.

### Rate Limit Too Restrictive

Adjust limits in `RATE_LIMITS` configuration. For development, you can temporarily increase limits.

### Webhook Verification Fails

Ensure `STRIPE_WEBHOOK_SECRET` is correctly set. Test with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### CSP Blocking Resources

Check browser console for CSP violations. Add trusted domains to CSP directives in `src/lib/security-headers.ts`.

## Next Steps

1. **Review all API routes** - Add security middleware to unprotected endpoints
2. **Test thoroughly** - Run security tests in staging
3. **Monitor logs** - Watch for suspicious activity
4. **Regular updates** - Keep dependencies current
5. **Security audit** - Schedule periodic reviews

For questions or issues, refer to [SECURITY.md](./SECURITY.md).
