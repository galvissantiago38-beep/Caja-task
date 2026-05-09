import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addDays, ymdInBogota } from '@/lib/dates'
import { logout } from '../auth/actions'

type InstanceLite = { id: string; fecha_limite: string }

type SummaryCounts = {
  vencidas: number
  hoy: number
  mañana: number
  futuras: number
  total: number
}

const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  lider: 'Líder',
  cajero: 'Cajero',
  visual: 'Visual',
  almacenista: 'Almacenista',
}

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

  const esGestor = profile?.rol === 'lider' || profile?.rol === 'admin'
  const counts = await fetchSummary(supabase, user.id, esGestor)

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            CAJA TASKS
          </Link>
          <nav className="flex items-center gap-8">
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
                Cerrar sesión
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-14">
        <div className="mb-14">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
            Bienvenido
          </p>
          <h1 className="font-serif text-5xl text-stone-900 leading-tight">
            {profile?.nombre || 'Usuario'}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-stone-500">
            <span>{user.email}</span>
            <span className="w-1 h-1 bg-stone-300 rounded-full" />
            <span className="uppercase tracking-widest text-[11px]">
              {ROL_LABEL[profile?.rol ?? ''] ?? 'Usuario'}
            </span>
          </div>
        </div>

        <SummaryCard counts={counts} esGestor={esGestor} />

        {profile?.rol === 'admin' && (
          <section className="border-t border-stone-200 pt-14 mt-14">
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
              Administración
            </p>
            <div className="flex items-end justify-between flex-wrap gap-6">
              <div className="max-w-md">
                <h2 className="font-serif text-2xl text-stone-900 mb-2">
                  Panel del equipo
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Crea usuarios, asigna roles y supervisa la actividad del
                  equipo.
                </p>
              </div>
              <Link
                href="/admin"
                className="bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
              >
                Ir al panel
              </Link>
            </div>
          </section>
        )}

        <section className="border-t border-stone-200 pt-14 mt-14">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
            Tareas
          </p>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div className="max-w-md">
              <h2 className="font-serif text-2xl text-stone-900 mb-2">
                {esGestor ? 'Gestión de tareas' : 'Tus tareas'}
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                {esGestor
                  ? 'Crea, asigna y haz seguimiento de las tareas del equipo.'
                  : 'Consulta y completa las tareas que tienes asignadas.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tasks"
                className="bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
              >
                {esGestor ? 'Ir a tareas' : 'Ver pendientes'}
              </Link>
              <Link
                href="/tasks/historico"
                className="border border-stone-900 text-stone-900 px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-50 transition-colors"
              >
                Histórico
              </Link>
              {esGestor && (
                <Link
                  href="/tasks/new"
                  className="border border-stone-300 text-stone-700 px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:border-stone-900 hover:text-stone-900 transition-colors"
                >
                  Nueva tarea
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

async function fetchSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  esGestor: boolean
): Promise<SummaryCounts> {
  let instances: InstanceLite[] = []

  if (esGestor) {
    const { data } = await supabase
      .from('task_instances')
      .select('id, fecha_limite')
      .is('completada_en', null)
      .overrideTypes<InstanceLite[], { merge: false }>()
    instances = data ?? []
  } else {
    const { data: misTareas } = await supabase
      .from('tasks')
      .select('id')
      .eq('asignado_a', userId)
      .eq('activa', true)
      .overrideTypes<{ id: string }[], { merge: false }>()
    const ids = (misTareas ?? []).map((t) => t.id)
    if (ids.length > 0) {
      const { data } = await supabase
        .from('task_instances')
        .select('id, fecha_limite')
        .in('task_id', ids)
        .is('completada_en', null)
        .overrideTypes<InstanceLite[], { merge: false }>()
      instances = data ?? []
    }
  }

  const today = ymdInBogota(new Date())
  const tomorrow = addDays(today, 1)

  const c: SummaryCounts = {
    vencidas: 0,
    hoy: 0,
    mañana: 0,
    futuras: 0,
    total: instances.length,
  }
  for (const i of instances) {
    if (i.fecha_limite < today) c.vencidas++
    else if (i.fecha_limite === today) c.hoy++
    else if (i.fecha_limite === tomorrow) c.mañana++
    else c.futuras++
  }
  return c
}

function SummaryCard({
  counts,
  esGestor,
}: {
  counts: SummaryCounts
  esGestor: boolean
}) {
  if (counts.total === 0) {
    return (
      <section className="border-t border-stone-200 pt-14">
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
          Estado
        </p>
        <h2 className="font-serif text-2xl text-stone-900 mb-2">
          Sin pendientes
        </h2>
        <p className="text-sm text-stone-600">
          {esGestor
            ? 'No hay tareas pendientes en el equipo.'
            : 'No tienes tareas pendientes. Buen trabajo.'}
        </p>
      </section>
    )
  }

  return (
    <section className="border-t border-stone-200 pt-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
            Pendientes
          </p>
          <h2 className="font-serif text-2xl text-stone-900">
            {esGestor ? 'Resumen del equipo' : 'Resumen personal'}
          </h2>
        </div>
        <Link
          href="/tasks"
          className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
        >
          Ver detalle →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-200">
        <SummaryCell label="Vencidas" count={counts.vencidas} highlight />
        <SummaryCell label="Hoy" count={counts.hoy} highlight={counts.hoy > 0} />
        <SummaryCell label="Mañana" count={counts.mañana} />
        <SummaryCell label="Después" count={counts.futuras} />
      </div>
    </section>
  )
}

function SummaryCell({
  label,
  count,
  highlight = false,
}: {
  label: string
  count: number
  highlight?: boolean
}) {
  const muted = count === 0
  return (
    <div
      className={`bg-white p-6 ${
        muted ? 'text-stone-300' : highlight ? 'text-stone-900' : 'text-stone-700'
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.2em] mb-3">{label}</p>
      <p className="font-serif text-4xl">{count}</p>
    </div>
  )
}
