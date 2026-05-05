import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '../../../_lib/require-admin'
import { resetUserPassword, updateUser } from '../../../actions'
import RoleBadge from '../../../_components/RoleBadge'
import RolePicker from '../../_components/RolePicker'
import PasswordInput from '../../_components/PasswordInput'
import SubmitButton from '../../_components/SubmitButton'
import FlashMessage from '../../_components/FlashMessage'

type Profile = {
  id: string
  nombre: string | null
  email: string | null
  rol: 'admin' | 'lider' | 'cajero' | string | null
}

const OK_MESSAGES: Record<string, string> = {
  password: 'Contraseña actualizada correctamente.',
  _default: 'Listo.',
}

const ERROR_MESSAGES: Record<string, string> = {
  campos: 'El nombre es obligatorio.',
  guardar: 'No se pudieron guardar los cambios.',
  password: 'No se pudo cambiar la contraseña.',
  _default: 'Algo salió mal.',
}

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const { user: currentUser } = await requireAdmin()
  const { id } = await params
  const sp = await searchParams

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, nombre, email, rol')
    .eq('id', id)
    .single<Profile>()

  if (!profile) {
    notFound()
  }

  const eresTu = profile.id === currentUser.id
  const updateAction = updateUser.bind(null, profile.id)
  const resetAction = resetUserPassword.bind(null, profile.id)

  const rolDefault =
    profile.rol === 'admin' || profile.rol === 'lider' || profile.rol === 'cajero'
      ? profile.rol
      : 'cajero'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Volver a usuarios
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-semibold text-slate-700 text-lg">
            {(profile.nombre ?? profile.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {profile.nombre || 'Sin nombre'}
              </h2>
              {eresTu && (
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 rounded-full px-2 py-0.5">
                  Tú
                </span>
              )}
            </div>
            <p className="text-slate-500">{profile.email}</p>
          </div>
          <div className="ml-auto">
            <RoleBadge rol={profile.rol} />
          </div>
        </div>
      </div>

      {sp.ok && (
        <FlashMessage kind="ok" code={sp.ok} messages={OK_MESSAGES} />
      )}
      {sp.error && (
        <FlashMessage kind="error" code={sp.error} messages={ERROR_MESSAGES} />
      )}

      <form
        action={updateAction}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Datos y permisos
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            El correo no se puede cambiar desde aquí. Hazlo en Supabase Auth si
            lo necesitas.
          </p>
        </div>

        <div>
          <label
            htmlFor="nombre"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Nombre completo <span className="text-rose-500">*</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            defaultValue={profile.nombre ?? ''}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Correo
          </label>
          <input
            type="email"
            value={profile.email ?? ''}
            disabled
            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">
            Rol
          </span>
          <RolePicker defaultValue={rolDefault} />
          {eresTu && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
              ⚠️ Si cambias tu propio rol y dejas de ser admin, perderás acceso a
              este panel.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/admin/users"
            className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </Link>
          <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
        </div>
      </form>

      <form
        action={resetAction}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Cambiar contraseña
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Sustituye la contraseña del usuario. La sesión activa del usuario
            no se cierra automáticamente.
          </p>
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Nueva contraseña <span className="text-rose-500">*</span>
          </label>
          <PasswordInput
            name="password"
            id="new-password"
            required
            showGenerate
          />
          <p className="text-xs text-slate-500 mt-2">Mínimo 6 caracteres.</p>
        </div>

        <div className="flex items-center justify-end pt-2">
          <SubmitButton
            label="Actualizar contraseña"
            pendingLabel="Actualizando…"
            variant="secondary"
          />
        </div>
      </form>
    </div>
  )
}
