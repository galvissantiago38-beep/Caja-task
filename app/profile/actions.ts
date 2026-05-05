'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!nombre) {
    redirect('/profile?error=nombre')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ nombre })
    .eq('id', user.id)

  if (error) {
    console.error('updateProfile:', error)
    redirect('/profile?error=guardar')
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  redirect('/profile?ok=perfil')
}

export async function changeMyPassword(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const current = String(formData.get('current') ?? '')
  const nueva = String(formData.get('nueva') ?? '')

  if (nueva.length < 6) {
    redirect('/profile?error=password_corta')
  }

  // Verificar la contraseña actual reautenticando
  if (user.email && current) {
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    })
    if (signInErr) {
      redirect('/profile?error=password_incorrecta')
    }
  } else {
    redirect('/profile?error=password_incorrecta')
  }

  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) {
    console.error('changeMyPassword:', error)
    redirect('/profile?error=password_cambiar')
  }

  redirect('/profile?ok=password')
}
