import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteTask } from './actions'
import DeleteTaskButton from './_components/DeleteTaskButton'
import PlazoChip from './_components/PlazoChip'
import TaskFilterBar from './_components/TaskFilterBar'

const PRIORIDAD_CLASSES: Record<string, string> = {
  alta: 'text-stone-900 font-medium',
  media: 'text-stone-600',
  baja: 'text-stone-400',
}

const AREA_LABEL: Record<string, string> = {
  cajero: 'Caja',
  visual: 'Visual',
  almacenista: 'Almacén',
}

type TaskRow = {
  id: string
  titulo: string
  frecuencia: string
  prioridad: string
  area: string | null
  hora_limite: string | null
  fecha_limite: string | null
  apertura: string | null
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string
    ok?: string
    q?: string
    area?: string
    prioridad?: string
  }>
}) {
  const supabase = await createClient()
  const sp = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('tasks')
    .select(
      'id, titulo, frecuencia, prioridad, area, hora_limite, fecha_limite, apertura'
    )
    .eq('activa', true)
    .order('created_at', { ascending: false })

  if (sp.q && sp.q.trim()) {
    query = query.ilike('titulo', `%${sp.q.trim()}%`)
  }
  if (sp.prioridad && ['alta', 'media', 'baja'].includes(sp.prioridad)) {
    query = query.eq('prioridad', sp.prioridad)
  }
  if (sp.area && ['cajero', 'visual', 'almacenista'].includes(sp.area)) {
    query = query.eq('area', sp.area)
  }

  const { data: tasks, error } = await query.overrideTypes<
    TaskRow[],
    { merge: false }
  >()

  if (error) {
    console.error('Error cargando tareas:', error)
    redirect('/error')
  }

  const lista = tasks ?? []
  const tieneFiltros = !!(sp.q || sp.area || sp.prioridad)

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
            ← Áreas
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-14">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
              Tareas
            </p>
            <h1 className="font-serif text-4xl text-stone-900 mb-2">
              Tareas activas
            </h1>
            <p className="text-sm text-stone-600 max-w-md">
              Gestiona las tareas registradas. Para crear o completar una tarea
              concreta entra al área correspondiente.
            </p>
          </div>
          <Link
            href="/tasks/new"
            className="bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
          >
            Nueva tarea
          </Link>
        </div>

        {sp.error && (
          <div className="mb-8 border border-stone-300 bg-stone-50 px-5 py-4 text-sm text-stone-800">
            {sp.error === 'no-completada'
              ? 'No se pudo marcar la tarea como hecha.'
              : 'Algo salió mal.'}
          </div>
        )}

        {lista.length === 0 && !tieneFiltros ? (
          <div className="border-t border-stone-200 pt-20 text-center">
            <h2 className="font-serif text-2xl text-stone-900 mb-3">
              Aún no hay tareas creadas
            </h2>
            <p className="text-sm text-stone-600 mb-8">
              Empieza por entrar a un área desde el dashboard y crea su primera
              tarea.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
            >
              Ir a áreas
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <TaskFilterBar />

            {lista.length === 0 ? (
              <div className="border-t border-stone-200 pt-20 text-center">
                <h3 className="font-serif text-2xl text-stone-900 mb-2">
                  Sin resultados
                </h3>
                <p className="text-sm text-stone-600">
                  Prueba con otra búsqueda o quita los filtros.
                </p>
              </div>
            ) : (
              <div className="border-t border-stone-200">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] uppercase tracking-[0.18em] text-stone-500">
                      <th className="py-4 pr-4 font-medium">Tarea</th>
                      <th className="py-4 pr-4 font-medium">Área</th>
                      <th className="py-4 pr-4 font-medium">Plazo</th>
                      <th className="py-4 pr-4 font-medium">Prioridad</th>
                      <th className="py-4 pr-4 font-medium text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors"
                      >
                        <td className="py-5 pr-4 text-stone-900">{t.titulo}</td>
                        <td className="py-5 pr-4">
                          <span className="text-[11px] uppercase tracking-[0.18em] text-stone-700">
                            {AREA_LABEL[t.area ?? ''] ?? '—'}
                          </span>
                        </td>
                        <td className="py-5 pr-4">
                          <PlazoChip
                            frecuencia={t.frecuencia}
                            hora_limite={t.hora_limite}
                            fecha_limite={t.fecha_limite}
                            apertura={t.apertura}
                          />
                        </td>
                        <td className="py-5 pr-4">
                          <span
                            className={`text-[11px] uppercase tracking-widest ${
                              PRIORIDAD_CLASSES[t.prioridad] ?? 'text-stone-500'
                            }`}
                          >
                            {t.prioridad}
                          </span>
                        </td>
                        <td className="py-5 pr-4">
                          <div className="flex items-center justify-end gap-6">
                            <Link
                              href={`/tasks/${t.id}/edit`}
                              className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
                            >
                              Editar
                            </Link>
                            <DeleteTaskButton
                              action={deleteTask.bind(null, t.id)}
                              titulo={t.titulo}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
