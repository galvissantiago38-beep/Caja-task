import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ROLES_GESTOR = ['lider', 'admin']

export async function requireGestor() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, nombre')
    .eq('id', user.id)
    .single()

  if (!profile || !ROLES_GESTOR.includes(profile.rol)) {
    redirect('/dashboard')
  }

  return { supabase, user, profile }
}
