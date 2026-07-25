import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, Flame, CheckSquare, Users, Heart } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  const goalsThisWeek = { total: 0, complete: 0 }
  let villageCount = 0
  let avgMood = 0
  let recentCheckIn = null

  if (user) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!p) {
      const metaName = (user.user_metadata?.full_name ?? user.user_metadata?.name) ?? null
      await supabase.from('profiles').upsert({ id: user.id, name: metaName }, { onConflict: 'id', ignoreDuplicates: true })
      const { data: created } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      profile = created
    } else {
      profile = p
    }

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const { data: goals } = await supabase
      .from('goals')
      .select('is_complete')
      .eq('user_id', user.id)
      .gte('week_of', weekStart.toISOString().split('T')[0])

    if (goals) {
      goalsThisWeek.total = goals.length
      goalsThisWeek.complete = goals.filter(g => g.is_complete).length
    }

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    villageCount = count ?? 0

    const { data: recentCheckIns } = await supabase
      .from('check_ins')
      .select('mood_score, mood, energy, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentCheckIns && recentCheckIns.length > 0) {
      avgMood = Math.round((recentCheckIns.reduce((s, c) => s + c.mood_score, 0) / recentCheckIns.length) * 10) / 10
      recentCheckIn = recentCheckIns[0]
    }
  }

  const firstName = profile?.name?.split(' ')[0] ?? 'there'
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const isMorning = today.getHours() < 12
  const isAfternoon = today.getHours() >= 12 && today.getHours() < 17
  const greeting = isMorning ? 'Good morning' : isAfternoon ? 'Good afternoon' : 'Good evening'
  const isFriday = today.getDay() === 5
  const hasCheckedInToday = recentCheckIn
    ? new Date(recentCheckIn.created_at).toDateString() === today.toDateString()
    : false
  const moodLabel = avgMood <= 0
    ? null
    : avgMood < 1.8
      ? 'Tense'
      : avgMood < 2.8
        ? 'Low'
        : avgMood < 3.8
          ? 'Steady'
          : avgMood < 4.6
            ? 'Grounded'
            : 'Thriving'

  return (
    <div style={{ background: '#0E1C12', minHeight: '100%', paddingBottom: '16px' }}>

      {/* Hero greeting */}
      <div style={{ padding: '20px 24px 0' }}>
        <p style={{ fontSize: '12px', color: '#BDB5A0', marginBottom: '4px', letterSpacing: '0.04em' }}>{greeting},</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#F5F0E8', fontWeight: 500, marginBottom: '2px', lineHeight: 1.2 }}>
          {firstName} ✦
        </h1>
        <p style={{ fontSize: '12px', color: '#BDB5A0' }}>{dateStr}</p>
      </div>

      {/* Today card */}
      <div style={{
        margin: '20px 24px 0',
        background: 'linear-gradient(135deg, #4A7C59 0%, #243D28 100%)',
        borderRadius: '20px', padding: '20px',
        position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '120px', height: '120px',
          background: 'rgba(201,162,39,0.15)', borderRadius: '50%',
        }} />
        <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#F2D98A', marginBottom: '8px' }}>
          {hasCheckedInToday ? 'Daily Reset · Complete ✓' : `Daily Reset · ${today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
        </p>
        <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#F5F0E8', fontWeight: 400, lineHeight: 1.3, marginBottom: '16px' }}>
          {hasCheckedInToday
            ? 'You\'ve already checked in today. Keep going.'
            : 'How are you showing up\nfor yourself today?'}
        </p>
        {!hasCheckedInToday && (
          <Link href="/reset" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#C9A227', color: '#0E1C12',
            fontSize: '13px', fontWeight: 600,
            padding: '10px 18px', borderRadius: '100px',
            textDecoration: 'none',
          }}>
            Begin Check-in <ArrowRight size={14} />
          </Link>
        )}
        {hasCheckedInToday && (
          <Link href="/reset" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(201,162,39,0.2)', color: '#F2D98A',
            fontSize: '13px', fontWeight: 500,
            padding: '10px 18px', borderRadius: '100px',
            border: '1px solid rgba(201,162,39,0.3)',
            textDecoration: 'none',
          }}>
            View today&apos;s reset <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '12px', margin: '16px 24px 0',
      }}>
        {[
          {
            icon: <Flame size={16} color="#6B9E7A" />,
            iconBg: 'rgba(74,124,89,0.2)',
            value: profile?.streak_count ?? 0,
            label: 'Day streak 🔥',
          },
          {
            icon: <CheckSquare size={16} color="#C9A227" />,
            iconBg: 'rgba(201,162,39,0.15)',
            value: goalsThisWeek.total > 0 ? `${goalsThisWeek.complete}/${goalsThisWeek.total}` : '—',
            label: 'Goals this week',
          },
          {
            icon: <Users size={16} color="#7BADC4" />,
            iconBg: 'rgba(123,173,196,0.15)',
            value: villageCount,
            label: 'Village members',
          },
          {
            icon: <Heart size={16} color="#C4614A" />,
            iconBg: 'rgba(196,97,74,0.15)',
            value: avgMood > 0 ? `${avgMood}/5` : '—',
            label: moodLabel ? `Avg. mood · ${moodLabel}` : 'Avg. mood score',
          },
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#1A2E1E', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '16px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: stat.iconBg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '10px',
            }}>
              {stat.icon}
            </div>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color: '#F5F0E8', fontWeight: 500, lineHeight: 1, marginBottom: '4px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '11px', color: '#BDB5A0', lineHeight: 1.3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Today's focus */}
      <div style={{ margin: '20px 24px 0' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '12px' }}>
          Today&apos;s Focus
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isFriday && (
            <Link href="/goals/friday-reflection" style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              background: '#1A2E1E', border: '1px solid rgba(201,162,39,0.2)',
              borderRadius: '12px', padding: '14px 16px', textDecoration: 'none',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C9A227', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '13px', color: '#F5F0E8', lineHeight: 1.3 }}>
                Friday Reflection — close out your week
              </span>
              <span style={{ fontSize: '11px', color: '#BDB5A0' }}>2 min</span>
              <span style={{ fontSize: '14px', color: '#BDB5A0' }}>›</span>
            </Link>
          )}
          <Link href="/goals" style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            background: '#1A2E1E', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px', padding: '14px 16px', textDecoration: 'none',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4A7C59', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '13px', color: '#F5F0E8', lineHeight: 1.3 }}>
              {goalsThisWeek.total > 0
                ? `${goalsThisWeek.complete} of ${goalsThisWeek.total} goals in motion this week`
                : 'Set your goals for this week'}
            </span>
            <span style={{ fontSize: '11px', color: '#BDB5A0' }}>
              {goalsThisWeek.total > 0 ? `${Math.round((goalsThisWeek.complete / goalsThisWeek.total) * 100)}%` : ''}
            </span>
            <span style={{ fontSize: '14px', color: '#BDB5A0' }}>›</span>
          </Link>
          <Link href="/village" style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            background: '#1A2E1E', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px', padding: '14px 16px', textDecoration: 'none',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7BADC4', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '13px', color: '#F5F0E8', lineHeight: 1.3 }}>
              The Village · Active rooms available
            </span>
            <span style={{ fontSize: '14px', color: '#BDB5A0' }}>›</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
