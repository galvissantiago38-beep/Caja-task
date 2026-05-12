import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addDays, ymdInBogota } from '@/lib/dates'
import { logout } from '../auth/actions'

type InstanceLite = {
  id: string
  fecha_limite: string
  task: { area: string | null; asignado_a: string | null } | null
}

type AreaCounts = {
  total: number
  vencidas: number
  hoy: number
}

const AREAS: { key: string; label: string; href: string }[] = [
  { key: 'cajero', label: 'Caja', href: '/areas/caja' },
  { key: 'visual', label: 'Visual', href: '/areas/visual' },
  { key: 'almacenista', label: 'Almacén', href: '/areas/almacen' },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, rol')
    .eq('id', user.id)
    .single()

  const { data: instances } = await supabase
    .from('task_instances')
    .select(
      'id, fecha_limite, task:tasks!task_id(area, asignado_a)'
    )
    .is('completada_en', null)
    .overrideTypes<InstanceLite[], { merge: false }>()

  const today = ymdInBogota(new Date())
  const tomorrow = addDays(today, 1)

  const countsByArea = computeAreaCounts(instances ?? [], today)
  const totalPending = (instances ?? []).length
  const totalVencidas = (instances ?? []).filter(
    (i) => i.fecha_limite < today
  ).length
  const totalHoy = (instances ?? []).filter(
    (i) => i.fecha_limite === today
  ).length
  const totalManana = (instances ?? []).filter(
    (i) => i.fecha_limite === tomorrow
  ).length

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            TASKS
          </Link>
          <nav className="flex items-center gap-4 sm:gap-8">
            <Link
              href="/profile"
              className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 transition-colors"
            >
              Mi perfil
            </Link>
            <form>
              <button
                formAction={logout}
                className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-900 transition-colors"
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="mb-14">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
            Massimo Dutti · Calle 82
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 leading-tight italic">
            {greetingForBogota()}.
          </h1>
          <p className="text-sm text-stone-500 mt-4 max-w-md leading-relaxed">
            Cada detalle cuenta. Selecciona un área para ver y gestionar sus
            tareas.
          </p>
        </div>

        <section>
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-5">
            Áreas
          </p>
          <div className="grid gap-px bg-stone-200 sm:grid-cols-3">
            {AREAS.map((a) => {
              const c = countsByArea[a.key] ?? {
                total: 0,
                vencidas: 0,
                hoy: 0,
              }
              return (
                <AreaCard
                  key={a.key}
                  label={a.label}
                  href={a.href}
                  counts={c}
                />
              )
            })}
          </div>
        </section>

        {totalPending > 0 && (
          <section className="border-t border-stone-200 pt-12 mt-14">
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-5">
              Resumen general
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-200">
              <Stat label="Pendientes" value={totalPending} highlight />
              <Stat label="Vencidas" value={totalVencidas} />
              <Stat label="Hoy" value={totalHoy} />
              <Stat label="Mañana" value={totalManana} />
            </div>
          </section>
        )}

        {profile?.rol === 'admin' && (
          <section className="border-t border-stone-200 pt-14 mt-14">
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
              Administración
            </p>
            <div className="flex items-end justify-between flex-wrap gap-6">
              <div className="max-w-md">
                <h2 className="font-serif text-xl sm:text-2xl text-stone-900 mb-2">
                  Panel de administración
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Gestionar el perfil compartido, tareas activas e histórico.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/admin"
                  className="bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
                >
                  Ir al panel
                </Link>
                <Link
                  href="/tasks/historico"
                  className="border border-stone-900 text-stone-900 px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-50 transition-colors"
                >
                  Histórico
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function greetingForBogota(): string {
  const utcHour = new Date().getUTCHours()
  const bogotaHour = (utcHour - 5 + 24) % 24
  if (bogotaHour < 12) return 'Buenos días'
  if (bogotaHour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function computeAreaCounts(
  instances: InstanceLite[],
  today: string
): Record<string, AreaCounts> {
  const result: Record<string, AreaCounts> = {}
  for (const inst of instances) {
    const area = inst.task?.area
    if (!area) continue
    const c = result[area] ?? { total: 0, vencidas: 0, hoy: 0 }
    c.total++
    if (inst.fecha_limite < today) c.vencidas++
    if (inst.fecha_limite === today) c.hoy++
    result[area] = c
  }
  return result
}

function AreaCard({
  label,
  href,
  counts,
}: {
  label: string
  href: string
  counts: AreaCounts
}) {
  return (
    <Link
      href={href}
      className="bg-white p-8 hover:bg-stone-50 transition-colors group"
    >
      <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-4">
        Área
      </p>
      <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 mb-6 group-hover:underline underline-offset-4 decoration-1">
        {label}
      </h3>
      <div className="space-y-1">
        <p className="text-sm text-stone-700">
          <span className="font-serif text-xl sm:text-2xl text-stone-900 mr-1">
            {counts.total}
          </span>
          {counts.total === 1 ? 'tarea pendiente' : 'tareas pendientes'}
        </p>
        {counts.vencidas > 0 && (
          <p className="text-xs text-stone-900 font-medium">
            {counts.vencidas} vencida{counts.vencidas !== 1 ? 's' : ''}
          </p>
        )}
        {counts.hoy > 0 && (
          <p className="text-xs text-stone-700">
            {counts.hoy} para hoy
          </p>
        )}
      </div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-700 mt-8 group-hover:text-stone-900 transition-colors">
        Entrar →
      </p>
    </Link>
  )
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  const muted = value === 0 && !highlight
  return (
    <div
      className={`bg-white p-6 ${
        muted ? 'text-stone-300' : highlight ? 'text-stone-900' : 'text-stone-700'
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.2em] mb-3">{label}</p>
      <p className="font-serif text-3xl sm:text-4xl">{value}</p>
    </div>
  )
}
