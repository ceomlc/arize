export const dynamic = 'force-dynamic'

import { BottomNav } from '@/components/nav/BottomNav'
import { WelcomeModal } from '@/components/WelcomeModal'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  return (
    <div style={{ background: '#0A1409', minHeight: '100dvh' }}>
      <div className="app-container">
        {/* Page content */}
        <div style={{ paddingTop: '16px', paddingBottom: '80px', minHeight: '100dvh' }}>
          {children}
        </div>
        <BottomNav />
        <WelcomeModal />
      </div>
    </div>
  )
}
