import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-purple-600">
            AI Content Generator
          </div>
          <div className="space-x-4">
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
          Create Viral Social Media Content<br />in Seconds with AI
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Generate engaging posts, captions, scripts, and content calendars that drive engagement and grow your audience.
        </p>
        <div className="space-x-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Start Creating Free
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="text-lg px-8">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need to Create Amazing Content
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-2">Social Media Posts</h3>
            <p className="text-gray-600">
              Generate viral-worthy posts for Instagram, Twitter, LinkedIn, and more.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">Captions & Scripts</h3>
            <p className="text-gray-600">
              Create compelling captions and video scripts that capture attention.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">Content Calendars</h3>
            <p className="text-gray-600">
              Plan your content strategy with AI-generated calendars.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">Perfect Replies</h3>
            <p className="text-gray-600">
              Craft engaging replies that build community and drive conversations.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Bios & Profiles</h3>
            <p className="text-gray-600">
              Write memorable bios that showcase your unique value.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Shareable Outputs</h3>
            <p className="text-gray-600">
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
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>© 2026 AI Content Generator. All rights reserved.</p>
      </footer>
    </div>
  )
}
