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

  const rolStyles =
    profile?.rol === 'admin'
      ? 'bg-rose-100 text-rose-700'
      : profile?.rol === 'lider'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-blue-100 text-blue-700'

  const rolLabel =
    profile?.rol === 'admin'
      ? '🛡️ Admin'
      : profile?.rol === 'lider'
      ? '👑 Líder'
      : '🧑‍💼 Cajero'

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
            <p className="text-slate-600 mt-1">
              Actualiza tus datos y tu contraseña.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Dashboard
          </Link>
        </div>

        {sp.ok && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-3 text-sm">
            ✅ {OK_MESSAGES[sp.ok] ?? OK_MESSAGES._default}
          </div>
        )}
        {sp.error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-4 py-3 text-sm">
            ⚠️ {ERROR_MESSAGES[sp.error] ?? ERROR_MESSAGES._default}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-semibold text-slate-700 text-xl">
              {(profile?.nombre ?? user.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-semibold">
                {profile?.nombre ?? 'Sin nombre'}
              </p>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${rolStyles}`}
            >
              {rolLabel}
            </span>
          </div>

          <form action={updateProfile} className="space-y-4">
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nombre <span className="text-rose-500">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                defaultValue={profile?.nombre ?? ''}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo
              </label>
              <input
                type="email"
                value={user.email ?? ''}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                El correo no se puede cambiar desde aquí.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
            </div>
          </form>
        </div>

        <form
          action={changeMyPassword}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Cambiar contraseña
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Verifica tu contraseña actual y elige una nueva.
            </p>
          </div>

          <div>
            <label
              htmlFor="current"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Contraseña actual <span className="text-rose-500">*</span>
            </label>
            <PasswordInput name="current" id="current" required />
          </div>

          <div>
            <label
              htmlFor="nueva"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Nueva contraseña <span className="text-rose-500">*</span>
            </label>
            <PasswordInput name="nueva" id="nueva" required showGenerate />
            <p className="text-xs text-slate-500 mt-2">Mínimo 6 caracteres.</p>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200">
            <SubmitButton
              label="Actualizar contraseña"
              pendingLabel="Actualizando…"
              variant="secondary"
            />
          </div>
        </form>
      </div>
    </div>
  )
}
