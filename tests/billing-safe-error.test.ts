import assert from 'node:assert/strict'
import test from 'node:test'

import { billingFailureLabel, safeBillingError } from '../lib/billing/safe-error.ts'

test('billing error diagnostics include only allow-listed provider fields', () => {
  const error = Object.assign(new Error('Card for person@example.com was rejected'), {
    type: 'StripeCardError',
    code: 'card_declined',
    param: 'payment_method',
    requestId: 'req_sensitive_identifier',
    statusCode: 402,
    headers: { authorization: 'Bearer secret' },
    raw: { customer_email: 'person@example.com' },
  })

  const details = safeBillingError(error)
  const serialized = JSON.stringify(details)

  assert.deepEqual(details, {
    name: 'Error',
    type: 'StripeCardError',
    code: 'card_declined',
    param: 'payment_method',
    statusCode: 402,
  })
  assert.doesNotMatch(serialized, /person@example\.com|Bearer|secret|req_sensitive/)
  assert.equal(billingFailureLabel(error), 'card_declined')
})

test('unsafe and unknown billing errors collapse to a generic label', () => {
  const error = { code: 'bad code with customer@example.com', message: 'private detail' }

  assert.deepEqual(safeBillingError(error), {
    name: 'UnknownError',
    type: undefined,
    code: undefined,
    param: undefined,
    statusCode: undefined,
  })
  assert.equal(billingFailureLabel(error), 'UnknownError')
})
