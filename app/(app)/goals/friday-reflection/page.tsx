export default function FridayReflectionPage() {
  return (
    <div style={{
      background: '#0E1C12', minHeight: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ maxWidth: '320px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: '32px',
        }}>
          🪞
        </div>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '12px' }}>
          Friday Reflection
        </p>
        <h2 style={{
          fontFamily: 'var(--font-playfair)', fontSize: '26px', color: '#F5F0E8',
          fontWeight: 400, marginBottom: '16px', lineHeight: 1.2,
        }}>
          Coming soon
        </h2>
        <p style={{
          fontFamily: 'var(--font-playfair)', fontStyle: 'italic',
          fontSize: '16px', color: '#C9A227', marginBottom: '16px', lineHeight: 1.4,
        }}>
          &ldquo;Close the week with intention.&rdquo;
        </p>
        <p style={{ fontSize: '14px', color: '#BDB5A0', lineHeight: 1.6, marginBottom: '32px' }}>
          The Friday Reflection feature is being crafted right now. It will help you celebrate your wins, process what was hard, and carry only what serves you into the next week.
        </p>
        <div style={{
          background: 'rgba(26,46,30,0.8)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px', padding: '20px', marginBottom: '28px',
        }}>
          <p style={{ fontSize: '12px', color: '#BDB5A0', lineHeight: 1.6, fontStyle: 'italic' }}>
            In the meantime, take five minutes today to write down three wins from your week — big or small. You showed up. That counts.
          </p>
        </div>
        <a href="/goals" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(201,162,39,0.15)', color: '#C9A227', textDecoration: 'none',
          padding: '12px 24px', borderRadius: '100px', fontSize: '13px', fontWeight: 500,
          border: '1px solid rgba(201,162,39,0.3)',
        }}>
          ← Back to Goals
        </a>
      </div>
    </div>
  )
}
