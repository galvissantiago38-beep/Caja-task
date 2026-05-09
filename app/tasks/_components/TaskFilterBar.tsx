'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const AREAS = [
  { value: 'all', label: 'Todas' },
  { value: 'cajero', label: 'Caja' },
  { value: 'visual', label: 'Visual' },
  { value: 'almacenista', label: 'Almacén' },
]

const PRIORIDADES = [
  { value: 'all', label: 'Todas' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
]

export default function TaskFilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const currentQ = params.get('q') ?? ''
  const currentArea = params.get('area') ?? 'all'
  const currentPrio = params.get('prioridad') ?? 'all'

  function buildHref(next: { q?: string; area?: string; prioridad?: string }) {
    const sp = new URLSearchParams(params.toString())
    if (next.q !== undefined) {
      if (next.q) sp.set('q', next.q)
      else sp.delete('q')
    }
    if (next.area !== undefined) {
      if (next.area === 'all') sp.delete('area')
      else sp.set('area', next.area)
    }
    if (next.prioridad !== undefined) {
      if (next.prioridad === 'all') sp.delete('prioridad')
      else sp.set('prioridad', next.prioridad)
    }
    sp.delete('ok')
    sp.delete('error')
    const qs = sp.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    router.push(buildHref({ q: String(fd.get('q') ?? '') }))
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500 mr-3">
          Área
        </span>
        {AREAS.map((a) => {
          const active = currentArea === a.value
          return (
            <Link
              key={a.value}
              href={buildHref({ area: a.value })}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] border transition-colors ${
                active
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'border-stone-300 text-stone-600 hover:border-stone-900 hover:text-stone-900'
              }`}
            >
              {a.label}
            </Link>
          )
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
        <form
          key={currentQ}
          onSubmit={onSearch}
          className="flex-1 lg:max-w-xs"
        >
          <input
            name="q"
            type="search"
            defaultValue={currentQ}
            placeholder="Buscar por título"
            className="w-full px-0 py-2 border-0 border-b border-stone-300 bg-transparent text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 text-sm transition-colors"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500 mr-3">
            Prioridad
          </span>
          {PRIORIDADES.map((p) => {
            const active = currentPrio === p.value
            return (
              <Link
                key={p.value}
                href={buildHref({ prioridad: p.value })}
                className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  active
                    ? 'text-stone-900 underline underline-offset-4 decoration-stone-900'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {p.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
