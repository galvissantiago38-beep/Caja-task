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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                ¡Hola, {profile?.nombre || 'Usuario'}! 👋
              </h1>
              <p className="text-slate-600 mt-1">Bienvenido a Caja Tasks</p>
            </div>

            <form>
              <button
                formAction={logout}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        <SummaryCard counts={counts} esGestor={esGestor} />

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Tu información
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 w-32">Nombre:</span>
              <span className="text-slate-900 font-medium">
                {profile?.nombre || 'Sin nombre'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500 w-32">Correo:</span>
              <span className="text-slate-900 font-medium">{user.email}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500 w-32">Rol:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.rol === 'admin'
                    ? 'bg-rose-100 text-rose-700'
                    : profile?.rol === 'lider'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {profile?.rol === 'admin'
                  ? '🛡️ Admin'
                  : profile?.rol === 'lider'
                  ? '👑 Líder'
                  : '🧑‍💼 Cajero'}
              </span>
            </div>
          </div>
        </div>

        {profile?.rol === 'admin' && (
          <div className="bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold mb-1">
                  🛡️ Panel de administración
                </h2>
                <p className="text-rose-100">
                  Crea usuarios, asigna roles y gestiona el equipo.
                </p>
              </div>
              <Link
                href="/admin"
                className="bg-white text-rose-700 px-4 py-2 rounded-lg font-medium hover:bg-rose-50 transition-colors"
              >
                Ir al panel
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Tareas</h2>
          <p className="text-slate-600 mb-4">
            {esGestor
              ? 'Gestiona las tareas del equipo: crea nuevas, edita o desactiva las existentes.'
              : 'Consulta y completa las tareas que tienes asignadas.'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/tasks"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {esGestor ? 'Ir a tareas' : 'Ver mis pendientes'}
            </Link>
            <Link
              href="/tasks/historico"
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              📜 Histórico
            </Link>
            {esGestor && (
              <Link
                href="/tasks/new"
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                + Nueva tarea
              </Link>
            )}
          </div>
        </div>
      </div>
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
      .returns<InstanceLite[]>()
    instances = data ?? []
  } else {
    const { data: misTareas } = await supabase
      .from('tasks')
      .select('id')
      .eq('asignado_a', userId)
      .eq('activa', true)
      .returns<{ id: string }[]>()
    const ids = (misTareas ?? []).map((t) => t.id)
    if (ids.length > 0) {
      const { data } = await supabase
        .from('task_instances')
        .select('id, fecha_limite')
        .in('task_id', ids)
        .is('completada_en', null)
        .returns<InstanceLite[]>()
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
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
        <p className="text-slate-600">
          {esGestor
            ? 'No hay tareas pendientes en el equipo. 🎉'
            : 'No tienes tareas pendientes. ¡Bien hecho! 🎉'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {esGestor ? 'Pendientes del equipo' : 'Mis pendientes'}
        </h2>
        <Link
          href="/tasks"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Ver detalle →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryChip
          label="Vencidas"
          count={counts.vencidas}
          color="red"
          icon="🔴"
        />
        <SummaryChip label="Hoy" count={counts.hoy} color="amber" icon="⚡" />
        <SummaryChip
          label="Mañana"
          count={counts.mañana}
          color="blue"
          icon="📅"
        />
        <SummaryChip
          label="Después"
          count={counts.futuras}
          color="slate"
          icon="⏳"
        />
      </div>
    </div>
  )
}

const CHIP_STYLES: Record<string, string> = {
  red: 'bg-red-50 border-red-200 text-red-900',
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  slate: 'bg-slate-50 border-slate-200 text-slate-700',
}

function SummaryChip({
  label,
  count,
  color,
  icon,
}: {
  label: string
  count: number
  color: keyof typeof CHIP_STYLES
  icon: string
}) {
  const muted = count === 0
  return (
    <div
      className={`rounded-xl border-2 p-3 ${
        muted
          ? 'bg-slate-50 border-slate-200 text-slate-400'
          : CHIP_STYLES[color]
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-medium mb-1">
        <span aria-hidden>{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold">{count}</p>
    </div>
  )
}
