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

const inputCls =
  'w-full px-3 py-2.5 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:text-stone-500 focus:outline-none focus:border-stone-900 transition-colors'

const labelCls =
  'block text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 mb-2'

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  await requireAdmin()
  const sp = await searchParams

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <Link
          href="/admin/users"
          className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          ← Usuarios
        </Link>
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mt-6 mb-3">
          Equipo
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 mb-2">
          Nuevo usuario
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 dark:text-stone-500">
          El usuario podrá iniciar sesión inmediatamente con el correo y
          contraseña que definas.
        </p>
      </div>

      {sp.error && (
        <FlashMessage kind="error" code={sp.error} messages={ERROR_MESSAGES} />
      )}

      <form action={createUser} className="space-y-8 border-t border-stone-200 dark:border-stone-800 pt-8">
        <div>
          <label htmlFor="nombre" className={labelCls}>
            Nombre completo
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            placeholder="Ej. María González"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelCls}>
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="usuario@ejemplo.com"
            autoComplete="off"
            className={inputCls}
          />
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
            Será el correo con el que inicie sesión.
          </p>
        </div>

        <div>
          <label htmlFor="password" className={labelCls}>
            Contraseña
          </label>
          <PasswordInput name="password" required showGenerate />
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-3">
            Mínimo 6 caracteres. Recomienda al usuario cambiarla en su primer
            ingreso.
          </p>
        </div>

        <div>
          <span className={labelCls}>Rol</span>
          <RolePicker defaultValue="cajero" />
        </div>

        <div className="flex items-center justify-end gap-4 pt-6 border-t border-stone-200 dark:border-stone-800">
          <Link
            href="/admin/users"
            className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            Cancelar
          </Link>
          <SubmitButton label="Crear usuario" pendingLabel="Creando" />
        </div>
      </form>
    </div>
  )
}
