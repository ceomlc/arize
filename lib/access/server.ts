import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  resolveAccess,
  type AccessGrantRecord,
  type AccessSnapshot,
} from './entitlements'
import { safeBillingError } from '@/lib/billing/safe-error'

export function isBillingEnforcementEnabled() {
  return process.env.BILLING_ENFORCEMENT_ENABLED?.trim().toLowerCase() === 'true'
}

export async function getUserAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<AccessSnapshot> {
  const billingEnabled = isBillingEnforcementEnabled()
  if (!billingEnabled) return resolveAccess([], false)

  const { data, error } = await supabase
    .from('access_grants')
    .select('plan, source, status, starts_at, ends_at')
    .eq('user_id', userId)
    .in('status', ['active', 'scheduled'])
    .order('starts_at', { ascending: false })
    .limit(20)

  if (error) {
    // Once enforcement is intentionally enabled, a missing or unavailable
    // grant store must never accidentally provide paid access.
    console.error('[membership access]', safeBillingError(error))
    return resolveAccess([], true)
  }

  return resolveAccess((data ?? []) as AccessGrantRecord[], true)
}
