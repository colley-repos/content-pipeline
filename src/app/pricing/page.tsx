'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

export default function PricingPage() {
  const router = useRouter()

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        alert('Please sign in first')
        router.push('/login')
        return
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      alert('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <Link href="/">
            <div className="text-2xl font-bold text-purple-600">
              AI Content Generator
            </div>
          </Link>
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

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">Choose the plan that works for you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Monthly</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Unlimited content generation</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>All content types</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Shareable outputs</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Content history</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Email support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleSubscribe('monthly')}
              >
                Get Started
              </Button>
            </CardFooter>
          </Card>

          {/* Yearly Plan */}
          <Card className="relative border-purple-600 border-2">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                SAVE 17%
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Yearly</CardTitle>
              <CardDescription>Best value for serious creators</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$290</span>
                <span className="text-gray-600">/year</span>
              </div>
              <p className="text-sm text-green-600 font-medium">
                Save $58 per year
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Everything in Monthly</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Custom templates</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Weekly content packs</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleSubscribe('yearly')}
              >
                Get Started
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  )
}
