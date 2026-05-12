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

const inputCls =
  'w-full px-3 py-2.5 border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors'

const labelCls =
  'block text-[11px] uppercase tracking-[0.18em] text-stone-700 mb-2'

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
    profile.rol === 'admin' ||
    profile.rol === 'cajero' ||
    profile.rol === 'visual' ||
    profile.rol === 'almacenista'
      ? profile.rol
      : 'cajero'

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <Link
          href="/admin/users"
          className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 transition-colors"
        >
          ← Usuarios
        </Link>
        <div className="flex items-center gap-5 mt-6">
          <div className="w-14 h-14 border border-stone-300 flex items-center justify-center font-serif text-xl sm:text-2xl text-stone-900">
            {(profile.nombre ?? profile.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl text-stone-900">
                {profile.nombre || 'Sin nombre'}
              </h1>
              {eresTu && (
                <span className="text-[9px] uppercase tracking-[0.2em] text-stone-500 border border-stone-300 px-1.5 py-0.5">
                  Tú
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500">{profile.email}</p>
          </div>
          <RoleBadge rol={profile.rol} />
        </div>
      </div>

      {sp.ok && (
        <FlashMessage kind="ok" code={sp.ok} messages={OK_MESSAGES} />
      )}
      {sp.error && (
        <FlashMessage kind="error" code={sp.error} messages={ERROR_MESSAGES} />
      )}

      <form action={updateAction} className="space-y-8 border-t border-stone-200 pt-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
            Datos
          </p>
          <h2 className="font-serif text-xl sm:text-2xl text-stone-900 mb-2">
            Datos y permisos
          </h2>
          <p className="text-sm text-stone-600">
            El correo no se puede cambiar desde aquí.
          </p>
        </div>

        <div>
          <label htmlFor="nombre" className={labelCls}>
            Nombre completo
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            defaultValue={profile.nombre ?? ''}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Correo</label>
          <input
            type="email"
            value={profile.email ?? ''}
            disabled
            className={`${inputCls} bg-stone-50 text-stone-500`}
          />
        </div>

        <div>
          <span className={labelCls}>Rol</span>
          <RolePicker defaultValue={rolDefault} />
          {eresTu && (
            <p className="text-xs text-stone-700 border border-stone-300 bg-stone-50 px-3 py-2 mt-3">
              Si cambias tu propio rol y dejas de ser admin, perderás acceso a
              este panel.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 pt-6 border-t border-stone-200">
          <Link
            href="/admin/users"
            className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-900 transition-colors"
          >
            Cancelar
          </Link>
          <SubmitButton label="Guardar cambios" pendingLabel="Guardando" />
        </div>
      </form>

      <form action={resetAction} className="space-y-6 border-t border-stone-200 pt-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
            Seguridad
          </p>
          <h2 className="font-serif text-xl sm:text-2xl text-stone-900 mb-2">
            Cambiar contraseña
          </h2>
          <p className="text-sm text-stone-600">
            Sustituye la contraseña del usuario. Su sesión activa no se cierra
            automáticamente.
          </p>
        </div>

        <div>
          <label htmlFor="new-password" className={labelCls}>
            Nueva contraseña
          </label>
          <PasswordInput
            name="password"
            id="new-password"
            required
            showGenerate
          />
          <p className="text-xs text-stone-500 mt-2">Mínimo 6 caracteres.</p>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-stone-200">
          <SubmitButton
            label="Actualizar contraseña"
            pendingLabel="Actualizando"
            variant="secondary"
          />
        </div>
      </form>
    </div>
  )
}
