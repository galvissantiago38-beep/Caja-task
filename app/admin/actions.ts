'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_lib/require-admin'

const ROLES = ['admin', 'lider', 'cajero'] as const
type Rol = (typeof ROLES)[number]

function parseRol(value: FormDataEntryValue | null): Rol {
  return ROLES.includes(value as Rol) ? (value as Rol) : 'cajero'
}

export async function createUser(formData: FormData) {
  await requireAdmin()

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const nombre = String(formData.get('nombre') ?? '').trim()
  const rol = parseRol(formData.get('rol'))

  if (!email || !password || !nombre) {
    redirect('/admin/users/new?error=campos')
  }

  const admin = createAdminClient()

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: nombre },
  })

  if (authError || !created.user) {
    console.error('createUser auth:', authError)
    const code = authError?.message?.includes('already') ? 'duplicado' : 'auth'
    redirect(`/admin/users/new?error=${code}`)
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert(
      { id: created.user.id, nombre, email, rol },
      { onConflict: 'id' }
    )

  if (profileError) {
    console.error('createUser profile:', profileError)
    // Limpiar el auth user que quedó huérfano
    await admin.auth.admin.deleteUser(created.user.id)
    redirect('/admin/users/new?error=perfil')
  }

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  redirect('/admin/users?ok=creado')
}

export async function updateUser(id: string, formData: FormData) {
  await requireAdmin()

  const nombre = String(formData.get('nombre') ?? '').trim()
  const rol = parseRol(formData.get('rol'))

  if (!nombre) {
    redirect(`/admin/users/${id}/edit?error=campos`)
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ nombre, rol })
    .eq('id', id)

  if (error) {
    console.error('updateUser:', error)
    redirect(`/admin/users/${id}/edit?error=guardar`)
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${id}/edit`)
  redirect('/admin/users?ok=actualizado')
}

export async function resetUserPassword(id: string, formData: FormData) {
  await requireAdmin()

  const password = String(formData.get('password') ?? '')

  if (password.length < 6) {
    redirect(`/admin/users/${id}/edit?error=password`)
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, { password })

  if (error) {
    console.error('resetUserPassword:', error)
    redirect(`/admin/users/${id}/edit?error=password`)
  }

  redirect(`/admin/users/${id}/edit?ok=password`)
}

export async function deleteUser(id: string) {
  const { user } = await requireAdmin()

  if (user.id === id) {
    redirect('/admin/users?error=auto')
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) {
    console.error('deleteUser:', error)
    redirect('/admin/users?error=eliminar')
  }

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  redirect('/admin/users?ok=eliminado')
}
