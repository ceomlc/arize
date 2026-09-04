import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import {
  assertExpectedStripeAccount,
  getPublicAppUrl,
  getStripe,
  getStripePriceId,
  isStripeCheckoutConfigured,
  STRIPE_CHECKOUT_INTEGRATION_ID,
  type BillingPeriod,
} from '@/lib/billing/stripe'
import { MEMBERSHIP_PRICING } from '@/lib/access/entitlements'
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legal/consent'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

function safeCheckoutError(error: unknown) {
  if (!(error instanceof Error)) return { message: 'Unknown checkout error' }

  const stripeError = error as Error & {
    code?: string
    param?: string
    requestId?: string
    statusCode?: number
    type?: string
  }

  return {
    name: stripeError.name,
    message: stripeError.message,
    type: stripeError.type,
    code: stripeError.code,
    param: stripeError.param,
    requestId: stripeError.requestId,
    statusCode: stripeError.statusCode,
  }
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
  }
  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json({ error: 'Membership checkout is not available yet.' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  const { data: consent, error: consentError } = await supabase
    .from('legal_consents')
    .select('id')
    .eq('user_id', user.id)
    .eq('terms_version', TERMS_VERSION)
    .eq('privacy_version', PRIVACY_VERSION)
    .maybeSingle()

  if (consentError || !consent) {
    if (consentError) console.error('[billing checkout: consent lookup]', consentError.message)
    return NextResponse.json({ error: 'Please accept the current Terms and Privacy Policy first.' }, { status: 403 })
  }

  let period: BillingPeriod
  try {
    const body = await request.json() as { period?: unknown }
    if (body.period !== 'monthly' && body.period !== 'annual') throw new Error('invalid period')
    period = body.period
  } catch {
    return NextResponse.json({ error: 'Choose a valid billing period.' }, { status: 400 })
  }

  const { data: existingGrant, error: grantError } = await supabase
    .from('access_grants')
    .select('id')
    .eq('user_id', user.id)
    .in('source', ['checkout_trial', 'subscription'])
    .eq('status', 'active')
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
    .limit(1)
    .maybeSingle()

  if (grantError) {
    console.error('[billing checkout: grant lookup]', grantError.message)
    return NextResponse.json({ error: 'Unable to confirm membership status.' }, { status: 503 })
  }
  if (existingGrant) {
    return NextResponse.json({ error: 'You already have an active Plus membership.' }, { status: 409 })
  }

  const { data: customer, error: customerError } = await supabase
    .from('billing_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (customerError) {
    console.error('[billing checkout: customer lookup]', customerError.message)
    return NextResponse.json({ error: 'Unable to prepare membership checkout.' }, { status: 503 })
  }

  const stripe = getStripe()
  const appUrl = getPublicAppUrl()
  const requestKey = request.headers.get('x-idempotency-key')
  const safeRequestKey = requestKey && /^[0-9a-f-]{36}$/i.test(requestKey) ? requestKey : randomUUID()

  try {
    await assertExpectedStripeAccount(stripe)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      origin_context: 'web',
      integration_identifier: STRIPE_CHECKOUT_INTEGRATION_ID,
      managed_payments: { enabled: false },
      client_reference_id: user.id,
      ...(customer?.stripe_customer_id
        ? { customer: customer.stripe_customer_id }
        : { customer_email: user.email }),
      line_items: [{ price: getStripePriceId(period), quantity: 1 }],
      payment_method_collection: 'always',
      subscription_data: {
        trial_period_days: MEMBERSHIP_PRICING.newMemberTrialDays,
        metadata: {
          arize_app: 'arize',
          arize_user_id: user.id,
          arize_plan: 'plus',
          arize_billing_period: period,
        },
      },
      metadata: {
        arize_app: 'arize',
        arize_user_id: user.id,
        arize_plan: 'plus',
        arize_billing_period: period,
      },
      success_url: `${appUrl}/upgrade?checkout=success`,
      cancel_url: `${appUrl}/upgrade?checkout=canceled`,
    }, {
      idempotencyKey: `arize_checkout_${user.id}_${period}_${safeRequestKey}`,
    })

    if (!session.url) throw new Error('Stripe did not return a checkout URL')
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[billing checkout]', safeCheckoutError(error))
    return NextResponse.json({ error: 'Unable to start checkout. Please try again.' }, { status: 502 })
  }
}
