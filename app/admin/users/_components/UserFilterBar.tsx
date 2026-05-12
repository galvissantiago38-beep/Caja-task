'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Admin' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'visual', label: 'Visual' },
  { value: 'almacenista', label: 'Almacén' },
]

export default function UserFilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const currentRol = params.get('rol') ?? 'all'
  const currentQ = params.get('q') ?? ''

  function buildHref(next: { rol?: string; q?: string }) {
    const sp = new URLSearchParams(params.toString())
    if (next.rol !== undefined) {
      if (next.rol === 'all') sp.delete('rol')
      else sp.set('rol', next.rol)
    }
    if (next.q !== undefined) {
      if (next.q === '') sp.delete('q')
      else sp.set('q', next.q)
    }
    sp.delete('ok')
    sp.delete('error')
    const qs = sp.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const value = String(formData.get('q') ?? '')
    router.push(buildHref({ q: value }))
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between pb-4">
      <form
        key={currentQ}
        onSubmit={onSubmit}
        className="flex-1 sm:max-w-xs"
      >
        <input
          name="q"
          type="search"
          defaultValue={currentQ}
          placeholder="Buscar por nombre o correo"
          className="w-full px-0 py-2 border-0 border-b border-stone-300 dark:border-stone-700 bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:text-stone-500 text-sm focus:outline-none focus:border-stone-900 transition-colors"
        />
      </form>

      <div className="flex gap-1">
        {FILTERS.map((f) => {
          const active = currentRol === f.value
          return (
            <Link
              key={f.value}
              href={buildHref({ rol: f.value })}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                active
                  ? 'text-stone-900 dark:text-stone-100 underline underline-offset-4 decoration-stone-900'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
