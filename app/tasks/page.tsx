import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteTask } from './actions'
import DeleteTaskButton from './_components/DeleteTaskButton'

type TaskRow = {
  id: string
  titulo: string
  frecuencia: string
  prioridad: string
  asignado_a: string | null
  asignado: { id: string; nombre: string | null; email: string } | null
}

const FRECUENCIA_LABELS: Record<string, string> = {
  unica: 'Única',
  diaria: 'Diaria',
  semanal: 'Semanal',
  mensual: 'Mensual',
}

const PRIORIDAD_STYLES: Record<string, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja: 'bg-green-100 text-green-700',
}

export default async function TasksPage() {
  const supabase = await createClient()

  // Verificar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Saber si es líder o cajero
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, nombre')
    .eq('id', user.id)
    .single()

  const esLider = profile?.rol === 'lider'

  // Construimos la query: líder ve todas, cajero solo las suyas
  let query = supabase
    .from('tasks')
    .select(
      'id, titulo, frecuencia, prioridad, asignado_a, asignado:profiles!asignado_a(id, nombre, email)'
    )
    .eq('activa', true)
    .order('created_at', { ascending: false })

  if (!esLider) {
    query = query.eq('asignado_a', user.id)
  }

  const { data: tasks, error } = await query.returns<TaskRow[]>()

  if (error) {
    console.error('Error cargando tareas:', error)
    redirect('/error')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Encabezado */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tareas</h1>
              <p className="text-slate-600 mt-1">
                {esLider
                  ? 'Todas las tareas activas del equipo.'
                  : 'Tus tareas asignadas.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Dashboard
              </Link>
              {esLider && (
                <Link
                  href="/tasks/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  + Nueva tarea
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Lista o estado vacío */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {!tasks || tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">
                {esLider
                  ? 'Aún no hay tareas creadas.'
                  : 'No tienes tareas asignadas por ahora. 🎉'}
              </p>
              {esLider && (
                <Link
                  href="/tasks/new"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Crear la primera tarea
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="py-2 pr-4 font-medium">Título</th>
                    <th className="py-2 pr-4 font-medium">Frecuencia</th>
                    <th className="py-2 pr-4 font-medium">Prioridad</th>
                    <th className="py-2 pr-4 font-medium">Asignado a</th>
                    {esLider && <th className="py-2 pr-4 font-medium">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const nombreCajero =
                      t.asignado?.nombre || t.asignado?.email || '—'
                    return (
                      <tr key={t.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-medium text-slate-900">
                          {t.titulo}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-medium">
                            {FRECUENCIA_LABELS[t.frecuencia] ?? t.frecuencia}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              PRIORIDAD_STYLES[t.prioridad] ??
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {t.prioridad}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{nombreCajero}</td>
                        {esLider && (
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/tasks/${t.id}/edit`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Editar
                              </Link>
                              <DeleteTaskButton
                                action={deleteTask.bind(null, t.id)}
                                titulo={t.titulo}
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
