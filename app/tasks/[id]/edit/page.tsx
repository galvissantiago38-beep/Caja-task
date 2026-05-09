import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateTask } from '../../actions'
import { requireGestor } from '../../_lib/require-gestor'
import TaskForm from '../../_components/TaskForm'

const AREA_SLUG: Record<string, string> = {
  cajero: 'caja',
  visual: 'visual',
  almacenista: 'almacen',
}

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
      'id, titulo, descripcion, frecuencia, prioridad, area, hora_limite, fecha_limite, apertura'
    )
    .eq('id', id)
    .eq('activa', true)
    .single()

  if (taskError || !task) {
    notFound()
  }

  const updateTaskWithId = updateTask.bind(null, id)
  const cancelHref = task.area
    ? `/areas/${AREA_SLUG[task.area] ?? 'caja'}`
    : '/tasks'

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            TASKS
          </Link>
          <Link
            href={cancelHref}
            className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 transition-colors"
          >
            ← Volver
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
          task={task}
          cancelHref={cancelHref}
          action={updateTaskWithId}
          submitLabel="Guardar cambios"
        />
      </main>
    </div>
  )
}
