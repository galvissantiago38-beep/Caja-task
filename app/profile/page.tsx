import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PasswordInput from '../admin/users/_components/PasswordInput'
import SubmitButton from '../admin/users/_components/SubmitButton'
import { changeMyPassword, updateProfile } from './actions'

const OK_MESSAGES: Record<string, string> = {
  perfil: 'Perfil actualizado correctamente.',
  password: 'Contraseña actualizada. Te recomiendo cerrar sesión y volver a entrar.',
  _default: 'Listo.',
}

const ERROR_MESSAGES: Record<string, string> = {
  nombre: 'El nombre es obligatorio.',
  guardar: 'No se pudo guardar el perfil.',
  password_corta: 'La nueva contraseña debe tener al menos 6 caracteres.',
  password_incorrecta: 'La contraseña actual no coincide.',
  password_cambiar: 'No se pudo cambiar la contraseña.',
  _default: 'Algo salió mal.',
}

const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  lider: 'Líder',
  cajero: 'Cajero',
}

const inputCls =
  'w-full px-3 py-2.5 border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors'

const labelCls =
  'block text-[11px] uppercase tracking-[0.18em] text-stone-700 mb-2'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const supabase = await createClient()
  const sp = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, rol, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            CAJA TASKS
          </Link>
          <Link
            href="/dashboard"
            className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-14">
        <div className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
            Cuenta
          </p>
          <h1 className="font-serif text-4xl text-stone-900 mb-2">Mi perfil</h1>
          <p className="text-sm text-stone-600">
            Actualiza tus datos y tu contraseña.
          </p>
        </div>

        {sp.ok && (
          <div className="border border-stone-300 bg-stone-50 px-5 py-4 text-sm text-stone-800 mb-8">
            {OK_MESSAGES[sp.ok] ?? OK_MESSAGES._default}
          </div>
        )}
        {sp.error && (
          <div className="border border-stone-900 px-5 py-4 text-sm text-stone-900 mb-8">
            {ERROR_MESSAGES[sp.error] ?? ERROR_MESSAGES._default}
          </div>
        )}

        <section className="border-t border-stone-200 pt-10 mb-14">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-14 h-14 border border-stone-300 flex items-center justify-center font-serif text-2xl text-stone-900">
              {(profile?.nombre ?? user.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-serif text-2xl text-stone-900">
                {profile?.nombre ?? 'Sin nombre'}
              </p>
              <p className="text-sm text-stone-500">{user.email}</p>
            </div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-stone-700 border border-stone-300 px-3 py-1">
              {ROL_LABEL[profile?.rol ?? ''] ?? 'Usuario'}
            </span>
          </div>

          <form action={updateProfile} className="space-y-7">
            <div>
              <label htmlFor="nombre" className={labelCls}>
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                defaultValue={profile?.nombre ?? ''}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Correo</label>
              <input
                type="email"
                value={user.email ?? ''}
                disabled
                className={`${inputCls} bg-stone-50 text-stone-500`}
              />
              <p className="text-xs text-stone-500 mt-2">
                El correo no se puede cambiar desde aquí.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-200">
              <SubmitButton label="Guardar cambios" pendingLabel="Guardando" />
            </div>
          </form>
        </section>

        <section className="border-t border-stone-200 pt-10">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
            Seguridad
          </p>
          <h2 className="font-serif text-2xl text-stone-900 mb-2">
            Cambiar contraseña
          </h2>
          <p className="text-sm text-stone-600 mb-8">
            Verifica tu contraseña actual y elige una nueva.
          </p>

          <form action={changeMyPassword} className="space-y-7">
            <div>
              <label htmlFor="current" className={labelCls}>
                Contraseña actual
              </label>
              <PasswordInput name="current" id="current" required />
            </div>

            <div>
              <label htmlFor="nueva" className={labelCls}>
                Nueva contraseña
              </label>
              <PasswordInput name="nueva" id="nueva" required showGenerate />
              <p className="text-xs text-stone-500 mt-2">Mínimo 6 caracteres.</p>
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-200">
              <SubmitButton
                label="Actualizar contraseña"
                pendingLabel="Actualizando"
                variant="secondary"
              />
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
