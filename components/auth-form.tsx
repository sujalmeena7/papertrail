'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Receipt } from 'lucide-react'

const OTP_ERROR_MESSAGES: Record<string, string> = {
  INVALID_OTP: 'That code is incorrect. Please try again.',
  OTP_EXPIRED: 'That code has expired. Request a new one below.',
  TOO_MANY_ATTEMPTS: 'Too many incorrect attempts. Request a new code below.',
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [pendingEmail, setPendingEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const isSignUp = mode === 'sign-up'

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        setPendingEmail(email)
        setStep('otp')
        return
      }
      setError(error.message ?? 'Something went wrong')
      return
    }

    if (isSignUp) {
      setPendingEmail(email)
      setStep('otp')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOtpLoading(true)

    const { error } = await authClient.emailOtp.verifyEmail({
      email: pendingEmail,
      otp,
    })

    setOtpLoading(false)

    if (error) {
      setError((error.code && OTP_ERROR_MESSAGES[error.code]) ?? error.message ?? 'Something went wrong')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleResendOtp = async () => {
    setError(null)
    setResendLoading(true)

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: pendingEmail,
      type: 'email-verification',
    })

    setResendLoading(false)

    if (error) {
      setError(error.message ?? 'Could not resend code')
      return
    }

    setResendCooldown(30)
  }

  const handleGoogleAuth = async () => {
    setGoogleLoading(true)
    setError(null)
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    })

    if (error) {
      setError(error.message ?? 'Google authentication failed')
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full flex bg-background">
      {/* Left side: Premium Branding (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-zinc-950 text-white">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950" />
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[100px] mix-blend-screen pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="bg-white text-black p-1.5 rounded-md">
            <Receipt className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-lg tracking-tight">Papertrail</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-medium tracking-tight mb-4">
            Every business receipt, found and filed automatically.
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Stop digging through your inbox for invoices. Connect your email and let AI extract and organize everything you need for tax season, instantly.
          </p>
        </div>

        <div className="relative z-10 text-sm text-zinc-500 font-medium">
          © {new Date().getFullYear()} Papertrail Inc.
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[400px] flex flex-col">
          {/* Mobile logo only */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <Receipt className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-lg tracking-tight">Papertrail</span>
          </div>

          {step === 'otp' ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
                  Check your email
                </h1>
                <p className="text-muted-foreground">
                  Enter the 6-digit code we sent to <strong>{pendingEmail}</strong> to finish
                  {isSignUp ? ' creating your account.' : ' signing in.'}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2.5">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    className="py-5 text-center text-lg tracking-[0.5em]"
                  />
                </div>

                {error && (
                  <div className="p-3 mt-1 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={otpLoading || otp.length !== 6} className="w-full mt-2 py-5 text-base">
                  {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify code'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  disabled={resendLoading || resendCooldown > 0}
                  onClick={handleResendOtp}
                  className="w-full"
                >
                  {resendLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : resendCooldown > 0
                      ? `Resend code (${resendCooldown}s)`
                      : 'Resend code'}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground text-center mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials')
                    setOtp('')
                    setError(null)
                  }}
                  className="text-foreground font-semibold underline-offset-4 hover:underline"
                >
                  Back to {isSignUp ? 'sign up' : 'sign in'}
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
                  {isSignUp ? 'Create an account' : 'Welcome back'}
                </h1>
                <p className="text-muted-foreground">
                  {isSignUp
                    ? 'Enter your details below to get started.'
                    : 'Sign in to your account to continue.'}
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full mb-6 py-5 text-base shadow-sm bg-background hover:bg-muted/50 transition-colors relative"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground font-medium">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {isSignUp && (
                  <div className="flex flex-col gap-2.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      placeholder="John Doe"
                      className="py-5"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="py-5"
                  />
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {!isSignUp && (
                      <Link href="#" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                    className="py-5"
                  />
                </div>

                {error && (
                  <div className="p-3 mt-1 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading || googleLoading} className="w-full mt-2 py-5 text-base">
                  {loading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : isSignUp
                      ? 'Create account'
                      : 'Sign in to Papertrail'}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground text-center mt-8">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Link
                  href={isSignUp ? '/sign-in' : '/sign-up'}
                  className="text-foreground font-semibold underline-offset-4 hover:underline"
                >
                  {isSignUp ? 'Sign in' : 'Create one now'}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
