import { createBrowserClient } from '@supabase/ssr'

// Note: once you run `supabase gen types typescript`, replace `any` with the generated Database type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient() {
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
