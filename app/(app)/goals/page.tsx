'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Goal } from '@/lib/types'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekStart(date = new Date()) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

export default function GoalsPage() {
  const supabase = createClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [today] = useState(new Date())
  const todayDow = today.getDay()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const weekStart = getWeekStart()
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .gte('week_of', weekStart.toISOString().split('T')[0])
        .lt('week_of', weekEnd.toISOString().split('T')[0])
        .order('created_at', { ascending: true })

      setGoals(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function toggleGoal(goal: Goal) {
    const updated = !goal.is_complete
    await supabase.from('goals').update({
      is_complete: updated,
      progress: updated ? 100 : goal.progress,
    }).eq('id', goal.id)
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, is_complete: updated, progress: updated ? 100 : g.progress } : g))
  }

  const weekStart = getWeekStart()
  const weekLabel = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  const doneCount = goals.filter(g => g.is_complete).length

  return (
    <div style={{ background: '#0E1C12', minHeight: '100%', paddingBottom: '16px' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 0' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '8px' }}>
          Goals & Accountability
        </p>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color: '#F5F0E8', fontWeight: 500, lineHeight: 1.3, marginBottom: '4px' }}>
          Intentional Goals
        </h2>
        <p style={{ fontSize: '12px', color: '#BDB5A0' }}>
          {weekLabel} · {doneCount} of {goals.length} {goals.length === 1 ? 'goal' : 'goals'} complete
        </p>
      </div>

      {/* Week rhythm */}
      <div style={{ margin: '18px 24px 0', display: 'flex', gap: '6px' }}>
        {DAY_LABELS.map((day, i) => {
          const isToday = i === todayDow
          const isPast = i < todayDow
          return (
            <div key={day} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '6px', padding: '10px 4px', borderRadius: '8px',
              background: isToday ? 'rgba(201,162,39,0.12)' : '#1A2E1E',
              border: `1px solid ${isToday ? '#C9A227' : 'rgba(255,255,255,0.05)'}`,
              fontSize: '9px',
              color: isToday ? '#C9A227' : '#BDB5A0',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: isPast ? '#4A7C59' : isToday ? '#C9A227' : 'rgba(255,255,255,0.1)',
              }} />
              {day}
            </div>
          )
        })}
      </div>

      {/* Sunday session banner */}
      <div style={{
        margin: '16px 24px 0',
        background: 'linear-gradient(135deg, rgba(36,61,40,1) 0%, rgba(14,28,18,1) 100%)',
        border: '1px solid rgba(201,162,39,0.25)',
        borderRadius: '20px', padding: '18px', position: 'relative', overflow: 'hidden',
      }}>
        <span style={{
          position: 'absolute', right: '16px', top: '14px',
          fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(201,162,39,0.3)', fontWeight: 600,
        }}>SUNDAY</span>
        <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '6px' }}>
          Sunday Goal Session
        </p>
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', color: '#F5F0E8', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3, marginBottom: '14px' }}>
          &ldquo;Set the week from a place<br />of intention, not reaction.&rdquo;
        </h3>
        <Link href="/goals/session" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(201,162,39,0.15)', border: '1px solid #C9A227',
          color: '#C9A227', fontSize: '12px', fontWeight: 500,
          padding: '8px 16px', borderRadius: '100px',
          textDecoration: 'none',
        }}>
          ✦ {goals.length > 0 ? 'Edit this week\'s goals' : 'Start this week\'s session'}
        </Link>
      </div>

      {/* Pattern Map link */}
      <div style={{ margin: '12px 24px 0' }}>
        <Link href="/goals/patterns" style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(123,173,196,0.08)', border: '1px solid rgba(123,173,196,0.2)',
          borderRadius: '12px', padding: '13px 16px', textDecoration: 'none',
        }}>
          <TrendingUp size={16} color="#7BADC4" />
          <span style={{ flex: 1, fontSize: '13px', color: '#F5F0E8' }}>View your Pattern Map</span>
          <span style={{ fontSize: '11px', color: '#7BADC4' }}>30-day view →</span>
        </Link>
      </div>

      {/* Goals list */}
      <div style={{ margin: '16px 24px 0' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '12px' }}>
          This Week&apos;s Commitments
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: '13px', color: '#BDB5A0' }}>Loading goals…</p>
          </div>
        ) : goals.length === 0 ? (
          <div style={{
            background: '#1A2E1E', border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '28px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '14px', color: '#BDB5A0', marginBottom: '12px', lineHeight: 1.5 }}>
              No goals set for this week yet.
            </p>
            <Link href="/goals/session" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#C9A227', color: '#0E1C12', textDecoration: 'none',
              padding: '10px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
            }}>
              <Plus size={14} /> Set your goals
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {goals.map(goal => (
              <div
                key={goal.id}
                style={{
                  background: '#1A2E1E', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                  <button
                    onClick={() => toggleGoal(goal)}
                    style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      border: `2px solid ${goal.is_complete ? '#4A7C59' : '#4A7C59'}`,
                      background: goal.is_complete ? '#4A7C59' : 'transparent',
                      flexShrink: 0, marginTop: '2px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '10px',
                    }}
                  >
                    {goal.is_complete && '✓'}
                  </button>
                  <span style={{
                    fontSize: '13px', color: goal.is_complete ? '#BDB5A0' : '#F5F0E8',
                    lineHeight: 1.4, flex: 1,
                    textDecoration: goal.is_complete ? 'line-through' : 'none',
                  }}>
                    {goal.title}
                  </span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '100px',
                    background: goal.is_complete ? '#4A7C59' : '#C9A227',
                    width: `${goal.progress}%`, transition: 'width 0.4s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#BDB5A0' }}>
                  <span>{goal.category}</span>
                  <span>{goal.is_complete ? 'Done ✓' : `${goal.progress}%`}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link href="/goals/session" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: 'transparent', border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: '12px', padding: '14px', color: '#BDB5A0',
          fontSize: '13px', textDecoration: 'none', marginTop: '10px',
          transition: 'all 0.2s',
        }}>
          <Plus size={14} /> Add a new commitment
        </Link>
      </div>

      {/* Friday reflection link */}
      <div style={{ margin: '16px 24px 0' }}>
        <Link href="/goals/friday-reflection" style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.15)',
          borderRadius: '12px', padding: '13px 16px', textDecoration: 'none',
        }}>
          <span style={{ fontSize: '16px' }}>🪞</span>
          <span style={{ flex: 1, fontSize: '13px', color: '#F5F0E8' }}>Friday Reflection</span>
          <span style={{ fontSize: '11px', color: '#C9A227' }}>Close the week →</span>
        </Link>
      </div>
    </div>
  )
}
