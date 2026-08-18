'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, ExternalLink, ShieldCheck } from 'lucide-react'
import {
  PRIVACY_URL,
  PRIVACY_VERSION,
  TERMS_URL,
  TERMS_VERSION,
} from '@/lib/legal/consent'

export function ConsentForm() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!accepted || saving) return

    setError('')
    setSaving(true)

    try {
      const response = await fetch('/api/legal-consent', { method: 'POST' })
      const result = await response.json() as { next?: string; error?: string }

      if (!response.ok || !result.next) {
        throw new Error(result.error || 'Unable to save your agreement.')
      }

      router.replace(result.next)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save your agreement.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div style={{
        width: '58px', height: '58px', borderRadius: '18px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(201,162,39,0.14)', color: '#C9A227',
      }}>
        <ShieldCheck size={30} aria-hidden="true" />
      </div>

      <div>
        <p style={{
          color: '#C9A227', fontSize: '12px', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px',
        }}>
          Before you continue
        </p>
        <h1 style={{
          color: '#F5F0E8', fontFamily: 'var(--font-playfair)', fontSize: '30px',
          fontWeight: 400, lineHeight: 1.2, marginBottom: '12px',
        }}>
          Review and agree
        </h1>
        <p style={{ color: '#BDB5A0', fontSize: '15px', lineHeight: 1.65 }}>
          Please review Arize&apos;s legal documents. You must accept them before entering the app.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {[
          { label: 'Terms of Use', url: TERMS_URL, version: TERMS_VERSION },
          { label: 'Privacy Policy', url: PRIVACY_URL, version: PRIVACY_VERSION },
        ].map((document) => (
          <a
            key={document.label}
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
              padding: '15px 16px', borderRadius: '12px', color: '#F5F0E8', textDecoration: 'none',
              background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span>
              <span style={{ display: 'block', fontSize: '15px', fontWeight: 600 }}>{document.label}</span>
              <span style={{ color: '#BDB5A0', fontSize: '12px' }}>Version {document.version}</span>
            </span>
            <ExternalLink size={18} color="#C9A227" aria-hidden="true" />
          </a>
        ))}
      </div>

      <label style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer',
        padding: '16px', borderRadius: '12px',
        background: accepted ? 'rgba(74,124,89,0.18)' : 'rgba(255,255,255,0.035)',
        border: `1px solid ${accepted ? 'rgba(107,158,122,0.55)' : 'rgba(255,255,255,0.1)'}`,
      }}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          required
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />
        <span style={{
          width: '22px', height: '22px', flex: '0 0 22px', marginTop: '1px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px',
          background: accepted ? '#C9A227' : 'transparent',
          border: accepted ? '1px solid #C9A227' : '1px solid rgba(255,255,255,0.35)',
          color: '#0E1C12',
        }} aria-hidden="true">
          {accepted && <Check size={16} strokeWidth={3} />}
        </span>
        <span style={{ color: '#F5F0E8', fontSize: '14px', lineHeight: 1.55 }}>
          I confirm that I am at least 18 years old, agree to the Terms of Use, and acknowledge the Privacy Policy.
        </span>
      </label>

      {error && (
        <p role="alert" style={{
          color: '#E4846A', background: 'rgba(196,97,74,0.12)',
          border: '1px solid rgba(196,97,74,0.25)', borderRadius: '10px',
          padding: '11px 13px', fontSize: '13px',
        }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!accepted || saving}
        style={{
          width: '100%', padding: '15px', borderRadius: '13px', border: 'none',
          background: accepted ? '#C9A227' : 'rgba(201,162,39,0.32)',
          color: accepted ? '#0E1C12' : 'rgba(245,240,232,0.55)',
          fontFamily: 'var(--font-dm-sans)', fontSize: '15px', fontWeight: 700,
          cursor: accepted && !saving ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {saving ? 'Saving agreement…' : <><span>Agree and continue</span><ArrowRight size={17} /></>}
      </button>

      <p style={{ color: '#8F8A7E', fontSize: '11px', lineHeight: 1.5, textAlign: 'center' }}>
        Arize records the date and document versions you accept.
      </p>
    </form>
  )
}
