import Link from 'next/link'
import ThemeToggle from '@/app/_components/ThemeToggle'
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
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            TASKS
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <ThemeToggle />
            <Link
              href={cancelHref}
              className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              ← Volver
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-3">
            Tareas
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 mb-2">
            Editar tarea
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 dark:text-stone-500">
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
