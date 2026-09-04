'use client'

import { createContext, useContext } from 'react'
import type { AccessSnapshot } from '@/lib/access/entitlements'

const AccessContext = createContext<AccessSnapshot | null>(null)

export function AccessProvider({
  access,
  children,
}: {
  access: AccessSnapshot
  children: React.ReactNode
}) {
  return <AccessContext.Provider value={access}>{children}</AccessContext.Provider>
}

export function useAccess() {
  const access = useContext(AccessContext)
  if (!access) throw new Error('useAccess must be used inside AccessProvider')
  return access
}
