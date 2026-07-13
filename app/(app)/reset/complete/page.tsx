import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function ResetCompletePage() {
  return (
    <div style={{
      background: '#0E1C12', minHeight: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ maxWidth: '320px' }}>

        {/* Icon */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(74,124,89,0.2)', border: '2px solid rgba(74,124,89,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
        }}>
          <CheckCircle size={36} color="#6B9E7A" />
        </div>

        <h2 style={{
          fontFamily: 'var(--font-playfair)', fontSize: '28px',
          color: '#F5F0E8', fontWeight: 400, marginBottom: '12px', lineHeight: 1.2,
        }}>
          Reset complete.
        </h2>
        <p style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: '18px', color: '#C9A227', marginBottom: '16px', lineHeight: 1.4 }}>
          You showed up for yourself today.
        </p>
        <p style={{ fontSize: '14px', color: '#BDB5A0', lineHeight: 1.6, marginBottom: '40px' }}>
          Your check-in has been saved. Your patterns are being built.
          This moment — however you showed up — counts.
        </p>

        {/* Gold divider */}
        <div style={{ width: '40px', height: '2px', background: '#C9A227', borderRadius: '100px', margin: '0 auto 40px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/home" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: '#C9A227', color: '#0E1C12', textDecoration: 'none',
            padding: '15px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
            fontFamily: 'var(--font-dm-sans)',
          }}>
            Start my day <ArrowRight size={16} />
          </Link>
          <Link href="/goals" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.05)', color: '#F5F0E8', textDecoration: 'none',
            padding: '15px', borderRadius: '12px', fontSize: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            Review my goals
          </Link>
          <Link href="/coach" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'rgba(74,124,89,0.15)', color: '#A8C4AF', textDecoration: 'none',
            padding: '15px', borderRadius: '12px', fontSize: '14px',
            border: '1px solid rgba(74,124,89,0.3)',
          }}>
            Talk to Clarity Coach
          </Link>
        </div>
      </div>
    </div>
  )
}
