'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/admin', label: 'Inicio', exact: true },
  { href: '/admin/users', label: 'Usuarios', exact: false },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-stone-200 bg-cream">
      <div className="max-w-6xl mx-auto px-8 flex gap-8">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`py-4 text-[11px] uppercase tracking-[0.2em] border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
