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

const PRIORIDAD_CLASSES: Record<string, string> = {
  alta: 'text-stone-900 font-medium',
  media: 'text-stone-600',
  baja: 'text-stone-400',
}

const FRECUENCIA_LABELS: Record<string, string> = {
  diaria: 'Diaria',
  unica: 'Definida',
  lapso: 'Lapso',
  semanal: 'Semanal',
  mensual: 'Mensual',
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

  if (!esGestor) {
    const { data: misTareas } = await supabase
      .from('tasks')
      .select('id')
      .eq('asignado_a', user.id)

    const ids = (misTareas ?? []).map((t: { id: string }) => t.id)
    if (ids.length === 0) {
      return <Shell><Empty esGestor={false} /></Shell>
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
    completadoresMap = new Map((completadores ?? []).map((p) => [p.id, p]))
  }

  return (
    <Shell>
      {lista.length === 0 ? (
        <Empty esGestor={esGestor} />
      ) : (
        <div className="border-t border-stone-200">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200 text-[10px] uppercase tracking-[0.18em] text-stone-500">
                <th className="py-4 pr-4 font-medium">Tarea</th>
                <th className="py-4 pr-4 font-medium">Tipo</th>
                <th className="py-4 pr-4 font-medium">Vencía</th>
                <th className="py-4 pr-4 font-medium">Completada</th>
                {esGestor && <th className="py-4 pr-4 font-medium">Por</th>}
                <th className="py-4 pr-4 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((inst) => {
                if (!inst.task) return null
                const tipo =
                  FRECUENCIA_LABELS[inst.task.frecuencia] ?? inst.task.frecuencia
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
                    className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="py-5 pr-4">
                      <p className="text-stone-900">{inst.task.titulo}</p>
                      <p
                        className={`text-[10px] uppercase tracking-widest mt-1 ${
                          PRIORIDAD_CLASSES[inst.task.prioridad] ??
                          'text-stone-500'
                        }`}
                      >
                        {inst.task.prioridad}
                      </p>
                    </td>
                    <td className="py-5 pr-4 text-sm text-stone-600">{tipo}</td>
                    <td className="py-5 pr-4 text-sm text-stone-600">
                      {formatDateEs(inst.fecha_limite)}
                    </td>
                    <td className="py-5 pr-4">
                      <p className="text-sm text-stone-900">{completadoFmt}</p>
                      {aTiempo !== null && (
                        <p
                          className={`text-[10px] uppercase tracking-widest mt-1 ${
                            aTiempo ? 'text-stone-700' : 'text-stone-900 font-medium'
                          }`}
                        >
                          {aTiempo ? 'A tiempo' : 'Tarde'}
                        </p>
                      )}
                    </td>
                    {esGestor && (
                      <td className="py-5 pr-4 text-sm text-stone-700">
                        {completadoBy?.nombre || completadoBy?.email || '—'}
                      </td>
                    )}
                    <td className="py-5 pr-4 text-sm text-stone-600 max-w-xs">
                      {inst.notas ? (
                        <span className="line-clamp-2">{inst.notas}</span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            CAJA TASKS
          </Link>
          <Link
            href="/dashboard"
            className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-14">
        <div className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
            Tareas
          </p>
          <h1 className="font-serif text-4xl text-stone-900 mb-2">Histórico</h1>
          <p className="text-sm text-stone-600">
            Últimas 50 tareas completadas.
          </p>
        </div>
        {children}
      </main>
    </div>
  )
}

function formatDateTimeEs(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
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
    <div className="border-t border-stone-200 pt-20 text-center">
      <h2 className="font-serif text-2xl text-stone-900 mb-2">
        Aún no hay historial
      </h2>
      <p className="text-sm text-stone-600">
        {esGestor
          ? 'Cuando los cajeros completen tareas aparecerán aquí.'
          : 'Cuando completes una tarea, quedará aquí registrada.'}
      </p>
    </div>
  )
}
