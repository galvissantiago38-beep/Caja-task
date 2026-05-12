'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const AREAS_VALIDAS = ['cajero', 'visual', 'almacenista']

const AREA_SLUG: Record<string, string> = {
  cajero: 'caja',
  visual: 'visual',
  almacenista: 'almacen',
}

function revalidateArea(area: string) {
  const slug = AREA_SLUG[area]
  if (slug) revalidatePath(`/areas/${slug}`)
}

export async function createNote(area: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!AREAS_VALIDAS.includes(area)) return

  const contenido = String(formData.get('contenido') ?? '').trim()
  const firma = String(formData.get('firma') ?? '').trim() || null

  if (!contenido) return

  const { error } = await supabase.from('notes').insert({
    area,
    contenido,
    firma,
  })

  if (error) {
    console.error('createNote:', error)
    return
  }

  revalidateArea(area)
}

export async function updateNote(noteId: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const contenido = String(formData.get('contenido') ?? '').trim()
  const firma = String(formData.get('firma') ?? '').trim() || null
  const area = String(formData.get('area') ?? '')

  if (!contenido) return

  const { error } = await supabase
    .from('notes')
    .update({ contenido, firma })
    .eq('id', noteId)

  if (error) {
    console.error('updateNote:', error)
    return
  }

  if (AREAS_VALIDAS.includes(area)) revalidateArea(area)
}

export async function deleteNote(noteId: string, area: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('notes').delete().eq('id', noteId)

  if (error) {
    console.error('deleteNote:', error)
    return
  }

  if (AREAS_VALIDAS.includes(area)) revalidateArea(area)
}
