import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addDays, ymdInBogota } from '@/lib/dates'
import ThemeToggle from '../_components/ThemeToggle'
import { logout } from '../auth/actions'

type InstanceLite = {
  id: string
  fecha_limite: string | null
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>
}) {
  const supabase = await createClient()
  const sp = await searchParams

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
    (i) => i.fecha_limite !== null && i.fecha_limite < today
  ).length
  const totalHoy = (instances ?? []).filter(
    (i) => i.fecha_limite === today
  ).length
  const totalManana = (instances ?? []).filter(
    (i) => i.fecha_limite === tomorrow
  ).length

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            TASKS
          </Link>
          <nav className="flex items-center gap-4 sm:gap-8">
            <ThemeToggle />
            <Link
              href="/profile"
              className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Mi perfil
            </Link>
            <form>
              <button
                formAction={logout}
                className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        {sp.ok === 'usuario_creado' && (
          <div className="mb-10 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-5 py-4 text-sm text-stone-800 dark:text-stone-200">
            Usuario creado correctamente.
          </div>
        )}

        <div className="mb-14">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-3">
            Massimo Dutti · Calle 82
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 dark:text-stone-100 leading-tight italic">
            {greetingForBogota()}.
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-4 max-w-md leading-relaxed">
            Crecer haciendo crecer. Selecciona un área para ver y gestionar sus
            tareas.
          </p>
        </div>

        <section>
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-5">
            Áreas
          </p>
          <div className="grid gap-px bg-stone-200 dark:bg-stone-800 sm:grid-cols-3">
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
          <section className="border-t border-stone-200 dark:border-stone-800 pt-12 mt-14">
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-5">
              Resumen general
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-200 dark:bg-stone-800">
              <Stat label="Pendientes" value={totalPending} highlight />
              <Stat label="Vencidas" value={totalVencidas} />
              <Stat label="Hoy" value={totalHoy} />
              <Stat label="Mañana" value={totalManana} />
            </div>
          </section>
        )}

        <section className="border-t border-stone-200 dark:border-stone-800 pt-10 mt-14 flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.18em]">
          <Link
            href="/users/new"
            className="text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-300 dark:decoration-stone-700 hover:decoration-stone-900 dark:hover:decoration-stone-100 transition-colors"
          >
            + Crear usuario
          </Link>
          <Link
            href="/tasks/historico"
            className="text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-300 dark:decoration-stone-700 hover:decoration-stone-900 dark:hover:decoration-stone-100 transition-colors"
          >
            Histórico →
          </Link>
          {profile?.rol === 'admin' && (
            <Link
              href="/admin"
              className="text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-300 dark:decoration-stone-700 hover:decoration-stone-900 dark:hover:decoration-stone-100 transition-colors"
            >
              Vista general →
            </Link>
          )}
        </section>
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
    if (inst.fecha_limite !== null && inst.fecha_limite < today) c.vencidas++
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
      className="bg-white dark:bg-stone-900 p-8 hover:bg-stone-50 dark:hover:bg-stone-800 dark:bg-stone-900 transition-colors group"
    >
      <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-4">
        Área
      </p>
      <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 mb-6 group-hover:underline underline-offset-4 decoration-1">
        {label}
      </h3>
      <div className="space-y-1">
        <p className="text-sm text-stone-700 dark:text-stone-300">
          <span className="font-serif text-xl sm:text-2xl text-stone-900 dark:text-stone-100 mr-1">
            {counts.total}
          </span>
          {counts.total === 1 ? 'tarea pendiente' : 'tareas pendientes'}
        </p>
        {counts.vencidas > 0 && (
          <p className="text-xs text-stone-900 dark:text-stone-100 font-medium">
            {counts.vencidas} vencida{counts.vencidas !== 1 ? 's' : ''}
          </p>
        )}
        {counts.hoy > 0 && (
          <p className="text-xs text-stone-700 dark:text-stone-300">
            {counts.hoy} para hoy
          </p>
        )}
      </div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 mt-8 group-hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
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
      className={`bg-white dark:bg-stone-900 p-6 ${
        muted ? 'text-stone-300 dark:text-stone-700' : highlight ? 'text-stone-900 dark:text-stone-100' : 'text-stone-700 dark:text-stone-300'
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.2em] mb-3">{label}</p>
      <p className="font-serif text-3xl sm:text-4xl">{value}</p>
    </div>
  )
}
