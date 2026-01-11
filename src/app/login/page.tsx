import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button variant="outline" className="w-full" onClick={() => alert('OAuth not configured')}>
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full" onClick={() => alert('OAuth not configured')}>
                Continue with GitHub
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
          <Link href="/" className="text-sm text-center text-muted-foreground hover:underline">
            Back to home
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
