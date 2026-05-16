import Link from 'next/link'
import ThemeToggle from '@/app/_components/ThemeToggle'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDateEs } from '@/lib/dates'

type CompletedInstance = {
  id: string
  fecha_limite: string | null
  completada_en: string
  notas: string | null
  task: {
    id: string
    titulo: string
    frecuencia: string
    prioridad: string
    area: string | null
  } | null
}

const PRIORIDAD_CLASSES: Record<string, string> = {
  alta: 'text-stone-900 dark:text-stone-100 font-medium',
  media: 'text-stone-600 dark:text-stone-400 dark:text-stone-500',
  baja: 'text-stone-400 dark:text-stone-500',
}

const FRECUENCIA_LABELS: Record<string, string> = {
  diaria: 'Diaria',
  unica: 'Definida',
  lapso: 'Lapso',
  semanal: 'Semanal',
  mensual: 'Mensual',
  libre: 'Sin fecha',
}

const AREA_LABEL: Record<string, string> = {
  cajero: 'Caja',
  visual: 'Visual',
  almacenista: 'Almacén',
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>
}) {
  const supabase = await createClient()
  const sp = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const query = supabase
    .from('task_instances')
    .select(
      'id, fecha_limite, completada_en, notas, task:tasks!task_id(id, titulo, frecuencia, prioridad, area)'
    )
    .not('completada_en', 'is', null)
    .order('completada_en', { ascending: false })
    .limit(50)

  const { data: items, error } = await query.overrideTypes<
    CompletedInstance[],
    { merge: false }
  >()
  if (error) {
    console.error('histórico error:', error)
    redirect('/error')
  }

  let lista = items ?? []
  if (sp.area && ['cajero', 'visual', 'almacenista'].includes(sp.area)) {
    lista = lista.filter((i) => i.task?.area === sp.area)
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            TASKS
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              ← Áreas
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-3">
            Tareas
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 mb-2">Histórico</h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 dark:text-stone-500">
            Últimas 50 tareas completadas.
          </p>
        </div>

        {lista.length === 0 ? (
          <div className="border-t border-stone-200 dark:border-stone-800 pt-20 text-center">
            <h2 className="font-serif text-xl sm:text-2xl text-stone-900 dark:text-stone-100 mb-2">
              Aún no hay historial
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 dark:text-stone-500">
              Cuando alguien complete una tarea, quedará registrada aquí.
            </p>
          </div>
        ) : (
          <div className="border-t border-stone-200 dark:border-stone-800 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  <th className="py-4 pr-4 font-medium">Tarea</th>
                  <th className="py-4 pr-4 font-medium">Área</th>
                  <th className="py-4 pr-4 font-medium">Tipo</th>
                  <th className="py-4 pr-4 font-medium">Vencía</th>
                  <th className="py-4 pr-4 font-medium">Completada</th>
                  <th className="py-4 pr-4 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((inst) => {
                  if (!inst.task) return null
                  const tipo =
                    FRECUENCIA_LABELS[inst.task.frecuencia] ??
                    inst.task.frecuencia
                  const completadoFmt = formatDateTimeEs(inst.completada_en)
                  const aTiempo =
                    !inst.completada_en || !inst.fecha_limite
                      ? null
                      : inst.completada_en.slice(0, 10) <= inst.fecha_limite
                  return (
                    <tr
                      key={inst.id}
                      className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                    >
                      <td className="py-5 pr-4">
                        <p className="text-stone-900 dark:text-stone-100">{inst.task.titulo}</p>
                        <p
                          className={`text-[10px] uppercase tracking-widest mt-1 ${
                            PRIORIDAD_CLASSES[inst.task.prioridad] ??
                            'text-stone-500 dark:text-stone-400'
                          }`}
                        >
                          {inst.task.prioridad}
                        </p>
                      </td>
                      <td className="py-5 pr-4">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300">
                          {AREA_LABEL[inst.task.area ?? ''] ?? '—'}
                        </span>
                      </td>
                      <td className="py-5 pr-4 text-sm text-stone-600 dark:text-stone-400 dark:text-stone-500">
                        {tipo}
                      </td>
                      <td className="py-5 pr-4 text-sm text-stone-600 dark:text-stone-400 dark:text-stone-500">
                        {inst.fecha_limite ? formatDateEs(inst.fecha_limite) : '—'}
                      </td>
                      <td className="py-5 pr-4">
                        <p className="text-sm text-stone-900 dark:text-stone-100">
                          {completadoFmt}
                        </p>
                        {aTiempo !== null && (
                          <p
                            className={`text-[10px] uppercase tracking-widest mt-1 ${
                              aTiempo
                                ? 'text-stone-700 dark:text-stone-300'
                                : 'text-stone-900 dark:text-stone-100 font-medium'
                            }`}
                          >
                            {aTiempo ? 'A tiempo' : 'Tarde'}
                          </p>
                        )}
                      </td>
                      <td className="py-5 pr-4 text-sm text-stone-600 dark:text-stone-400 dark:text-stone-500 max-w-xs">
                        {inst.notas ? (
                          <span className="line-clamp-2">{inst.notas}</span>
                        ) : (
                          <span className="text-stone-300 dark:text-stone-700">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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
