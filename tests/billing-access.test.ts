import assert from 'node:assert/strict'
import test from 'node:test'
import type Stripe from 'stripe'
import { subscriptionAccessRecord } from '../lib/billing/access-record.ts'

const userId = '0d6e5bed-2a98-4c8a-a588-6c835370513a'
const priceId = 'price_arize_plus_monthly'

function subscription(overrides: Partial<Stripe.Subscription> = {}) {
  return {
    id: 'sub_arize_test',
    object: 'subscription',
    customer: 'cus_arize_test',
    metadata: {
      arize_app: 'arize',
      arize_user_id: userId,
      arize_plan: 'plus',
    },
    status: 'trialing',
    start_date: 1_788_480_000,
    trial_end: 1_789_084_800,
    cancel_at_period_end: false,
    livemode: false,
    items: {
      data: [{
        current_period_start: 1_788_480_000,
        current_period_end: 1_789_084_800,
        price: { id: priceId, recurring: { interval: 'month' } },
      }],
    },
    ...overrides,
  } as unknown as Stripe.Subscription
}

test('verified Stripe trial creates an active Plus trial grant', () => {
  const record = subscriptionAccessRecord(subscription(), [priceId])
  assert.equal(record?.userId, userId)
  assert.equal(record?.customerId, 'cus_arize_test')
  assert.equal(record?.grant.source, 'checkout_trial')
  assert.equal(record?.grant.status, 'active')
  assert.equal(record?.grant.external_reference, 'sub_arize_test')
})

test('unknown Stripe prices cannot grant Arize access', () => {
  assert.equal(subscriptionAccessRecord(subscription(), ['price_something_else']), null)
})

test('past-due Stripe subscriptions are revoked fail-closed', () => {
  const record = subscriptionAccessRecord(subscription({ status: 'past_due' }), [priceId])
  assert.equal(record?.grant.source, 'subscription')
  assert.equal(record?.grant.status, 'revoked')
})

