# AI Content Generator SaaS Platform

A production-ready AI-powered content generation platform built with Next.js, PostgreSQL, Stripe, and OpenAI. Generate viral social media posts, captions, scripts, bios, and content calendars with AI.

## 🚀 Features

- **User Authentication**: Email/password + OAuth (Google, GitHub)
- **Subscription Management**: Stripe integration with monthly/yearly plans
- **Content Generation**:
  - Social media posts
  - Captions
  - Video scripts
  - Bios & profiles
  - Replies
  - Content calendars
- **Shareable Outputs**: Every piece of content has a unique share URL with viral CTAs
- **User Dashboard**: View history, manage subscription, generate content
- **Admin Dashboard**: Analytics, user management, system monitoring
- **Automated Emails**: Welcome emails, subscription confirmations, weekly content packs
- **Production Ready**: Docker, CI/CD, error handling, logging

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (React), TailwindCSS, Radix UI
- **Backend**: Next.js API Routes (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **AI**: OpenAI / Azure OpenAI
- **Email**: Nodemailer (SMTP)
- **Deployment**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+
- Docker and Docker Compose (for containerized deployment)
- OpenAI API key or Azure OpenAI credentials
- Stripe account
- SMTP server credentials (Gmail, SendGrid, etc.)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd content-pipeline
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
copy .env.example .env
```

Edit `.env` and configure all required variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_content_db?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
STRIPE_PRICE_MONTHLY="price_monthly_id"
STRIPE_PRICE_YEARLY="price_yearly_id"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourapp.com"

# App
APP_NAME="AI Content Generator"
APP_URL="http://localhost:3000"
```

### 4. Set up the database

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate
```

Seed the database (creates test users):

```bash
npm run prisma:seed
```

**Test credentials**:
- Admin: `admin@example.com` / `admin123`
- User: `test@example.com` / `test123`

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Deployment

### Development

```bash
npm run docker:up
```

This starts both PostgreSQL and the application in containers.

### Production

Build the Docker image:

```bash
npm run docker:build
```

Or use docker-compose for full stack:

```bash
docker-compose up -d
```

## 🔧 Configuration

### Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Copy price IDs to `.env`:
   - `STRIPE_PRICE_MONTHLY`
   - `STRIPE_PRICE_YEARLY`
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Add webhook events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### OpenAI Setup

**Option 1: OpenAI**
```env
OPENAI_API_KEY="sk-your-key"
```

**Option 2: Azure OpenAI**
```env
AZURE_OPENAI_API_KEY="your-key"
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
AZURE_OPENAI_DEPLOYMENT="your-deployment-name"
```

### Email Setup

**Gmail Example**:
1. Enable 2-Factor Authentication
2. Generate App Password
3. Configure:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### OAuth Providers (Optional)

Add OAuth credentials to `.env`:

```env
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
```

## 📁 Project Structure

```
content-pipeline/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions CI/CD
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Database seed script
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication
│   │   │   ├── content/       # Content generation
│   │   │   ├── subscription/  # Stripe subscription
│   │   │   ├── webhooks/      # Stripe webhooks
│   │   │   └── admin/         # Admin endpoints
│   │   ├── dashboard/         # Dashboard page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── pricing/           # Pricing page
│   │   ├── share/             # Share pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── auth/              # Auth forms
│   │   └── dashboard/         # Dashboard components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── openai.ts          # OpenAI integration
│   │   ├── stripe.ts          # Stripe integration
│   │   ├── email.ts           # Email service
│   │   └── utils.ts           # Utility functions
│   ├── middleware.ts          # Auth middleware
│   └── types/                 # TypeScript types
├── docker-compose.yml         # Docker Compose config
├── Dockerfile                 # Docker image config
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── tailwind.config.ts         # Tailwind config
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Content
- `POST /api/content/generate` - Generate content
- `GET /api/content/generate` - Get user's content history

### Subscription
- `POST /api/subscription/checkout` - Create checkout session
- `POST /api/subscription/portal` - Create portal session
- `GET /api/subscription/status` - Get subscription status

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Admin
- `GET /api/admin/analytics` - Get admin analytics

## 🎨 Customization

### Branding

Update in `.env`:
```env
APP_NAME="Your App Name"
APP_URL="https://yourapp.com"
VIRAL_CTA="🚀 Get yours at yourapp.com!"
```

### AI Prompts

Edit prompts in `src/lib/openai.ts`:
```typescript
const SYSTEM_PROMPTS = {
  social_post: `Your custom prompt...`,
  // ...
}
```

### Styling

- Colors: `tailwind.config.ts`
- Global styles: `src/app/globals.css`
- Components: `src/components/ui/`

## 🚢 Production Deployment

### Database Migrations

```bash
npm run prisma:migrate:prod
```

### Environment Variables

Set all production environment variables:
- Use strong `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- Use production Stripe keys
- Configure production database URL
- Set correct `NEXTAUTH_URL` and `APP_URL`

### Docker Production Build

```bash
docker build -t ai-content-generator:latest .
docker run -p 3000:3000 --env-file .env ai-content-generator:latest
```

### CI/CD

The GitHub Actions workflow automatically:
1. Runs tests and linting
2. Builds the application
3. Creates Docker image
4. Pushes to GitHub Container Registry
5. Deploys to production (configure deployment steps)

## 📊 Monitoring & Logging

### System Logs

All system events are logged to the `SystemLog` table:
- Error tracking
- User actions
- Subscription events
- Content generation

### Analytics

User analytics are stored in the `Analytics` table:
- User signups
- Content generation
- Subscription changes

Access via Admin Dashboard.

## 🔐 Security

- Passwords hashed with bcrypt
- JWT sessions with NextAuth
- CSRF protection
- Rate limiting recommended (add middleware)
- Environment variables for secrets
- Stripe webhook signature verification
- SQL injection protection (Prisma)

## 🧪 Testing

Run linter:
```bash
npm run lint
```

## 📝 License

MIT License - feel free to use for your projects!

## 🆘 Support

For issues and questions:
1. Check environment variables are correct
2. Verify database is running
3. Check API keys are valid
4. Review logs in Docker: `docker-compose logs -f`

## 🎯 Next Steps

1. **Configure Production Environment**: Set up production database, domains, SSL
2. **Set up Stripe Products**: Create and configure subscription products
3. **Configure Email Provider**: Set up transactional email service
4. **Add Rate Limiting**: Implement rate limiting for API endpoints
5. **Set up Monitoring**: Add error tracking (Sentry, etc.)
6. **Configure CDN**: Set up CDN for static assets
7. **Add Analytics**: Integrate Google Analytics or similar
8. **Customize Branding**: Update colors, fonts, copy
9. **Add More Features**: Implement additional content types, templates, etc.

---

Built with ❤️ using Next.js, Prisma, Stripe, and OpenAI
