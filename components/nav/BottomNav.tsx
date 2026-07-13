'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, CheckSquare, Users, Settings } from 'lucide-react'

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/reset', label: 'Reset', icon: Clock },
  { href: '/goals', label: 'Goals', icon: CheckSquare },
  { href: '/village', label: 'Village', icon: Users },
  { href: '/settings', label: 'Profile', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '430px',
      height: '72px',
      background: 'rgba(26,46,30,0.95)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 8px 8px',
      backdropFilter: 'blur(12px)',
      zIndex: 100,
    }}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '6px 12px', borderRadius: '10px',
              textDecoration: 'none', transition: 'opacity 0.15s',
              color: active ? '#C9A227' : '#BDB5A0',
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
            <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400, letterSpacing: '0.03em' }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
