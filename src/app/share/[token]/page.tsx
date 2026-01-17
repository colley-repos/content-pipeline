import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default async function SharePage({ params }: { params: { token: string } }) {
  const content = await prisma.content.findUnique({
    where: { shareToken: params.token },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!content) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {content.type.replace('_', ' ')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Created by {content.user.name || 'Anonymous'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-6 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {content.output}
              </pre>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold mb-4">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <p>Want to create content like this?</p>
              </div>
              <div className="flex justify-center space-x-4">
                <Link href="/register">
                  <Button size="lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
