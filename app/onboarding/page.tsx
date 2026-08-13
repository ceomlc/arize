'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, Target, Users, TrendingUp, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getUsernameError, normalizeUsername } from '@/lib/profile/username'

const steps = [
  {
    icon: <Sparkles size={28} color="#C9A227" />,
    iconBg: 'rgba(201,162,39,0.15)',
    title: 'Welcome to Arize',
    body: 'Arize is your private space to manage stress, set intentional goals, and stay emotionally grounded as a Black professional in corporate America.',
    sub: 'Everything here is yours. Private, secure, and built with your experience in mind.',
  },
  {
    icon: <Target size={28} color="#6B9E7A" />,
    iconBg: 'rgba(74,124,89,0.2)',
    title: 'Meet your goals',
    body: 'Every week starts with a Sunday goal session — a moment to set intentions, not react to urgency. Daily resets keep you grounded. Friday reflections close the loop.',
    sub: 'Progress is tracked. Wins are celebrated. Nothing slips through.',
  },
  {
    icon: <TrendingUp size={28} color="#E8B84B" />,
    iconBg: 'rgba(232,184,75,0.15)',
    title: 'Understand your patterns',
    body: 'Your Daily Reset data builds your personal Pattern Map over time — showing you what lifts you, what drains you, and how resilient you actually are.',
    sub: 'Your data is yours. It never leaves your account.',
  },
  {
    icon: <Users size={28} color="#7BADC4" />,
    iconBg: 'rgba(123,173,196,0.15)',
    title: 'Find your village',
    body: 'The Village is a private community organized around your lived experience — rooms like First Gen in Finance, Manager Mode, and Navigating the Room.',
    sub: 'Real people who get it. Safe, moderated, and always on your side.',
  },
  {
    icon: <MessageCircle size={28} color="#A8C4AF" />,
    iconBg: 'rgba(74,124,89,0.15)',
    title: 'Your Clarity Coach',
    body: 'Clarity is your AI thinking partner that’s there 24/7—available before a hard conversation, after a meeting that left you feeling unseen, or whenever you need to process.',
    sub: 'Culturally aware. Affirming. Never a therapist — always a coach.',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [saving, setSaving] = useState(false)
  const [usernameError, setUsernameError] = useState('')

  const isProfileStep = step === steps.length

  async function handleComplete() {
    setUsernameError('')
    const normalizedUsername = normalizeUsername(username)
    const validationError = getUsernameError(username)
    if (validationError) {
      setUsernameError(validationError)
      return
    }
    if (normalizedUsername) {
      // Check uniqueness
      const supabase = createClient()
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', normalizedUsername).maybeSingle()
      if (existing) { setUsernameError('That username is taken — try another.'); return }
    }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('profiles').update({
        name: name || undefined,
        username: normalizedUsername || undefined,
        role: role || undefined,
        company: company || undefined,
        onboarded: true,
      }).eq('id', user.id)
      if (error) {
        setSaving(false)
        setUsernameError(error.code === '23505' ? 'That username is taken — try another.' : 'Unable to save your profile')
        return
      }
    }
    router.push('/home')
    router.refresh()
  }

  const current = steps[step]

  return (
    <div style={{
      background: '#0A1409', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '40px' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              height: '4px', borderRadius: '100px', transition: 'all 0.3s',
              background: i <= step ? '#C9A227' : 'rgba(255,255,255,0.12)',
              width: i === step ? '24px' : '8px',
            }} />
          ))}
          <div style={{
            height: '4px', borderRadius: '100px', transition: 'all 0.3s',
            background: isProfileStep ? '#C9A227' : 'rgba(255,255,255,0.12)',
            width: isProfileStep ? '24px' : '8px',
          }} />
        </div>

        {!isProfileStep ? (
          <div>
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: current.iconBg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '24px',
            }}>
              {current.icon}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#F5F0E8',
              fontWeight: 400, marginBottom: '16px', lineHeight: 1.2,
            }}>{current.title}</h2>
            <p style={{ fontSize: '15px', color: '#F5F0E8', lineHeight: 1.7, marginBottom: '16px' }}>
              {current.body}
            </p>
            <p style={{ fontSize: '13px', color: '#BDB5A0', lineHeight: 1.6, marginBottom: '40px' }}>
              {current.sub}
            </p>
            <button
              onClick={() => setStep(s => s + 1)}
              style={{
                width: '100%', padding: '16px', borderRadius: '14px',
                background: '#C9A227', color: '#0E1C12', border: 'none',
                fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {step < steps.length - 1 ? 'Next' : 'Set up my profile'} <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '26px', color: '#F5F0E8', fontWeight: 400, marginBottom: '8px' }}>
              Tell us about yourself
            </h2>
            <p style={{ fontSize: '13px', color: '#BDB5A0', marginBottom: '28px', lineHeight: 1.5 }}>
              This helps Arize personalize your experience. You can always update this later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'First name', value: name, set: setName, placeholder: 'Jordan', required: true },
                { label: 'Job title / Role', value: role, set: setRole, placeholder: 'Senior Analyst', required: false },
                { label: 'Company', value: company, set: setCompany, placeholder: 'Optional', required: false },
              ].map((field) => (
                <div key={field.label}>
                  <label style={{ fontSize: '11px', color: '#BDB5A0', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    {field.label}{!field.required && ' (optional)'}
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#F5F0E8', fontSize: '14px', outline: 'none',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  />
                </div>
              ))}

              {/* Username */}
              <div>
                <label style={{ fontSize: '11px', color: '#BDB5A0', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Username (optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#BDB5A0', fontSize: '14px', pointerEvents: 'none' }}>@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => {
                      setUsernameError('')
                      setUsername(e.target.value.replace(/[^a-z0-9_.]/gi, '').toLowerCase())
                    }}
                    placeholder="yourhandle"
                    maxLength={20}
                    style={{
                      width: '100%', padding: '13px 16px 13px 28px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${usernameError ? 'rgba(196,97,74,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      color: '#F5F0E8', fontSize: '14px', outline: 'none',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  />
                </div>
                {usernameError && (
                  <p style={{ fontSize: '12px', color: '#C4614A', marginTop: '6px' }}>{usernameError}</p>
                )}
                <p style={{ fontSize: '11px', color: '#BDB5A0', marginTop: '5px' }}>
                  Shown in The Village. Letters, numbers, dots, underscores only.
                </p>
              </div>
            </div>

            <button
              onClick={handleComplete}
              disabled={saving || !name.trim()}
              style={{
                width: '100%', padding: '16px', borderRadius: '14px',
                background: '#C9A227', color: '#0E1C12', border: 'none',
                fontSize: '15px', fontWeight: 600, cursor: !name.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontFamily: 'var(--font-dm-sans)', opacity: (!name.trim() || saving) ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : <><span>Enter Arize</span> <Sparkles size={16} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
