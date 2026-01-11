'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ContentGenerator } from '@/components/dashboard/content-generator'
import { CreditsDisplay } from '@/components/dashboard/credits-display'

export default function DashboardPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <div className="text-2xl font-bold text-purple-600">
              AI Content Generator
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Content Dashboard</h1>
          <p className="text-gray-600">Create amazing content with AI</p>
        </div>

        {/* Credits Display */}
        <div className="mb-6">
          <CreditsDisplay />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ContentGenerator
            type="social_post"
            title="Social Media Post"
            description="Generate engaging social media posts"
          />
          <ContentGenerator
            type="caption"
            title="Caption"
            description="Create compelling captions for images"
          />
          <ContentGenerator
            type="script"
            title="Video Script"
            description="Write engaging video scripts"
          />
          <ContentGenerator
            type="bio"
            title="Bio"
            description="Craft a memorable bio"
          />
          <ContentGenerator
            type="reply"
            title="Reply"
            description="Generate thoughtful replies"
          />
          <ContentGenerator
            type="content_calendar"
            title="Content Calendar"
            description="Plan your content strategy"
          />
        </div>
      </main>
    </div>
  )
}
