import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { VillageRoom } from '@/lib/types'

const ROOM_ICONS: Record<string, string> = {
  'First Gen in Finance': '💼',
  'Manager Mode': '🎯',
  'Navigating the Room': '🧭',
  'Wins Only': '✦',
}

export default async function VillagePage() {
  const supabase = await createClient()

  const { data: rooms } = await supabase
    .from('village_rooms')
    .select('*')
    .order('is_featured', { ascending: false })

  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const rooms_ = (rooms ?? []) as VillageRoom[]

  return (
    <div style={{ background: '#0E1C12', minHeight: '100%', paddingBottom: '16px' }}>

      <div style={{ padding: '20px 24px 0' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '8px' }}>
          The Village
        </p>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color: '#F5F0E8', fontWeight: 500, lineHeight: 1.3, marginBottom: '4px' }}>
          Your People
        </h2>
        <p style={{ fontSize: '12px', color: '#BDB5A0', lineHeight: 1.4 }}>
          Private rooms for real conversations. Built by people like you.
        </p>
      </div>

      {/* Member count */}
      <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: 'rgba(74,124,89,0.08)', border: '1px solid rgba(74,124,89,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>👥</span>
        <p style={{ fontSize: '12px', color: '#A8C4AF' }}>
          <span style={{ fontWeight: 600, color: '#C9A227' }}>{userCount ?? 0}</span> members and growing — invite your people
        </p>
      </div>

      <div style={{ margin: '20px 24px 0' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '12px' }}>
          Active Rooms
        </p>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rooms_.map(room => (
          <div key={room.id} style={{
            background: room.is_featured
              ? 'linear-gradient(135deg, rgba(36,61,40,1) 0%, rgba(14,28,18,1) 100%)'
              : '#1A2E1E',
            border: `1px solid ${room.is_featured ? 'rgba(74,124,89,0.4)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '20px', padding: '18px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: room.is_featured ? 'rgba(74,124,89,0.2)' : 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0,
                }}>
                  {ROOM_ICONS[room.name] ?? '💬'}
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', color: '#F5F0E8', fontWeight: 400, marginBottom: '4px', lineHeight: 1.3 }}>
                    {room.name}
                  </p>
                  <p style={{ fontSize: '11px', color: '#BDB5A0', lineHeight: 1.4, maxWidth: '220px' }}>
                    {room.description}
                  </p>
                </div>
              </div>
              {room.is_featured && (
                <span style={{
                  background: 'rgba(196,97,74,0.2)', border: '1px solid #C4614A',
                  color: '#C4614A', fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em',
                  padding: '4px 8px', borderRadius: '100px', textTransform: 'uppercase', flexShrink: 0,
                }}>Live</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '11px', color: '#BDB5A0' }}>Text · Voice · Community</p>
              <Link href={`/village/${room.id}`} style={{ fontSize: '12px', color: '#A8C4AF', fontWeight: 500, textDecoration: 'none' }}>
                Enter →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
