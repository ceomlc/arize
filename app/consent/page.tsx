export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { ConsentForm } from '@/components/legal/ConsentForm'
import { hasCurrentLegalConsent, PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legal/consent'
import { createClient } from '@/lib/supabase/server'

export default async function ConsentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const [{ data: consent }, { data: profile }] = await Promise.all([
    supabase
      .from('legal_consents')
      .select('terms_version, privacy_version')
      .eq('user_id', user.id)
      .eq('terms_version', TERMS_VERSION)
      .eq('privacy_version', PRIVACY_VERSION)
      .maybeSingle(),
    supabase.from('profiles').select('onboarded').eq('id', user.id).maybeSingle(),
  ])

  if (hasCurrentLegalConsent(consent)) {
    redirect(profile?.onboarded ? '/home' : '/onboarding')
  }

  return (
    <main style={{
      background: '#0A1409', minHeight: '100dvh', padding: '28px 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Link href="/" aria-label="Arize home" style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          color: '#F5F0E8', textDecoration: 'none', marginBottom: '28px',
          fontFamily: 'var(--font-playfair)', fontSize: '22px',
        }}>
          <Image src="/flower%20nobg.png" alt="" width={40} height={40} />
          Arize
        </Link>
        <section style={{
          background: 'rgba(26,46,30,0.82)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '22px', padding: 'clamp(24px, 6vw, 34px)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.22)',
        }}>
          <ConsentForm />
        </section>
      </div>
    </main>
  )
}
