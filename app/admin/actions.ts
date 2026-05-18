'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_lib/require-admin'

const ROLES = ['admin', 'lider', 'cajero', 'visual', 'almacenista'] as const
type Rol = (typeof ROLES)[number]

function parseRol(value: FormDataEntryValue | null): Rol {
  return ROLES.includes(value as Rol) ? (value as Rol) : 'cajero'
}

async function assertSameTienda(adminClient: ReturnType<typeof createAdminClient>, targetId: string, adminTienda: string) {
  const { data } = await adminClient
    .from('profiles')
    .select('tienda')
    .eq('id', targetId)
    .single()
  if (data?.tienda !== adminTienda) {
    redirect('/admin/users?error=fuera_tienda')
  }
}

export async function updateUser(id: string, formData: FormData) {
  const { profile } = await requireAdmin()

  const nombre = String(formData.get('nombre') ?? '').trim()
  const rol = parseRol(formData.get('rol'))

  if (!nombre) {
    redirect(`/admin/users/${id}/edit?error=campos`)
  }

  const admin = createAdminClient()
  await assertSameTienda(admin, id, profile.tienda)

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
  const { profile } = await requireAdmin()

  const password = String(formData.get('password') ?? '')

  if (password.length < 6) {
    redirect(`/admin/users/${id}/edit?error=password`)
  }

  const admin = createAdminClient()
  await assertSameTienda(admin, id, profile.tienda)

  const { error } = await admin.auth.admin.updateUserById(id, { password })

  if (error) {
    console.error('resetUserPassword:', error)
    redirect(`/admin/users/${id}/edit?error=password`)
  }

  redirect(`/admin/users/${id}/edit?ok=password`)
}

export async function deleteUser(id: string) {
  const { user, profile } = await requireAdmin()

  if (user.id === id) {
    redirect('/admin/users?error=auto')
  }

  const admin = createAdminClient()
  await assertSameTienda(admin, id, profile.tienda)

  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) {
    console.error('deleteUser:', error)
    redirect('/admin/users?error=eliminar')
  }

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  redirect('/admin/users?ok=eliminado')
}
