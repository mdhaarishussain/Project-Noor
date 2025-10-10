"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, MessageCircle, Shield, Heart, Zap } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Logo } from "@/components/logo"
import { HeroBackground } from "@/components/sections/hero-background"
import { AnimatedCharacters } from "@/components/auth/animated-characters"
import { createClient } from "@/lib/supabase/client"
import { signInSchema, type SignInFormData } from "@/lib/auth/schemas"

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [password, setPassword] = useState("")
  
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState('/dashboard')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const r = params.get('redirectTo')
      if (r) setRedirectTo(r)
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [])
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema)
  })

  const rememberMe = watch('remember_me')

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        throw signInError
      }

      router.push(redirectTo)
      router.refresh()
    } catch (err: unknown) {
      console.error('Sign in error:', err)
      const error = err as { message?: string }
      setError(
        error.message === 'Invalid login credentials'
          ? 'The email or password you entered is incorrect. Please try again.'
          : error.message || 'Something went wrong. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setValue('password', e.target.value)
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
        }
      })

      if (error) throw error
    } catch (err: unknown) {
      console.error('Google sign in error:', err)
      setError('Unable to sign in with Google. Please try again.')
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: MessageCircle,
      title: "Continue Your Conversations",
      description: "Pick up right where you left off with your AI companion"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your mental health data is encrypted and always confidential"
    },
    {
      icon: Heart,
      title: "Personalized Support",
      description: "AI that remembers your journey and adapts to your needs"
    },
    {
      icon: Zap,
      title: "Instant Access",
      description: "Get immediate support whenever you need someone to talk to"
    }
  ]

  const testimonials = [
    {
      text: "Bondhu remembers our conversations and helps me process my thoughts better each day.",
      author: "Arjun K.",
      location: "22, Delhi",
      avatar: "AK"
    },
    {
      text: "It's like having a friend who's always there when I need to talk through my feelings.",
      author: "Priya S.",
      location: "21, Mumbai",
      avatar: "PS"
    }
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-background to-secondary/20 relative overflow-hidden">
      {/* Background Animation */}
      <HeroBackground intensity="subtle" className="opacity-30" />
      
      <div className="relative z-10 h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Animated Characters */}
        <div className="hidden lg:flex lg:w-3/5 flex-col justify-between bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 xl:p-10 text-primary-foreground relative overflow-hidden">
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-20"
          >
            <Link href="/" className="inline-block">
              <Logo width={200} height={65} />
            </Link>
          </motion.div>

          {/* Animated Characters */}
          <div className="relative z-20">
            <AnimatedCharacters 
              showPassword={showPassword} 
              isTyping={isTyping}
              password={password}
            />
          </div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="relative z-20 flex items-center gap-6 text-xs text-primary-foreground/60"
          >
            <Link href="/privacy" className="hover:text-primary-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-primary-foreground transition-colors">
              Contact
            </Link>
          </motion.div>

          {/* Decorative elements */}
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="absolute top-1/4 right-1/4 size-64 bg-primary-foreground/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 size-96 bg-primary-foreground/5 rounded-full blur-3xl" />
        </div>

        {/* Right Panel - Form */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-6 sm:p-8 lg:p-10 bg-background/80 backdrop-blur-sm h-screen overflow-y-auto border-l border-border/20">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md space-y-5"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-4">
              <Link href="/" className="inline-block">
                <Logo width={140} height={46} className="mx-auto" />
              </Link>
            </div>

            {/* Form Header */}
            <div className="text-center space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Sign in to continue</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Access your account and reconnect with your AI companion
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2.5 rounded-lg text-xs sm:text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs sm:text-sm font-medium text-foreground">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={isLoading}
                  className="h-10 sm:h-11"
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs sm:text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    error={errors.password?.message}
                    disabled={isLoading}
                    className="h-10 sm:h-11 pr-10"
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember_me"
                    checked={rememberMe || false}
                    onCheckedChange={(checked) => setValue('remember_me', checked as boolean)}
                    disabled={isLoading}
                    className="mt-0.5"
                  />
                  <label htmlFor="remember_me" className="text-xs sm:text-sm text-foreground">
                    Remember me
                  </label>
                </div>
                <Link 
                  href="/forgot-password"
                  className="text-xs sm:text-sm text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-10 sm:h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-medium">OR CONTINUE WITH</span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full h-10 sm:h-11 text-sm"
              onClick={handleGoogleSignIn}
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

            {/* Sign Up Link */}
            <p className="text-center text-xs sm:text-sm text-muted-foreground">
              New to Bondhu?{" "}
              <Link href="/sign-up" className="text-primary hover:underline font-medium">
                Create an account
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
