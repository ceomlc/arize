'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, LockKeyhole } from 'lucide-react'
import { useAccess } from '@/components/access/AccessProvider'
import { hasCoreRestrictions } from '@/lib/access/entitlements'
import { createClient } from '@/lib/supabase/client'
import type { CheckIn } from '@/lib/types'

const MOOD_LABELS: Record<string, string> = {
  tense: 'Tense',
  meh: 'Meh',
  steady: 'Steady',
  grounded: 'Grounded',
  thriving: 'Thriving',
}

const MOOD_EMOJIS: Record<string, string> = {
  tense: '😤',
  meh: '😐',
  steady: '🌿',
  grounded: '✨',
  thriving: '🌟',
}

export default function ReflectHistoryPage() {
  const supabase = createClient()
  const access = useAccess()
  const isCore = hasCoreRestrictions(access)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      let query = supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (access.limits.reflectHistoryDays !== null) {
        const since = new Date()
        since.setDate(since.getDate() - access.limits.reflectHistoryDays)
        query = query.gte('created_at', since.toISOString())
      }

      const { data } = await query
      setCheckIns((data ?? []) as CheckIn[])
      setLoading(false)
    }

    loadHistory()
  }, [access.limits.reflectHistoryDays, supabase])

  return (
    <div style={{ background: '#0E1C12', minHeight: '100%', padding: '18px 24px 28px' }}>
      <Link href="/reset" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: '#BDB5A0', textDecoration: 'none', fontSize: '13px', marginBottom: '18px' }}>
        <ArrowLeft size={17} /> Back to Reflect
      </Link>
      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '7px' }}>Reflect history</p>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '26px', color: '#F5F0E8', fontWeight: 500, marginBottom: '6px' }}>Your check-in journey</h1>
      <p style={{ fontSize: '13px', color: '#BDB5A0', lineHeight: 1.5, marginBottom: '18px' }}>
        Revisit how you felt, what you carried, and what you learned.
      </p>

      {isCore && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', marginBottom: '16px', background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.18)', borderRadius: '12px' }}>
          <LockKeyhole size={17} color="#F2D98A" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ color: '#BDB5A0', fontSize: '12px', lineHeight: 1.5 }}>
            Core includes the last {access.limits.reflectHistoryDays} days. <Link href="/upgrade" style={{ color: '#F2D98A', fontWeight: 600 }}>See Plus</Link> for your full history.
          </p>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#BDB5A0', fontSize: '13px', padding: '36px 0', textAlign: 'center' }}>Loading your history…</p>
      ) : checkIns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 20px', background: '#1A2E1E', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
          <CalendarDays size={25} color="#6B9E7A" style={{ marginBottom: '10px' }} />
          <p style={{ color: '#F5F0E8', fontSize: '14px', marginBottom: '6px' }}>No check-ins in this view yet</p>
          <Link href="/reset" style={{ color: '#F2D98A', fontSize: '12px' }}>Complete a Reflect check-in</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {checkIns.map(checkIn => (
            <article key={checkIn.id} style={{ padding: '15px', borderRadius: '14px', background: '#1A2E1E', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                <div style={{ width: '38px', height: '38px', display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: '12px', background: 'rgba(74,124,89,0.16)', fontSize: '18px' }}>
                  {MOOD_EMOJIS[checkIn.mood] ?? '🌿'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
                    <p style={{ color: '#F5F0E8', fontSize: '14px', fontWeight: 600 }}>{MOOD_LABELS[checkIn.mood] ?? checkIn.mood}</p>
                    <time style={{ color: '#BDB5A0', fontSize: '10px', whiteSpace: 'nowrap' }}>
                      {new Date(checkIn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </time>
                  </div>
                  <p style={{ color: '#A8C4AF', fontSize: '11px', marginBottom: checkIn.emotion_tags?.length || checkIn.journal_text ? '8px' : 0 }}>
                    Energy {checkIn.energy}/10 · {checkIn.time_of_day ?? 'check-in'}
                  </p>
                  {checkIn.emotion_tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: checkIn.journal_text ? '9px' : 0 }}>
                      {checkIn.emotion_tags.map(tag => <span key={tag} style={{ color: '#BDB5A0', fontSize: '10px', padding: '3px 7px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)' }}>{tag}</span>)}
                    </div>
                  )}
                  {checkIn.journal_text && <p style={{ color: '#D8D0C1', fontSize: '12px', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{checkIn.journal_text}</p>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
