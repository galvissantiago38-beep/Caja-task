'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireGestor } from './_lib/require-gestor'

// CREATE: crear una nueva tarea
export async function createTask(formData: FormData) {
  const { supabase, user } = await requireGestor()

  const titulo = formData.get('titulo') as string
  const descripcion = formData.get('descripcion') as string
  const frecuencia = formData.get('frecuencia') as string
  const prioridad = formData.get('prioridad') as string
  const asignado_a = formData.get('asignado_a') as string
  const dia_del_mes_raw = formData.get('dia_del_mes') as string

  // Si frecuencia es "mensual", parseamos el día; si no, queda null
  const dia_del_mes =
    frecuencia === 'mensual' && dia_del_mes_raw
      ? parseInt(dia_del_mes_raw, 10)
      : null

  const { error } = await supabase.from('tasks').insert({
    titulo,
    descripcion: descripcion || null,
    frecuencia,
    prioridad: prioridad || 'media',
    asignado_a: asignado_a || null,
    creado_por: user.id,
    dia_del_mes,
    activa: true,
  })

  if (error) {
    console.error('Error creando tarea:', error)
    redirect('/error')
  }

  revalidatePath('/tasks')
  redirect('/tasks')
}

// UPDATE: actualizar una tarea existente
export async function updateTask(id: string, formData: FormData) {
  const { supabase } = await requireGestor()

  const titulo = formData.get('titulo') as string
  const descripcion = formData.get('descripcion') as string
  const frecuencia = formData.get('frecuencia') as string
  const prioridad = formData.get('prioridad') as string
  const asignado_a = formData.get('asignado_a') as string
  const dia_del_mes_raw = formData.get('dia_del_mes') as string

  const dia_del_mes =
    frecuencia === 'mensual' && dia_del_mes_raw
      ? parseInt(dia_del_mes_raw, 10)
      : null

  const { error } = await supabase
    .from('tasks')
    .update({
      titulo,
      descripcion: descripcion || null,
      frecuencia,
      prioridad: prioridad || 'media',
      asignado_a: asignado_a || null,
      dia_del_mes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error actualizando tarea:', error)
    redirect('/error')
  }

  revalidatePath('/tasks')
  redirect('/tasks')
}

// DELETE (soft): marca la tarea como inactiva
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
}