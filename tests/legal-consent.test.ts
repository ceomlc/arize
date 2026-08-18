import assert from 'node:assert/strict'
import test from 'node:test'
import {
  hasCurrentLegalConsent,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from '../lib/legal/consent.ts'

test('legal consent requires the current terms and privacy versions', () => {
  assert.equal(hasCurrentLegalConsent(null), false)
  assert.equal(hasCurrentLegalConsent({ terms_version: TERMS_VERSION, privacy_version: '1.0' }), false)
  assert.equal(hasCurrentLegalConsent({ terms_version: '1.0', privacy_version: PRIVACY_VERSION }), false)
  assert.equal(hasCurrentLegalConsent({ terms_version: TERMS_VERSION, privacy_version: PRIVACY_VERSION }), true)
})
