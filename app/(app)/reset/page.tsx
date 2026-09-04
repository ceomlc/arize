'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { History } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { MoodType, TimeOfDay } from '@/lib/types'

const moods: { id: MoodType; emoji: string; label: string; score: number; bg: string }[] = [
  { id: 'tense', emoji: '😤', label: 'Tense', score: 1, bg: 'rgba(196,97,74,0.2)' },
  { id: 'meh', emoji: '😐', label: 'Meh', score: 2, bg: 'rgba(201,162,39,0.2)' },
  { id: 'steady', emoji: '🌿', label: 'Steady', score: 3, bg: 'rgba(107,158,122,0.25)' },
  { id: 'grounded', emoji: '✨', label: 'Grounded', score: 4, bg: 'rgba(74,124,89,0.3)' },
  { id: 'thriving', emoji: '🌟', label: 'Thriving', score: 5, bg: 'rgba(123,173,196,0.2)' },
]

const EMOTION_TAGS = [
  'Overwhelmed', 'Focused', 'Undervalued', 'Motivated', 'Anxious',
  'Invisible', 'Resilient', 'Burned out', 'Clear', 'Hopeful',
  'Frustrated', 'Energized', 'Disconnected', 'Proud', 'Drained',
]

const TIME_CONFIG: Record<TimeOfDay, { label: string; heading: string; prompts: string[]; cta: string }> = {
  morning: {
    label: 'Morning Reset',
    heading: '"Where are you landing this morning?"',
    prompts: [
      "What would make today feel like a win, even a small one?",
      "What are you carrying into this day that you'd like to set down?",
      "Where do you most need to protect your energy today?",
      "What would it mean to show up fully for yourself today?",
    ],
    cta: 'Complete Reset → Start My Day',
  },
  midday: {
    label: 'Midday Check-In',
    heading: '"How\'s the day going so far?"',
    prompts: [
      "What's been your biggest win this morning?",
      "What do you need to let go of for the rest of the day?",
      "Is there something you've been avoiding that needs your attention?",
      "What would make this afternoon feel intentional?",
    ],
    cta: 'Log Midday Check-In',
  },
  evening: {
    label: 'Evening Wind Down',
    heading: '"How are you closing out today?"',
    prompts: [
      "What are you most proud of today?",
      "What would you do differently tomorrow?",
      "What's one thing you're grateful for from today?",
      "How are you feeling as you step away from work?",
    ],
    cta: 'Close Out My Day',
  },
}

export default function DailyResetPage() {
  const router = useRouter()
  const supabase = createClient()

  const hour = new Date().getHours()
  const defaultTime: TimeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'midday' : 'evening'

  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(defaultTime)
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [energy, setEnergy] = useState(5)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [journalText, setJournalText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const config = TIME_CONFIG[timeOfDay]
  const todayPrompt = config.prompts[new Date().getDay() % config.prompts.length]
  const energyLabel = energy <= 2 ? 'Drained' : energy <= 4 ? 'Low' : energy <= 6 ? 'Moderate' : energy <= 8 ? 'Good' : 'Energized'

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleSubmit() {
    setError('')
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/sign-in'); return }

    const moodScore = moods.find(m => m.id === selectedMood)?.score ?? 3

    const { error: insertError } = await supabase.from('check_ins').insert({
      user_id: user.id,
      mood: selectedMood ?? 'steady',
      mood_score: moodScore,
      energy,
      emotion_tags: selectedTags,
      journal_text: journalText || null,
      time_of_day: timeOfDay,
    })

    if (insertError) { setError('Something went wrong. Please try again.'); setSaving(false); return }

    if (timeOfDay === 'morning') {
      const today = new Date().toISOString().split('T')[0]
      const { data: profile } = await supabase.from('profiles').select('streak_count, last_checkin_date').eq('id', user.id).single()
      if (profile) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const newStreak = profile.last_checkin_date === yesterday.toISOString().split('T')[0] ? (profile.streak_count ?? 0) + 1 : 1
        await supabase.from('profiles').update({ streak_count: newStreak, last_checkin_date: today }).eq('id', user.id)
      }
    }

    router.push('/reset/complete')
  }

  return (
    <div style={{ background: '#0E1C12', minHeight: '100%', paddingBottom: '16px' }}>

      {/* Time of day selector */}
      <div style={{ padding: '16px 24px 0' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px' }}>
          {(['morning', 'midday', 'evening'] as TimeOfDay[]).map(t => (
            <button
              key={t}
              onClick={() => { setTimeOfDay(t); setSelectedMood(null); setSelectedTags([]); setJournalText('') }}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: '9px', border: 'none',
                background: timeOfDay === t ? '#1A2E1E' : 'transparent',
                color: timeOfDay === t ? '#F5F0E8' : '#BDB5A0',
                fontSize: '11px', fontWeight: timeOfDay === t ? 600 : 400,
                cursor: 'pointer', fontFamily: 'var(--font-dm-sans)',
                boxShadow: timeOfDay === t ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {t === 'morning' ? '🌅 Morning' : t === 'midday' ? '☀️ Midday' : '🌙 Evening'}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '16px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227' }}>
            {config.label}
          </p>
          <Link href="/reset/history" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#A8C4AF', fontSize: '11px', textDecoration: 'none' }}>
            <History size={14} /> History
          </Link>
        </div>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: '#F5F0E8', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3, marginBottom: '6px' }}>
          {config.heading}
        </h2>
        <p style={{ fontSize: '13px', color: '#BDB5A0', lineHeight: 1.5 }}>
          This is your space. No wrong answers here.
        </p>
      </div>

      {/* Mood */}
      <div style={{ margin: '20px 24px 0' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '14px' }}>
          Current Mood
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {moods.map(mood => (
            <button key={mood.id} onClick={() => setSelectedMood(mood.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: mood.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                border: selectedMood === mood.id ? '2px solid #C9A227' : '2px solid transparent',
                transition: 'all 0.2s', transform: selectedMood === mood.id ? 'scale(1.08)' : 'scale(1)',
              }}>{mood.emoji}</div>
              <span style={{ fontSize: '9px', letterSpacing: '0.03em', color: selectedMood === mood.id ? '#C9A227' : '#BDB5A0' }}>
                {mood.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div style={{ margin: '24px 24px 0' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '14px' }}>
          Energy Level
        </p>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '100px', background: 'linear-gradient(90deg, #4A7C59, #C9A227)', width: `${energy * 10}%`, transition: 'width 0.15s' }} />
          </div>
          {/* Thumb indicator */}
          <div style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            left: `calc(${energy * 10}% - 12px)`,
            width: '24px', height: '24px', borderRadius: '50%',
            background: '#C9A227', border: '3px solid #0E1C12',
            pointerEvents: 'none', transition: 'left 0.1s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }} />
          <input
            type="range" min={0} max={10} value={energy}
            onChange={e => setEnergy(Number(e.target.value))}
            style={{ position: 'absolute', top: '-8px', left: 0, width: '100%', opacity: 0, height: '24px', cursor: 'pointer' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#BDB5A0' }}>
          <span>Drained</span>
          <span style={{ color: '#F2D98A' }}>{energyLabel} · {energy}/10</span>
          <span>Energized</span>
        </div>
        <p style={{ fontSize: '10px', color: 'rgba(189,181,160,0.4)', textAlign: 'center', marginTop: '6px', letterSpacing: '0.04em' }}>
          ← drag to adjust →
        </p>
      </div>

      {/* Emotion tags */}
      <div style={{ margin: '20px 24px 0' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '12px' }}>
          What&apos;s present for you?
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {EMOTION_TAGS.map(tag => (
            <button key={tag} onClick={() => toggleTag(tag)}
              style={{
                fontSize: '12px', padding: '7px 14px', borderRadius: '100px', border: '1px solid',
                borderColor: selectedTags.includes(tag) ? '#4A7C59' : 'rgba(255,255,255,0.07)',
                background: selectedTags.includes(tag) ? 'rgba(74,124,89,0.25)' : '#1A2E1E',
                color: selectedTags.includes(tag) ? '#A8C4AF' : '#BDB5A0',
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-dm-sans)',
              }}>{tag}</button>
          ))}
        </div>
      </div>

      {/* Journal */}
      <div style={{ margin: '20px 24px 0' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '12px' }}>
          Optional Reflection
        </p>
        <p style={{ fontSize: '13px', color: '#BDB5A0', fontStyle: 'italic', marginBottom: '10px', lineHeight: 1.5 }}>
          &ldquo;{todayPrompt}&rdquo;
        </p>
        <textarea
          value={journalText}
          onChange={e => setJournalText(e.target.value)}
          placeholder="Write freely here…"
          rows={4}
          style={{
            width: '100%', background: '#1A2E1E', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px', padding: '14px', fontSize: '13px', color: '#F5F0E8',
            lineHeight: 1.5, outline: 'none', fontFamily: 'var(--font-dm-sans)', boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <div style={{ margin: '12px 24px 0' }}>
          <p style={{ fontSize: '13px', color: '#C4614A', padding: '10px 14px', background: 'rgba(196,97,74,0.1)', borderRadius: '8px' }}>{error}</p>
        </div>
      )}

      <div style={{ margin: '20px 24px 0' }}>
        <button onClick={handleSubmit} disabled={saving}
          style={{
            width: '100%', background: '#C9A227', color: '#0E1C12', border: 'none', borderRadius: '12px', padding: '16px',
            fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            letterSpacing: '0.03em', fontFamily: 'var(--font-dm-sans)', opacity: saving ? 0.7 : 1,
          }}>
          {saving ? 'Saving…' : config.cta}
        </button>
      </div>
    </div>
  )
}
