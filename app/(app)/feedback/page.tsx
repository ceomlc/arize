import Link from 'next/link'
import { ArrowLeft, MessageSquareText } from 'lucide-react'

export default function FeedbackPage() {
  return (
    <div style={{ minHeight: '100%', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: '#BDB5A0', textDecoration: 'none', fontSize: '13px', alignSelf: 'flex-start' }}>
        <ArrowLeft size={17} /> Back to Profile
      </Link>

      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '36px 0 72px' }}>
        <div style={{
          width: '100%', maxWidth: '430px', textAlign: 'center',
          padding: '36px 28px', borderRadius: '20px',
          background: '#1A2E1E', border: '1px solid rgba(201,162,39,0.2)',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            display: 'grid', placeItems: 'center', margin: '0 auto 20px',
            background: 'rgba(201,162,39,0.14)',
          }}>
            <MessageSquareText size={26} color="#C9A227" />
          </div>
          <p style={{ fontSize: '11px', color: '#C9A227', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Your voice matters
          </p>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#F5F0E8', fontWeight: 500, marginBottom: '12px' }}>
            Feedback survey coming soon
          </h1>
          <p style={{ fontSize: '14px', color: '#BDB5A0', lineHeight: 1.6 }}>
            We&apos;re preparing a short survey so you can tell us what&apos;s working and what would make Arize more useful.
          </p>
        </div>
      </div>
    </div>
  )
}
