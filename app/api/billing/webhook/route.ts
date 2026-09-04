import type Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { assertExpectedStripeAccount, assertExpectedStripeMode, getStripe } from '@/lib/billing/stripe'
import { syncStripeSubscription } from '@/lib/billing/subscriptions'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const HANDLED_EVENTS = new Set<Stripe.Event.Type>([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
])

function subscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription
  if (!subscription) return null
  return typeof subscription === 'string' ? subscription : subscription.id
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 })
  }

  let event: Stripe.Event
  try {
    const rawBody = await request.text()
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
    assertExpectedStripeMode(event.livemode)
  } catch (error) {
    console.error('[billing webhook: verification]', error)
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  if (!HANDLED_EVENTS.has(event.type)) return NextResponse.json({ received: true })

  const supabase = createAdminClient()
  const { data: claimed, error: claimError } = await supabase.rpc('claim_billing_webhook_event', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_livemode: event.livemode,
  })

  if (claimError) {
    console.error('[billing webhook: claim]', claimError.message)
    return NextResponse.json({ error: 'Unable to record webhook.' }, { status: 503 })
  }
  if (!claimed) return NextResponse.json({ received: true, duplicate: true })

  try {
    const stripe = getStripe()
    await assertExpectedStripeAccount(stripe)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      if (session.mode === 'subscription' && session.metadata?.arize_app === 'arize') {
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id
        if (subscriptionId) {
          await syncStripeSubscription(supabase, await stripe.subscriptions.retrieve(subscriptionId))
        }
      }
    } else if (
      event.type === 'customer.subscription.created'
      || event.type === 'customer.subscription.updated'
      || event.type === 'customer.subscription.deleted'
    ) {
      await syncStripeSubscription(supabase, event.data.object)
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const subscriptionId = subscriptionIdFromInvoice(event.data.object)
      if (subscriptionId) {
        await syncStripeSubscription(supabase, await stripe.subscriptions.retrieve(subscriptionId))
      }
    }

    const { error: completeError } = await supabase
      .from('billing_webhook_events')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error: null,
      })
      .eq('event_id', event.id)
    if (completeError) throw completeError

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[billing webhook: processing]', error)
    const message = error instanceof Error ? error.message.slice(0, 500) : 'Unknown processing error'
    await supabase
      .from('billing_webhook_events')
      .update({ status: 'failed', error: message, updated_at: new Date().toISOString() })
      .eq('event_id', event.id)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
