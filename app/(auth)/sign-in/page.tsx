'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/home')
      router.refresh()
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div style={{
      background: '#0A1409', minHeight: '100dvh', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img src="/flower%20nobg.png" alt="Arize" style={{ width: '72px', height: '72px', objectFit: 'contain', display: 'block', margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#F5F0E8', fontWeight: 400, marginBottom: '6px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '13px', color: '#BDB5A0' }}>
            Sign in to your Arize account
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(26,46,30,0.8)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px', padding: '28px',
        }}>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            style={{
              width: '100%', padding: '13px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#F5F0E8', fontSize: '14px', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              cursor: 'pointer', marginBottom: '20px', fontFamily: 'var(--font-dm-sans)',
              opacity: googleLoading ? 0.6 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '11px', color: '#BDB5A0', letterSpacing: '0.06em' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#BDB5A0', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@work.com"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F5F0E8', fontSize: '14px', outline: 'none',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#BDB5A0', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '12px 44px 12px 16px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#F5F0E8', fontSize: '14px', outline: 'none',
                    fontFamily: 'var(--font-dm-sans)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#BDB5A0',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#C4614A', padding: '10px 14px', background: 'rgba(196,97,74,0.1)', borderRadius: '8px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: '#C9A227', color: '#0E1C12', border: 'none',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontFamily: 'var(--font-dm-sans)', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Signing in…' : <><span>Sign in</span> <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#BDB5A0' }}>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" style={{ color: '#C9A227', textDecoration: 'none', fontWeight: 500 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
