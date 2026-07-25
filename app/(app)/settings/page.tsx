'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, AtSign, LogOut, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import { getUsernameError, normalizeUsername } from '@/lib/profile/username'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [originalName, setOriginalName] = useState('')
  const [originalUsername, setOriginalUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/sign-in'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, username')
        .eq('id', user.id)
        .single()
      if (profile) {
        setName(profile.name ?? '')
        setUsername(profile.username ?? '')
        setOriginalName(profile.name ?? '')
        setOriginalUsername(profile.username ?? '')
      }
    }
    load()
  }, [])

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    setUsernameError('')
    setSaved(false)

    const trimmedUsername = normalizeUsername(username)
    const validationError = getUsernameError(username)
    if (validationError) {
      setUsernameError(validationError)
      setSaving(false)
      return
    }

    if (trimmedUsername && trimmedUsername !== originalUsername) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmedUsername)
        .neq('id', userId)
        .maybeSingle()
      if (existing) {
        setUsernameError('That username is already taken')
        setSaving(false)
        return
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim() || null,
        username: trimmedUsername || null,
      })
      .eq('id', userId)
    if (error) {
      setUsernameError(error.code === '23505' ? 'That username is already taken' : 'Unable to save your profile')
      setSaving(false)
      return
    }

    setOriginalName(name.trim())
    setOriginalUsername(trimmedUsername)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  const hasChanges = name.trim() !== originalName || username.trim().toLowerCase() !== originalUsername

  return (
    <div style={{ padding: '24px', maxWidth: '430px', margin: '0 auto' }}>
      <Link href="/home" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: '#BDB5A0', textDecoration: 'none', fontSize: '13px', marginBottom: '18px' }}>
        <ArrowLeft size={17} /> Back to Home
      </Link>
      <h1 style={{
        fontFamily: 'var(--font-playfair)',
        fontSize: '26px', color: '#F5F0E8',
        fontWeight: 500, marginBottom: '8px',
      }}>
        Profile & Settings
      </h1>
      <p style={{ fontSize: '13px', color: '#BDB5A0', marginBottom: '32px' }}>
        Update how you appear in the Village
      </p>

      {/* Name */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A227', display: 'block', marginBottom: '8px' }}>
          Display Name
        </label>
        <div style={{ position: 'relative' }}>
          <User size={16} color="#BDB5A0" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#1A2E1E', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '14px 14px 14px 40px',
              color: '#F5F0E8', fontSize: '15px', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Username */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A227', display: 'block', marginBottom: '8px' }}>
          Username
        </label>
        <div style={{ position: 'relative' }}>
          <AtSign size={16} color="#BDB5A0" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={username}
            onChange={e => {
              setUsernameError('')
              setUsername(e.target.value.replace(/[^a-zA-Z0-9._]/g, '').slice(0, 20))
            }}
            placeholder="your_handle"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#1A2E1E', border: `1px solid ${usernameError ? 'rgba(196,97,74,0.6)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '12px', padding: '14px 14px 14px 40px',
              color: '#F5F0E8', fontSize: '15px', outline: 'none',
            }}
          />
        </div>
        {usernameError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <AlertCircle size={13} color="#C4614A" />
            <span style={{ fontSize: '12px', color: '#C4614A' }}>{usernameError}</span>
          </div>
        )}
        <p style={{ fontSize: '12px', color: '#BDB5A0', marginTop: '6px' }}>
          Letters, numbers, dots, and underscores only · max 20 chars
        </p>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        style={{
          width: '100%', padding: '15px',
          background: saved ? '#4A7C59' : hasChanges ? '#C9A227' : 'rgba(255,255,255,0.08)',
          color: saved ? '#F5F0E8' : hasChanges ? '#0E1C12' : '#BDB5A0',
          border: 'none', borderRadius: '12px',
          fontSize: '15px', fontWeight: 600,
          cursor: hasChanges ? 'pointer' : 'default',
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving…' : 'Save Changes'}
      </button>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '36px 0' }} />

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        style={{
          width: '100%', padding: '15px',
          background: 'transparent',
          border: '1px solid rgba(196,97,74,0.3)',
          borderRadius: '12px', color: '#C4614A',
          fontSize: '15px', fontWeight: 500,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  )
}
