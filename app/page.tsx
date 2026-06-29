import Link from 'next/link'
import { ArrowRight, Sparkles, Users, TrendingUp, MessageCircle, Target } from 'lucide-react'

const features = [
  {
    icon: <Target size={20} color="#C9A227" />,
    iconBg: 'rgba(201,162,39,0.15)',
    title: 'Daily Reset',
    desc: "A 2-minute morning ritual that grounds you emotionally before the workday begins. Track mood, energy, and what's really present for you.",
  },
  {
    icon: <TrendingUp size={20} color="#6B9E7A" />,
    iconBg: 'rgba(74,124,89,0.2)',
    title: 'Intentional Goals',
    desc: 'Set your week from a place of intention, not reaction. Sunday sessions, daily nudges, and Friday reflections close the loop.',
  },
  {
    icon: <Sparkles size={20} color="#E8B84B" />,
    iconBg: 'rgba(232,184,75,0.15)',
    title: 'Pattern Map',
    desc: "See your emotional data as your story — not a diagnosis. Discover what drives your best days and what's been weighing on you.",
  },
  {
    icon: <Users size={20} color="#7BADC4" />,
    iconBg: 'rgba(123,173,196,0.15)',
    title: 'The Village',
    desc: 'Private community rooms — First Gen in Finance, Manager Mode, Navigating the Room. Real talk, real people, real understanding.',
  },
  {
    icon: <MessageCircle size={20} color="#A8C4AF" />,
    iconBg: 'rgba(74,124,89,0.15)',
    title: 'Clarity Coach',
    desc: 'Your AI thinking partner — culturally aware, available 24/7, ready to help you reframe, prepare, and process whatever comes your way.',
  },
]

export default function LandingPage() {
  return (
    <div style={{ background: '#0A1409', minHeight: '100dvh', color: '#F5F0E8' }}>

      {/* NAV */}
      <nav style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0,
        background: 'rgba(10,20,9,0.92)', backdropFilter: 'blur(12px)', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/flower%20nobg.png" alt="Arize" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#C9A227', letterSpacing: '0.05em' }}>Arize</span>
          <span style={{ fontSize: '11px', color: '#BDB5A0', letterSpacing: '0.08em' }}>by AmazeGen</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/sign-in" style={{
            fontSize: '13px', color: '#BDB5A0', textDecoration: 'none',
            padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)',
          }}>Sign in</Link>
          <Link href="/sign-up" style={{
            fontSize: '13px', color: '#0E1C12', textDecoration: 'none',
            padding: '8px 18px', borderRadius: '100px', background: '#C9A227', fontWeight: 600,
          }}>Get started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '80px 24px 60px', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.25)',
          borderRadius: '100px', padding: '6px 16px', marginBottom: '28px',
          fontSize: '11px', letterSpacing: '0.12em', color: '#C9A227', textTransform: 'uppercase',
        }}>
          <Sparkles size={10} /> Built for Black corporate professionals
        </div>
        <h1 style={{
          fontFamily: 'var(--font-playfair)', fontSize: 'clamp(36px, 8vw, 52px)',
          fontWeight: 400, lineHeight: 1.15, color: '#F5F0E8', marginBottom: '20px',
        }}>
          The support system<br /><em style={{ color: '#C9A227' }}>you deserve at work</em>
        </h1>
        <p style={{ fontSize: '16px', color: '#BDB5A0', lineHeight: 1.7, marginBottom: '36px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
          Arize helps you manage stress, meet your goals, and stay emotionally grounded —
          with tools designed specifically for navigating corporate spaces as a Black professional.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#C9A227', color: '#0E1C12', textDecoration: 'none',
            padding: '14px 28px', borderRadius: '100px', fontSize: '14px', fontWeight: 600,
          }}>Start for free <ArrowRight size={16} /></Link>
          <Link href="/sign-in" style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.05)', color: '#F5F0E8', textDecoration: 'none',
            padding: '14px 28px', borderRadius: '100px', fontSize: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>Sign in</Link>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '20px 24px 60px', maxWidth: '960px', margin: '0 auto' }}>
        <p style={{
          textAlign: 'center', fontSize: '10px', letterSpacing: '0.2em',
          color: '#C9A227', textTransform: 'uppercase', marginBottom: '36px',
        }}>Everything you need to thrive</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(26,46,30,0.6)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '20px', padding: '24px',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', background: f.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
              }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#F5F0E8', fontWeight: 400, marginBottom: '10px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: '#BDB5A0', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QUOTE */}
      <section style={{ padding: '0 24px 60px', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(36,61,40,1) 0%, rgba(14,28,18,1) 100%)',
          border: '1px solid rgba(201,162,39,0.2)', borderRadius: '24px',
          padding: '48px 40px', textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'var(--font-playfair)', fontSize: 'clamp(20px,4vw,28px)',
            fontStyle: 'italic', color: '#F5F0E8', lineHeight: 1.4, marginBottom: '20px',
          }}>
            &ldquo;Private support for you,<br />built by people like you.&rdquo;
          </p>
          <p style={{ fontSize: '12px', color: '#BDB5A0', letterSpacing: '0.1em' }}>Arize · AmazeGen</p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '40px 24px 80px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(26px,5vw,36px)', color: '#F5F0E8', fontWeight: 400, marginBottom: '16px' }}>
          Ready to Arize?
        </h2>
        <p style={{ fontSize: '14px', color: '#BDB5A0', marginBottom: '32px' }}>
          Join Black professionals who are choosing themselves every day.
        </p>
        <Link href="/sign-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#C9A227', color: '#0E1C12', textDecoration: 'none',
          padding: '16px 36px', borderRadius: '100px', fontSize: '15px', fontWeight: 600,
        }}>Create your free account <ArrowRight size={16} /></Link>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px', textAlign: 'center', fontSize: '12px', color: '#BDB5A0',
      }}>
        <span style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227', marginRight: '8px' }}>Arize</span>
        by AmazeGen &nbsp;·&nbsp; Your data stays yours.
      </footer>
    </div>
  )
}
