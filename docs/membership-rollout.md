# Arize membership rollout

## Current safe state

- `BILLING_ENFORCEMENT_ENABLED` defaults to `false`.
- While it is false, every signed-in member receives Plus-level app access.
- The membership page is a preview and checkout is disabled.
- No early-member trial is created merely by deploying the application or the database schema.
- No payment-provider products, prices, keys, checkout sessions, portal sessions, or webhooks are configured yet.

## Agreed first-version plans

- Core is free.
- Plus is $1.99 monthly or $19.99 annually.
- New members receive a 7-day Plus trial with a card required. This begins only after verified checkout completion.
- Members whose profile predates the billing launch receive a complimentary 14-day Plus trial without a card or automatic charge.
- Clarity limits are 5 messages/day and 20/month on Core, and 30/day and 300/month on Plus.

The rest of the limits live in `lib/access/entitlements.ts`, which is the product source of truth used by the UI and server routes.

## Launch order

1. Apply `supabase/schema-updates.sql` and verify `access_grants` RLS plus `consume_coach_quota_for_plan`.
2. Confirm the correct business-owned payment account.
3. Create and verify monthly and annual prices, card-required trial checkout, customer portal, and signed webhooks.
4. Test subscription start, trial, renewal, cancellation, failed payment, and webhook replay handling in test mode.
5. Set the early-member launch timestamp in `supabase/early-member-trial-launch.sql` and run it once.
6. Enable membership enforcement in a preview deployment and run Core/Plus end-to-end tests.
7. Enable membership enforcement in production only after the preview passes.

Never enable enforcement before the access-grant migration and verified webhook flow are live. If those dependencies fail after launch, turn enforcement off to restore full app access while the issue is investigated.
