'use client'

import { useState, useEffect } from 'react'

const SLIDES = [
  {
    emoji: '✦',
    title: 'Welcome to Arize',
    body: 'Thank you for joining us. You\'ve taken a meaningful step — and we\'re honored to be part of your journey.',
    accent: '#C9A227',
  },
  {
    emoji: '🌿',
    title: 'Built for You',
    body: 'Arize was designed for diverse communities and women navigating spaces where they haven\'t always been seen, heard, or supported. This is a space that gets it.',
    accent: '#4A7C59',
  },
  {
    emoji: '💫',
    title: 'Three Pillars',
    body: 'Be seen. Be heard. Feel connected. Every feature in this app serves one of these three goals — because you deserve all three.',
    accent: '#7BADC4',
  },
  {
    emoji: '👥',
    title: 'The Village',
    body: 'Your community of peers and support. Real conversations in private rooms, with people who understand what you\'re navigating. The village gets stronger together.',
    accent: '#A8C4AF',
  },
  {
    emoji: '🌱',
    title: 'Clarity Coach',
    body: 'Your AI thinking partner — available 24/7 to help you process situations, prepare for hard conversations, and find your next move. You don\'t have to figure it out alone.',
    accent: '#C9A227',
  },
]

export function WelcomeModal() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      const seen = localStorage.getItem('arize_welcomed')
      if (!seen) queueMicrotask(() => setVisible(true))
    } catch {}
  }, [])

  function dismiss() {
    try { localStorage.setItem('arize_welcomed', '1') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  const slide = SLIDES[step]
  const isLast = step === SLIDES.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(10,20,9,0.92)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0',
    }}>
      <div style={{
        width: '100%', maxWidth: '430px',
        background: 'linear-gradient(180deg, #1A2E1E 0%, #0E1C12 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '28px 28px 0 0',
        padding: '32px 28px 40px',
        minHeight: '480px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '32px' }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === step ? '20px' : '6px', height: '6px', borderRadius: '100px',
              background: i === step ? slide.accent : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '24px',
            background: `linear-gradient(135deg, ${slide.accent}30, ${slide.accent}10)`,
            border: `1px solid ${slide.accent}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', marginBottom: '24px',
          }}>
            {slide.emoji}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-playfair)', fontSize: '26px', color: '#F5F0E8',
            fontWeight: 400, lineHeight: 1.2, marginBottom: '16px',
          }}>
            {slide.title}
          </h2>
          <p style={{ fontSize: '14px', color: '#BDB5A0', lineHeight: 1.7, maxWidth: '320px' }}>
            {slide.body}
          </p>
        </div>

        {/* Actions */}
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isLast ? (
            <button
              onClick={dismiss}
              style={{
                width: '100%', background: '#C9A227', color: '#0E1C12',
                border: 'none', borderRadius: '14px', padding: '16px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.02em',
              }}>
              Let&apos;s go →
            </button>
          ) : (
            <>
              <button
                onClick={() => setStep(s => s + 1)}
                style={{
                  width: '100%', background: '#C9A227', color: '#0E1C12',
                  border: 'none', borderRadius: '14px', padding: '16px',
                  fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-dm-sans)',
                }}>
                Next →
              </button>
              <button
                onClick={dismiss}
                style={{
                  width: '100%', background: 'transparent', color: '#BDB5A0',
                  border: 'none', borderRadius: '14px', padding: '12px',
                  fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)',
                }}>
                Skip intro
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
