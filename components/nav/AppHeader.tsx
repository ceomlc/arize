import Image from 'next/image'
import Link from 'next/link'

export function AppHeader() {
  return (
    <header className="app-header">
      <Link href="/home" className="app-logo-link" aria-label="Go to Arize home">
        <Image
          src="/flower%20nobg.png"
          alt=""
          width={38}
          height={38}
          priority
        />
        <span>Arize</span>
      </Link>
      <span className="app-header-byline">by AmazeGen</span>
    </header>
  )
}
