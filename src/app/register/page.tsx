import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Start creating amazing content with AI</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
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
