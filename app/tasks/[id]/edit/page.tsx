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

  // Cargar la tarea por id
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, titulo, descripcion, frecuencia, dia_del_mes, prioridad, asignado_a')
    .eq('id', id)
    .eq('activa', true)
    .single()

  if (taskError || !task) {
    notFound()
  }

  // Cargar cajeros para el select
  const { data: cajeros, error: cajerosError } = await supabase
    .from('profiles')
    .select('id, nombre, email')
    .eq('rol', 'cajero')
    .order('nombre', { ascending: true })

  if (cajerosError) {
    console.error('Error cargando cajeros:', cajerosError)
    redirect('/error')
  }

  // Wrapper: pre-llenamos el id para que TaskForm pueda invocar la action
  // con la misma firma que createTask (solo recibe formData)
  const updateTaskWithId = updateTask.bind(null, id)

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Encabezado */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Editar tarea</h1>
              <p className="text-slate-600 mt-1">Modifica los detalles de esta tarea.</p>
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
            task={task}
            action={updateTaskWithId}
            submitLabel="Guardar cambios"
          />
        </div>
      </div>
    </div>
  )
}
