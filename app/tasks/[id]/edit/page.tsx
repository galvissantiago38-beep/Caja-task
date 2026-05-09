import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { updateTask } from '../../actions'
import { requireGestor } from '../../_lib/require-gestor'
import TaskForm from '../../_components/TaskForm'

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireGestor()

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(
      'id, titulo, descripcion, frecuencia, prioridad, asignado_a, hora_limite, fecha_limite, apertura'
    )
    .eq('id', id)
    .eq('activa', true)
    .single()

  if (taskError || !task) {
    notFound()
  }

  const { data: cajeros, error: cajerosError } = await supabase
    .from('profiles')
    .select('id, nombre, email')
    .eq('rol', 'cajero')
    .order('nombre', { ascending: true })

  if (cajerosError) {
    console.error('Error cargando cajeros:', cajerosError)
    redirect('/error')
  }

  const updateTaskWithId = updateTask.bind(null, id)

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            CAJA TASKS
          </Link>
          <Link
            href="/tasks"
            className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 transition-colors"
          >
            ← Tareas
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-14">
        <div className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
            Tareas
          </p>
          <h1 className="font-serif text-4xl text-stone-900 mb-2">
            Editar tarea
          </h1>
          <p className="text-sm text-stone-600">
            Modifica los detalles de esta tarea.
          </p>
        </div>

        <TaskForm
          cajeros={cajeros ?? []}
          task={task}
          action={updateTaskWithId}
          submitLabel="Guardar cambios"
        />
      </main>
    </div>
  )
}
