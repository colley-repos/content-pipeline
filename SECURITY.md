# Security Policy

## 🔒 Security Overview

This document outlines the security measures implemented in the AI Content Generator SaaS platform and provides guidelines for reporting vulnerabilities.

## Security Features

### 1. Authentication & Authorization

- **Password Security**
  - Bcrypt hashing with 10 salt rounds
  - Minimum 8 characters with complexity requirements
  - Password not stored in plain text

- **Session Management**
  - JWT-based sessions with NextAuth.js
  - 30-day session expiration
  - 24-hour session update on activity
  - Secure, HttpOnly cookies (production)
  - SameSite=Lax to prevent CSRF

- **OAuth Integration**
  - Google and GitHub OAuth providers
  - Secure token exchange

### 2. Rate Limiting

All API endpoints are protected with rate limiting to prevent abuse:

- **Authentication Endpoints**
  - Login: 5 attempts per 15 minutes per IP
  - Registration: 3 attempts per hour per IP

- **Content Generation**
  - Free users: 2 requests per minute
  - Paid users: 10 requests per minute
  - User-based tracking for authenticated requests

- **General API**
  - 60 requests per minute per IP
  - 100 webhooks per minute

### 3. Input Validation & Sanitization

- **Zod Validation**
  - All API inputs validated with Zod schemas
  - Type-safe request handling
  - Detailed validation error messages (development only)

- **Prompt Injection Protection**
  - Maximum prompt length: 2000 characters
  - Detection of malicious patterns:
    - System command injections
    - Prompt override attempts
    - Excessive special characters
  - Input sanitization and normalization

- **XSS Prevention**
  - No `dangerouslySetInnerHTML` usage
  - HTML content sanitization
  - Proper React escaping

### 4. Security Headers

Comprehensive security headers applied to all responses:

- **Content Security Policy (CSP)**
  - Restricts resource loading to trusted sources
  - Blocks inline scripts (except Stripe)
  - Prevents XSS attacks

- **HSTS (Production)**
  - Forces HTTPS for all requests
  - 1-year max-age with includeSubDomains

- **X-Frame-Options: DENY**
  - Prevents clickjacking attacks

- **X-Content-Type-Options: nosniff**
  - Prevents MIME type sniffing

- **Referrer-Policy**
  - Limits referrer information leakage

- **Permissions-Policy**
  - Disables dangerous browser features

### 5. Payment Security

- **Stripe Integration**
  - PCI DSS compliant
  - Webhook signature verification
  - Idempotency keys for duplicate prevention
  - Event timestamp validation (5-minute window)
  - Processed event tracking to prevent replay attacks

### 6. Database Security

- **Prisma ORM**
  - SQL injection prevention
  - Parameterized queries
  - Type-safe database access

- **Connection Security**
  - Connection pooling configured
  - Encrypted connections to PostgreSQL
  - Proper indexes for performance

- **Data Protection**
  - User passwords hashed with bcrypt
  - Sensitive data not logged
  - Cascade deletes for data integrity

### 7. Error Handling

- **Production Mode**
  - Generic error messages to users
  - No stack traces exposed
  - Detailed logging for debugging
  - Sensitive information redacted from logs

- **Development Mode**
  - Detailed error messages
  - Stack traces for debugging
  - Validation error details

### 8. Audit Logging

All API requests are logged with:
- User ID (if authenticated)
- Endpoint and method
- Response status code
- IP address and user agent
- Response time
- Timestamp

Security events tracked:
- Failed login attempts
- Suspicious activity
- Rate limit violations
- Webhook processing

### 9. Environment Security

- **Environment Variable Validation**
  - Startup validation of all required vars
  - Type checking with Zod
  - Production-specific checks
  - Default value prevention in production

- **Secrets Management**
  - No hardcoded secrets
  - `.env` file for local development
  - Environment variables in production
  - Separate test/production keys

### 10. API Security

- **CORS**
  - Configured allowed origins
  - Credentials support
  - Preflight request handling

- **CSRF Protection**
  - NextAuth built-in CSRF tokens
  - SameSite cookies
  - Origin verification

## Security Best Practices

### For Developers

1. **Never commit secrets**
   - Use `.env` file locally
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Validate all inputs**
   - Use Zod schemas for all API endpoints
   - Sanitize user inputs before processing
   - Never trust client-side data

3. **Handle errors securely**
   - Use generic messages in production
   - Log detailed errors server-side
   - Don't expose implementation details

4. **Keep dependencies updated**
   - Regularly run `npm audit`
   - Update packages with security patches
   - Review dependency changes

5. **Use security tools**
   - ESLint with security plugins
   - TypeScript for type safety
   - Automated security scanning in CI/CD

### For Deployment

1. **Environment Setup**
   - Use strong `NEXTAUTH_SECRET` (32+ chars)
   - Enable HTTPS in production
   - Use production Stripe keys
   - Configure secure database connection

2. **Infrastructure**
   - Use a reverse proxy (e.g., Nginx)
   - Enable DDoS protection
   - Set up monitoring and alerts
   - Regular backups

3. **Monitoring**
   - Track failed login attempts
   - Monitor rate limit violations
   - Alert on suspicious activity
   - Review audit logs regularly

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly:

### 📧 Contact

Email: **security@yourcompany.com**

### 📝 What to Include

1. **Description** - Clear explanation of the vulnerability
2. **Impact** - Potential consequences
3. **Steps to Reproduce** - Detailed reproduction steps
4. **Proof of Concept** - Code or screenshots (if applicable)
5. **Suggested Fix** - If you have one

### ⏱️ Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-3 days
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: As resources permit

### 🎯 Scope

**In Scope:**
- Authentication and authorization bypasses
- SQL injection, XSS, CSRF
- Remote code execution
- Payment processing vulnerabilities
- Data exposure or leakage
- Rate limiting bypasses

**Out of Scope:**
- Social engineering attacks
- Physical attacks
- Denial of service (without bypass)
- Issues in third-party services
- Known issues in dependencies (report to maintainers)

### 🏆 Recognition

We appreciate security researchers and will:
- Acknowledge you in our security credits (if desired)
- Provide updates on the fix timeline
- Work with you to understand the issue

### ⚠️ Disclosure Policy

- Do not publicly disclose the vulnerability before we've addressed it
- Allow reasonable time for us to fix the issue
- Make a good faith effort to avoid privacy violations and service disruption

## Security Updates

Security updates are released as needed. Subscribe to our repository for notifications.

### Version History

- **v1.0.0** (2024) - Initial security implementation
  - Rate limiting
  - Input sanitization
  - Security headers
  - Webhook replay protection
  - Audit logging

## Compliance

This platform implements security controls aligned with:
- OWASP Top 10 protection
- PCI DSS (via Stripe)
- GDPR considerations
- SOC 2 readiness

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Stripe Security](https://stripe.com/docs/security)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)

---

**Last Updated**: 2024  
**Security Team**: Your Security Team
