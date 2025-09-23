"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"

import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { signUpSchema, type SignUpFormData } from "@/lib/auth/schemas"

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  })

  const watchedValues = watch(['privacy_policy', 'terms_of_service', 'age_confirmation'])

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Sign up with Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          }
        }
      })

      if (signUpError) {
        throw signUpError
      }

      if (authData.user) {
        // Update or create profile record (use upsert to handle trigger-created profiles)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: data.full_name,
            onboarding_completed: false,
            personality_data: {}
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          console.error('Profile error details:', JSON.stringify(profileError, null, 2))
          // Don't throw here, user is created, just continue
        } else {
          console.log('Profile created/updated successfully for user:', authData.user.id)
        }

        // Redirect to personality questionnaire
        router.push('/onboarding/personality')
        router.refresh()
      }
    } catch (err: unknown) {
      console.error('Sign up error:', err)
      const error = err as { message?: string }
      setError(
        error.message === 'User already registered'
          ? 'An account with this email already exists. Please sign in instead.'
          : error.message || 'Something went wrong. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent('/onboarding/personality')}`
        }
      })

      if (error) throw error
    } catch (err: unknown) {
      console.error('Google sign up error:', err)
      setError('Unable to sign up with Google. Please try again.')
      setIsLoading(false)
    }
  }

  const testimonials = [
    {
      text: "The personality assessment was surprisingly accurate. Bondhu really gets who I am.",
      author: "Sneha R., 20, Bangalore",
      avatar: "SR"
    },
    {
      text: "Finally, an AI that doesn't feel robotic. It's like talking to a caring friend.",
      author: "Vikram M., 23, Pune",
      avatar: "VM"
    }
  ]

  const benefits = [
    "🎮 Gamified personality discovery",
    "🤖 AI that grows with you",
    "💬 Safe space for authentic conversations",
    "📱 Always available, never judges"
  ]

  return (
    <AuthLayout
      title="Start your journey with Bondhu"
      subtitle="Join thousands discovering better mental health through AI companionship"
      testimonials={testimonials}
      benefits={benefits}
      variant="sign-up"
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground">
            Begin your personalized mental health journey
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium">
              Full name
            </label>
            <Input
              id="full_name"
              type="text"
              placeholder="Your full name"
              {...register('full_name')}
              error={errors.full_name?.message}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              error={errors.email?.message}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Create password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                {...register('password')}
                error={errors.password?.message}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Min 8 chars, 1 number, 1 special character
            </p>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy_policy"
                checked={watchedValues[0] || false}
                onCheckedChange={(checked) => setValue('privacy_policy', checked as boolean)}
                disabled={isLoading}
              />
              <label htmlFor="privacy_policy" className="text-sm leading-5">
                I agree to Bondhu's{" "}
                <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.privacy_policy && (
              <p className="text-xs text-destructive ml-6">{errors.privacy_policy.message}</p>
            )}

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms_of_service"
                checked={watchedValues[1] || false}
                onCheckedChange={(checked) => setValue('terms_of_service', checked as boolean)}
                disabled={isLoading}
              />
              <label htmlFor="terms_of_service" className="text-sm leading-5">
                I accept the{" "}
                <Link href="/terms" className="text-primary hover:underline" target="_blank">
                  Terms of Service
                </Link>
              </label>
            </div>
            {errors.terms_of_service && (
              <p className="text-xs text-destructive ml-6">{errors.terms_of_service.message}</p>
            )}

            <div className="flex items-start space-x-3">
              <Checkbox
                id="age_confirmation"
                checked={watchedValues[2] || false}
                onCheckedChange={(checked) => setValue('age_confirmation', checked as boolean)}
                disabled={isLoading}
              />
              <label htmlFor="age_confirmation" className="text-sm leading-5">
                I confirm I am 18 years or older
              </label>
            </div>
            {errors.age_confirmation && (
              <p className="text-xs text-destructive ml-6">{errors.age_confirmation.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account & Start Journey'
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
