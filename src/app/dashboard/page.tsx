'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { CreditsDisplay } from '@/components/dashboard/credits-display'
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard'
import { ContentLibrary } from '@/components/dashboard/content-library'
import { ContentGenerator } from '@/components/dashboard/content-generator'
import { BarChart3, Video, PlusCircle } from 'lucide-react'

type Tab = 'analytics' | 'library' | 'create'

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('analytics')

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
        {/* Credits Display */}
        <div className="mb-6">
          <CreditsDisplay />
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-4 px-2 flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`pb-4 px-2 flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'library'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Video className="w-5 h-5" />
              <span className="font-medium">Content Library</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`pb-4 px-2 flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'create'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="font-medium">Create</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        
        {activeTab === 'library' && <ContentLibrary />}
        
        {activeTab === 'create' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Create Content</h1>
              <p className="text-gray-600">Generate AI-powered video content</p>
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
          </div>
        )}
      </main>
    </div>
  )
}
