import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, nombre, email')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'admin') {
    redirect('/dashboard')
  }

  return { supabase, user, profile }
}
