import Link from 'next/link'
import { createUser } from '../../actions'
import { requireAdmin } from '../../_lib/require-admin'
import PasswordInput from '../_components/PasswordInput'
import RolePicker from '../_components/RolePicker'
import SubmitButton from '../_components/SubmitButton'
import FlashMessage from '../_components/FlashMessage'

const ERROR_MESSAGES: Record<string, string> = {
  campos: 'Faltan campos obligatorios.',
  duplicado: 'Ya existe un usuario con ese correo.',
  auth: 'No se pudo crear el usuario en Supabase Auth.',
  perfil: 'El usuario se creó pero falló al guardar el perfil.',
  _default: 'No se pudo crear el usuario.',
}

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  await requireAdmin()
  const sp = await searchParams

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Volver a usuarios
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 mt-2">
          Crear nuevo usuario
        </h2>
        <p className="text-slate-600 mt-1">
          El usuario podrá iniciar sesión inmediatamente con el correo y
          contraseña que definas (sin confirmación por email).
        </p>
      </div>

      {sp.error && (
        <div className="mb-4">
          <FlashMessage kind="error" code={sp.error} messages={ERROR_MESSAGES} />
        </div>
      )}

      <form
        action={createUser}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
      >
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
            placeholder="Ej. María González"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Correo electrónico <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="usuario@ejemplo.com"
            autoComplete="off"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Será el correo con el que inicie sesión.
          </p>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Contraseña <span className="text-rose-500">*</span>
          </label>
          <PasswordInput name="password" required showGenerate />
          <p className="text-xs text-slate-500 mt-2">
            Mínimo 6 caracteres. Recomienda al usuario cambiarla en su primer
            ingreso.
          </p>
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">
            Rol
          </span>
          <RolePicker defaultValue="cajero" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/admin/users"
            className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </Link>
          <SubmitButton label="Crear usuario" pendingLabel="Creando…" />
        </div>
      </form>
    </div>
  )
}
