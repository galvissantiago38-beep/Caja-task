'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireGestor } from './_lib/require-gestor'

const FRECUENCIAS_VALIDAS = ['unica', 'diaria', 'semanal', 'mensual', 'lapso']
const AREAS_VALIDAS = ['cajero', 'visual', 'almacenista']
const PRIORIDADES_VALIDAS = ['alta', 'media', 'baja']

type TaskPayload = {
  titulo: string
  descripcion: string | null
  frecuencia: string
  prioridad: string
  area: string
  hora_limite: string | null
  fecha_limite: string | null
  apertura: string | null
  dia_del_mes: number | null
}

function buildPayload(formData: FormData): TaskPayload | { error: string } {
  const titulo = String(formData.get('titulo') ?? '').trim()
  if (!titulo) return { error: 'El título es obligatorio.' }

  const frecuenciaRaw = String(formData.get('frecuencia') ?? '')
  if (!FRECUENCIAS_VALIDAS.includes(frecuenciaRaw)) {
    return { error: 'Frecuencia inválida.' }
  }

  const areaRaw = String(formData.get('area') ?? '')
  if (!AREAS_VALIDAS.includes(areaRaw)) {
    return { error: 'Área inválida.' }
  }

  const prioridadRaw = String(formData.get('prioridad') ?? 'media')
  const prioridad = PRIORIDADES_VALIDAS.includes(prioridadRaw)
    ? prioridadRaw
    : 'media'

  const horaRaw = String(formData.get('hora_limite') ?? '').trim()
  const fechaRaw = String(formData.get('fecha_limite') ?? '').trim()
  const aperturaRaw = String(formData.get('apertura') ?? '').trim()
  const diaMesRaw = String(formData.get('dia_del_mes') ?? '').trim()

  if (frecuenciaRaw === 'diaria' && !horaRaw) {
    return { error: 'Las tareas diarias requieren una hora límite.' }
  }
  if (frecuenciaRaw === 'unica' && (!fechaRaw || !horaRaw)) {
    return { error: 'Las tareas definidas requieren fecha y hora.' }
  }
  if (frecuenciaRaw === 'lapso') {
    if (!aperturaRaw || !fechaRaw) {
      return { error: 'Los lapsos requieren apertura y fecha límite.' }
    }
    if (aperturaRaw > fechaRaw) {
      return { error: 'La apertura no puede ser después del cierre.' }
    }
  }

  return {
    titulo,
    descripcion: String(formData.get('descripcion') ?? '').trim() || null,
    frecuencia: frecuenciaRaw,
    prioridad,
    area: areaRaw,
    hora_limite: horaRaw || null,
    fecha_limite: fechaRaw || null,
    apertura: frecuenciaRaw === 'lapso' ? aperturaRaw || null : null,
    dia_del_mes:
      frecuenciaRaw === 'mensual' && diaMesRaw
        ? parseInt(diaMesRaw, 10)
        : null,
  }
}

function areaSlugFromRol(rol: string): string {
  if (rol === 'cajero') return 'caja'
  if (rol === 'almacenista') return 'almacen'
  return rol
}

export async function createTask(formData: FormData) {
  const { supabase, user } = await requireGestor()

  const payload = buildPayload(formData)
  if ('error' in payload) {
    console.error('createTask validation:', payload.error)
    redirect('/error')
  }

  const { error } = await supabase.from('tasks').insert({
    ...payload,
    creado_por: user.id,
    activa: true,
  })

  if (error) {
    console.error('Error creando tarea:', error)
    redirect('/error')
  }

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  revalidatePath(`/areas/${areaSlugFromRol(payload.area)}`)
  redirect(`/areas/${areaSlugFromRol(payload.area)}`)
}

export async function updateTask(id: string, formData: FormData) {
  const { supabase } = await requireGestor()

  const payload = buildPayload(formData)
  if ('error' in payload) {
    console.error('updateTask validation:', payload.error)
    redirect('/error')
  }

  const { error } = await supabase
    .from('tasks')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error actualizando tarea:', error)
    redirect('/error')
  }

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  revalidatePath(`/areas/${areaSlugFromRol(payload.area)}`)
  redirect(`/areas/${areaSlugFromRol(payload.area)}`)
}

export async function deleteTask(id: string) {
  const { supabase } = await requireGestor()

  const { error } = await supabase
    .from('tasks')
    .update({ activa: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error desactivando tarea:', error)
    redirect('/error')
  }

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}

export async function completarInstancia(
  instanceId: string,
  formData: FormData
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const notas = String(formData.get('notas') ?? '').trim() || null

  const { data: instance } = await supabase
    .from('task_instances')
    .select(
      'id, completada_en, task:tasks!task_id(area, asignado_a, activa)'
    )
    .eq('id', instanceId)
    .single<{
      id: string
      completada_en: string | null
      task: {
        area: string | null
        asignado_a: string | null
        activa: boolean
      } | null
    }>()

  if (!instance || !instance.task) {
    redirect('/dashboard?error=no-existe')
  }

  if (instance.completada_en) {
    revalidatePath('/dashboard')
    return
  }

  const { error } = await supabase
    .from('task_instances')
    .update({
      completada_en: new Date().toISOString(),
      completada_por: user.id,
      notas,
    })
    .eq('id', instanceId)

  if (error) {
    console.error('Error completando instancia:', error)
    redirect('/dashboard?error=no-completada')
  }

  revalidatePath('/dashboard')
  revalidatePath('/tasks')
  if (instance.task.area) {
    revalidatePath(`/areas/${areaSlugFromRol(instance.task.area)}`)
  }
}
