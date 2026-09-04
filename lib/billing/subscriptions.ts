import 'server-only'

import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getConfiguredStripePriceIds } from '@/lib/billing/stripe'
import { subscriptionAccessRecord } from '@/lib/billing/access-record'

export async function syncStripeSubscription(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
) {
  const record = subscriptionAccessRecord(subscription, getConfiguredStripePriceIds())
  if (!record || !record.customerId) return { ignored: true }

  const customerResult = await supabase.from('billing_customers').upsert({
    user_id: record.userId,
    stripe_customer_id: record.customerId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (customerResult.error) throw customerResult.error

  const grantResult = await supabase.from('access_grants').upsert(record.grant, {
    onConflict: 'external_reference',
  })

  if (grantResult.error) throw grantResult.error
  return { ignored: false }
}
