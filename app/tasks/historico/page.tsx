import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDateEs } from '@/lib/dates'

type CompletedInstance = {
  id: string
  fecha_limite: string
  completada_en: string
  notas: string | null
  task: {
    id: string
    titulo: string
    frecuencia: string
    prioridad: string
    asignado_a: string | null
  } | null
  completada_por: string | null
}

type ProfileLite = { id: string; nombre: string | null; email: string | null }

const PRIORIDAD_STYLES: Record<string, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja: 'bg-green-100 text-green-700',
}

const FRECUENCIA_LABELS: Record<string, string> = {
  diaria: '📅 Diaria',
  unica: '🎯 Definida',
  lapso: '🗓️ Lapso',
  semanal: '📆 Semanal',
  mensual: '📆 Mensual',
}

export default async function HistoricoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, nombre')
    .eq('id', user.id)
    .single()

  const esGestor = profile?.rol === 'lider' || profile?.rol === 'admin'

  let query = supabase
    .from('task_instances')
    .select(
      'id, fecha_limite, completada_en, notas, completada_por, task:tasks!task_id(id, titulo, frecuencia, prioridad, asignado_a)'
    )
    .not('completada_en', 'is', null)
    .order('completada_en', { ascending: false })
    .limit(50)

  // Si no es gestor, filtrar por sus propias tareas
  if (!esGestor) {
    const { data: misTareas } = await supabase
      .from('tasks')
      .select('id')
      .eq('asignado_a', user.id)

    const ids = (misTareas ?? []).map((t: { id: string }) => t.id)
    if (ids.length === 0) {
      return <Empty esGestor={false} />
    }
    query = query.in('task_id', ids)
  }

  const { data: items, error } = await query.overrideTypes<
    CompletedInstance[],
    { merge: false }
  >()
  if (error) {
    console.error('histórico error:', error)
    redirect('/error')
  }

  const lista = items ?? []

  // Cargar nombres de quienes completaron (un solo query)
  const completadoresIds = Array.from(
    new Set(lista.map((i) => i.completada_por).filter(Boolean) as string[])
  )

  let completadoresMap = new Map<string, ProfileLite>()
  if (completadoresIds.length > 0) {
    const { data: completadores } = await supabase
      .from('profiles')
      .select('id, nombre, email')
      .in('id', completadoresIds)
      .overrideTypes<ProfileLite[], { merge: false }>()
    completadoresMap = new Map(
      (completadores ?? []).map((p) => [p.id, p])
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Histórico</h1>
              <p className="text-slate-600 mt-1">
                {esGestor
                  ? 'Tareas completadas por el equipo (últimas 50).'
                  : 'Tareas que has completado (últimas 50).'}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {lista.length === 0 ? (
          <Empty esGestor={esGestor} />
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-3 px-5 font-semibold">Tarea</th>
                    <th className="py-3 px-5 font-semibold">Tipo</th>
                    <th className="py-3 px-5 font-semibold">Vencía</th>
                    <th className="py-3 px-5 font-semibold">Completada</th>
                    {esGestor && (
                      <th className="py-3 px-5 font-semibold">Por</th>
                    )}
                    <th className="py-3 px-5 font-semibold">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((inst) => {
                    if (!inst.task) return null
                    const tipo = FRECUENCIA_LABELS[inst.task.frecuencia] ?? inst.task.frecuencia
                    const completadoBy = inst.completada_por
                      ? completadoresMap.get(inst.completada_por)
                      : null
                    const completadoFmt = formatDateTimeEs(inst.completada_en)
                    const aTiempo = !inst.completada_en
                      ? null
                      : inst.completada_en.slice(0, 10) <= inst.fecha_limite
                    return (
                      <tr
                        key={inst.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="py-3 px-5">
                          <p className="font-medium text-slate-900">
                            {inst.task.titulo}
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              PRIORIDAD_STYLES[inst.task.prioridad] ??
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {inst.task.prioridad}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-sm text-slate-600">
                          {tipo}
                        </td>
                        <td className="py-3 px-5 text-sm text-slate-600">
                          {formatDateEs(inst.fecha_limite)}
                        </td>
                        <td className="py-3 px-5">
                          <p className="text-sm text-slate-900">
                            {completadoFmt}
                          </p>
                          {aTiempo !== null && (
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                aTiempo
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {aTiempo ? '✓ A tiempo' : '⚠ Tarde'}
                            </span>
                          )}
                        </td>
                        {esGestor && (
                          <td className="py-3 px-5 text-sm text-slate-700">
                            {completadoBy?.nombre ||
                              completadoBy?.email ||
                              '—'}
                          </td>
                        )}
                        <td className="py-3 px-5 text-sm text-slate-600 max-w-xs">
                          {inst.notas ? (
                            <span className="line-clamp-2">{inst.notas}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDateTimeEs(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  // Render in Bogota timezone for the user's familiarity.
  return d.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Empty({ esGestor }: { esGestor: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
      <div className="text-4xl mb-3">📜</div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        Aún no hay historial
      </h2>
      <p className="text-slate-500">
        {esGestor
          ? 'Cuando los cajeros completen tareas aparecerán aquí.'
          : 'Cuando completes una tarea, quedará aquí registrada.'}
      </p>
    </div>
  )
}
