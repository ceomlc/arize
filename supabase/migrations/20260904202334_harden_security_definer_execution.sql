-- Supabase may grant Data API roles direct EXECUTE privileges. Remove those
-- grants explicitly before restoring only the calls the app needs.

revoke all on function public.claim_billing_webhook_event(text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.claim_billing_webhook_event(text, text, boolean)
  to service_role;

revoke all on function public.consume_coach_quota_for_plan(integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_coach_quota_for_plan(integer, integer)
  to authenticated;

revoke all on function public.record_legal_consent()
  from public, anon, authenticated;
grant execute on function public.record_legal_consent()
  to authenticated;

revoke all on function public.handle_new_user()
  from public, anon, authenticated;
