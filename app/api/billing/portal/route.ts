import { NextResponse } from 'next/server'
import { assertExpectedStripeAccount, getPublicAppUrl, getStripe, isStripeCheckoutConfigured } from '@/lib/billing/stripe'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
  }
  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json({ error: 'Billing management is not available yet.' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  const { data: customer, error } = await supabase
    .from('billing_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[billing portal: customer lookup]', error.message)
    return NextResponse.json({ error: 'Unable to load your billing profile.' }, { status: 503 })
  }
  if (!customer) {
    return NextResponse.json({ error: 'No billing profile was found for this account.' }, { status: 404 })
  }

  try {
    const stripe = getStripe()
    await assertExpectedStripeAccount(stripe)
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${getPublicAppUrl()}/upgrade`,
    })
    return NextResponse.json({ url: session.url })
  } catch (portalError) {
    console.error('[billing portal]', portalError)
    return NextResponse.json({ error: 'Unable to open billing management. Please try again.' }, { status: 502 })
  }
}
