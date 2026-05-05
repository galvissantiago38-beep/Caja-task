import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createTask } from '../actions'
import TaskForm from '../_components/TaskForm'

export default async function NewTaskPage() {
  const supabase = await createClient()

  // Verificar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Solo los líderes pueden crear tareas
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'lider') {
    redirect('/dashboard')
  }

  // Cargar cajeros para el select de "Asignado a"
  const { data: cajeros, error } = await supabase
    .from('profiles')
    .select('id, nombre, email')
    .eq('rol', 'cajero')
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error cargando cajeros:', error)
    redirect('/error')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Encabezado */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Nueva tarea</h1>
              <p className="text-slate-600 mt-1">Crea una tarea y asígnala a un cajero.</p>
            </div>
            <Link
              href="/tasks"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Volver a tareas
            </Link>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <TaskForm
            cajeros={cajeros ?? []}
            action={createTask}
            submitLabel="Crear tarea"
          />
        </div>
      </div>
    </div>
  )
}
