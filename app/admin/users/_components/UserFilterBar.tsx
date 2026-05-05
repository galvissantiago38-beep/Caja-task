'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Admin' },
  { value: 'lider', label: 'Líder' },
  { value: 'cajero', label: 'Cajero' },
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
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <form
        key={currentQ}
        onSubmit={onSubmit}
        className="flex-1 sm:max-w-md"
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            name="q"
            type="search"
            defaultValue={currentQ}
            placeholder="Buscar por nombre o correo"
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
          />
        </div>
      </form>

      <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1 self-start">
        {FILTERS.map((f) => {
          const active = currentRol === f.value
          return (
            <Link
              key={f.value}
              href={buildHref({ rol: f.value })}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                active
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
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
