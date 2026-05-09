'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Cajero = {
  id: string
  nombre: string | null
  email: string
  rol?: string | null
}

const ROL_LABEL: Record<string, string> = {
  cajero: 'Cajero',
  visual: 'Visual',
  almacenista: 'Almacén',
}

const PRIORIDADES = [
  { value: 'all', label: 'Todas' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
]

export default function TaskFilterBar({ cajeros }: { cajeros: Cajero[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const currentQ = params.get('q') ?? ''
  const currentPrio = params.get('prioridad') ?? 'all'
  const currentAsig = params.get('asignado') ?? 'all'

  function buildHref(next: { q?: string; prioridad?: string; asignado?: string }) {
    const sp = new URLSearchParams(params.toString())
    if (next.q !== undefined) {
      if (next.q) sp.set('q', next.q)
      else sp.delete('q')
    }
    if (next.prioridad !== undefined) {
      if (next.prioridad === 'all') sp.delete('prioridad')
      else sp.set('prioridad', next.prioridad)
    }
    if (next.asignado !== undefined) {
      if (next.asignado === 'all') sp.delete('asignado')
      else sp.set('asignado', next.asignado)
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

  function onAsignadoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(buildHref({ asignado: e.target.value }))
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:items-center pb-4">
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

      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex gap-1">
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

        <select
          value={currentAsig}
          onChange={onAsignadoChange}
          className="px-3 py-2 border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors"
        >
          <option value="all">Toda el área</option>
          {cajeros.map((c) => {
            const rolLabel = c.rol ? ROL_LABEL[c.rol] : null
            return (
              <option key={c.id} value={c.id}>
                {c.nombre || c.email}
                {rolLabel ? ` — ${rolLabel}` : ''}
              </option>
            )
          })}
        </select>
      </div>
    </div>
  )
}
