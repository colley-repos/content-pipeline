import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-purple-600">
            Synthia
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Stop Wasting Hours<br />Creating Content
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          You want to be the next big influencer, not spend all day editing. We give you your time back with high-quality content generated on-the-fly. Supply your scripts or go 100% hands-off.
        </p>
        <div className="space-x-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Get 3 Free Posts
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="text-lg px-8">
              See Pricing
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          30 minutes of content/month for $29. No credit card required to start.
        </p>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need to Grow Your Audience
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Generate a month&apos;s worth of posts in minutes, not hours. Get your time back.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Your Voice, Your Brand</h3>
            <p className="text-muted-foreground">
              Bring your own scripts or let AI create everything. Either way, it sounds like you.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Made for Social</h3>
            <p className="text-muted-foreground">
              Instagram, TikTok, YouTube Shorts - optimized content for every platform.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Actually Affordable</h3>
            <p className="text-muted-foreground">
              $29/month for 30 minutes of content. That&apos;s less than a Netflix subscription.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Bios & Profiles</h3>
            <p className="text-muted-foreground">
              Write memorable bios that showcase your unique value.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Shareable Outputs</h3>
            <p className="text-muted-foreground">
              Share your content with built-in viral CTAs.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Create Amazing Content?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of creators using AI to grow their audience.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p>© 2026 AI Content Generator. All rights reserved.</p>
      </footer>
    </div>
  )
}
