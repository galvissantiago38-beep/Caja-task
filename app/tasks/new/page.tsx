import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createTask } from '../actions'
import { requireGestor } from '../_lib/require-gestor'
import TaskForm from '../_components/TaskForm'

export default async function NewTaskPage() {
  const { supabase } = await requireGestor()

  const { data: cajeros, error } = await supabase
    .from('profiles')
    .select('id, nombre, email, rol')
    .in('rol', ['cajero', 'visual', 'almacenista'])
    .order('rol', { ascending: true })
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error cargando cajeros:', error)
    redirect('/error')
  }

  return (
    <div className="min-h-screen bg-cream">
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
            Nueva tarea
          </h1>
          <p className="text-sm text-stone-600">
            Crea una tarea y asígnala a alguien del equipo.
          </p>
        </div>

        <TaskForm
          cajeros={cajeros ?? []}
          action={createTask}
          submitLabel="Crear tarea"
        />
      </main>
    </div>
  )
}
