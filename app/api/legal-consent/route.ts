import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
  }

  const { error: consentError } = await supabase.rpc('record_legal_consent')
  if (consentError) {
    console.error('Unable to record legal consent', consentError)
    return NextResponse.json({ error: 'Unable to save your agreement. Please try again.' }, { status: 500 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Unable to load profile after legal consent', profileError)
  }

  return NextResponse.json({ next: profile?.onboarded ? '/home' : '/onboarding' })
}
