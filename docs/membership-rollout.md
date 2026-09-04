# Arize membership rollout

## Current safe state

- `BILLING_ENFORCEMENT_ENABLED` defaults to `false`.
- While it is false, every signed-in member receives Plus-level app access.
- The membership page includes sandbox-ready Checkout controls, but both the
  public and server checkout flags remain disabled.
- No early-member trial is created merely by deploying the application or the database schema.
- The AmazeGen Stripe sandbox contains a dedicated `Arize Plus` product with
  $1.99 monthly and $19.99 annual prices.
- The sandbox Customer Portal permits invoice viewing, payment-method updates,
  and cancellation at the end of the billing period.
- Vercel has the AmazeGen sandbox restricted key and validates it against
  `STRIPE_EXPECTED_ACCOUNT_ID` before creating Checkout or Portal sessions.
- The Supabase billing migrations are applied. Billing tables have RLS enabled;
  webhook and coach-request tables are service-role only, while members can
  read only their own access and billing-customer records.
- Provider errors are reduced to allow-listed diagnostic fields before logging;
  Stripe or user payloads are not written to application logs.

## Agreed first-version plans

- Core is free.
- Plus is $1.99 monthly or $19.99 annually.
- New members receive a 7-day Plus trial with a card required. This begins only after verified checkout completion.
- Members whose profile predates the billing launch receive a complimentary 14-day Plus trial without a card or automatic charge.
- Clarity limits are 5 messages/day and 20/month on Core, and 30/day and 300/month on Plus.

The rest of the limits live in `lib/access/entitlements.ts`, which is the product source of truth used by the UI and server routes.

## Launch order

1. Run `npm run check` and `npm run billing:check` against the intended deployment environment.
2. Complete monthly and annual sandbox checkout, trial, portal, cancellation,
   failed-payment, and duplicate-webhook tests.
3. Enable enforcement in Preview only and verify both Core and Plus limits.
4. Have the owner select the public launch timestamp. Set that timestamp in
   `supabase/early-member-trial-launch.sql`, review the eligible-member count,
   and run the idempotent script once at launch.
5. Obtain a restricted live key from the business-owned Stripe account. Create
   and verify separate live product, prices, portal configuration, and webhook.
6. Have the business owner and tax adviser choose the product tax category,
   registrations, and whether Stripe Tax should collect tax. Do not enable
   automatic tax before this decision.
7. Obtain legal approval for the published Terms and Privacy Policy, and rotate
   any OpenAI credential that has ever been shared outside the secret manager.
8. Repeat the lifecycle test in live configuration without completing a real
   charge, then enable production checkout and enforcement together.

Never enable enforcement before the access-grant migration and verified webhook flow are live. If those dependencies fail after launch, turn enforcement off to restore full app access while the issue is investigated.

## Verified on September 4, 2026

- Supabase project is healthy on Postgres 17 and all three billing migrations are recorded.
- The project has 24 profiles, zero access grants, zero billing customers, and
  three successfully processed synthetic Stripe webhook events.
- The sandbox Arize product and both recurring prices are active and have the
  expected amounts and intervals.
- The sandbox has no Arize subscription yet. Existing unrelated sandbox
  subscriptions are ignored because their prices and metadata are not on the
  Arize allow-list.
- Monthly Checkout session creation reaches Stripe successfully with a 7-day
  trial and card collection. Completing a test subscription is still required.
- Stripe Tax is intentionally off and the product tax code is intentionally
  unset until the owner/tax-adviser decision.

## Sandbox identifiers

- Stripe account: `acct_1U7yiODPFt9aTNyk`
- Product: `prod_VCRuYB14HNWGMO`
- Monthly price: `price_1UC30aDPFt9aTNykeEuhwFfb`
- Annual price: `price_1UC30dDPFt9aTNykxDAL6VXh`
- Customer Portal configuration: `bpc_1UC3CnDPFt9aTNyk10wZB19w`

These are test-mode identifiers. Live-mode resources must be created and
verified separately before a public paid launch.
