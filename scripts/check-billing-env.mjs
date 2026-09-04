const values = process.env
const errors = []
const warnings = []
const allowPreviewEnforcement = process.argv.includes('--allow-enforcement-without-checkout')

function flag(name) {
  const raw = values[name]?.trim().toLowerCase()
  if (raw !== 'true' && raw !== 'false') errors.push(`${name} must be exactly true or false`)
  return raw === 'true'
}

function requireValue(name, pattern) {
  const value = values[name]?.trim()
  if (!value) {
    errors.push(`${name} is missing`)
    return ''
  }
  if (pattern && !pattern.test(value)) errors.push(`${name} has an invalid format`)
  return value
}

const enforcementEnabled = flag('BILLING_ENFORCEMENT_ENABLED')
const serverCheckoutEnabled = flag('STRIPE_CHECKOUT_ENABLED')
const publicCheckoutEnabled = flag('NEXT_PUBLIC_BILLING_CHECKOUT_ENABLED')

if (serverCheckoutEnabled !== publicCheckoutEnabled) {
  errors.push('Server and public checkout flags must match')
}

if (enforcementEnabled && !serverCheckoutEnabled && !allowPreviewEnforcement) {
  errors.push('Enforcement cannot launch while checkout is disabled')
}

if (serverCheckoutEnabled || publicCheckoutEnabled || enforcementEnabled) {
  const mode = requireValue('STRIPE_EXPECTED_MODE', /^(test|live)$/)
  const key = requireValue('ARIZE_STRIPE_SECRET_KEY', /^rk_(test|live)_/)
  requireValue('STRIPE_WEBHOOK_SECRET', /^whsec_/)
  requireValue('STRIPE_EXPECTED_ACCOUNT_ID', /^acct_/)
  const monthlyPrice = requireValue('STRIPE_PRICE_MONTHLY', /^price_/)
  const annualPrice = requireValue('STRIPE_PRICE_ANNUAL', /^price_/)
  requireValue('SUPABASE_SERVICE_ROLE_KEY')
  const appUrl = requireValue('NEXT_PUBLIC_APP_URL')

  if (monthlyPrice && monthlyPrice === annualPrice) errors.push('Monthly and annual price IDs must differ')
  if (mode && key && !key.startsWith(`rk_${mode}_`)) errors.push('Stripe key mode does not match STRIPE_EXPECTED_MODE')

  try {
    const parsed = new URL(appUrl)
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      errors.push('NEXT_PUBLIC_APP_URL must use HTTPS')
    }
  } catch {
    errors.push('NEXT_PUBLIC_APP_URL must be a valid URL')
  }

  if (mode === 'live' && !enforcementEnabled) {
    warnings.push('Live Stripe is configured, but membership enforcement is still disabled')
  }
}

if (!serverCheckoutEnabled && !publicCheckoutEnabled && !enforcementEnabled) {
  warnings.push('Safe rollout mode: checkout and enforcement are disabled')
}

for (const warning of warnings) console.warn(`WARNING: ${warning}`)

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`)
  process.exitCode = 1
} else {
  console.log('Billing environment gate passed. No secret values were printed.')
}
