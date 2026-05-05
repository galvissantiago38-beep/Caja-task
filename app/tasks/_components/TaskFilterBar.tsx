'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Cajero = { id: string; nombre: string | null; email: string }

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
    <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
      <form
        key={currentQ}
        onSubmit={onSearch}
        className="flex-1 lg:max-w-sm"
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            name="q"
            type="search"
            defaultValue={currentQ}
            placeholder="Buscar por título"
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </form>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1">
          {PRIORIDADES.map((p) => {
            const active = currentPrio === p.value
            return (
              <Link
                key={p.value}
                href={buildHref({ prioridad: p.value })}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
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
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los cajeros</option>
          {cajeros.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre || c.email}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
