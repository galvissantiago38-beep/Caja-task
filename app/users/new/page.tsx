import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ThemeToggle from '@/app/_components/ThemeToggle'
import { createUser } from '@/app/admin/actions'
import PasswordInput from '@/app/admin/users/_components/PasswordInput'
import RolePicker from '@/app/admin/users/_components/RolePicker'
import SubmitButton from '@/app/admin/users/_components/SubmitButton'
import FlashMessage from '@/app/admin/users/_components/FlashMessage'

const ERROR_MESSAGES: Record<string, string> = {
  campos: 'Faltan campos obligatorios.',
  duplicado: 'Ya existe un usuario con ese correo.',
  auth: 'No se pudo crear el usuario.',
  perfil: 'El usuario se creó pero falló al guardar el perfil.',
  _default: 'No se pudo crear el usuario.',
}

const inputCls =
  'w-full px-3 py-2.5 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors'

const labelCls =
  'block text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 mb-2'

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            TASKS
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-10">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-3">
            Equipo
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 mb-2">
            Nuevo usuario
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Crea una cuenta para alguien del equipo. Podrá iniciar sesión
            inmediatamente con el correo y contraseña que definas.
          </p>
        </div>

        {sp.error && (
          <FlashMessage kind="error" code={sp.error} messages={ERROR_MESSAGES} />
        )}

        <form
          action={createUser}
          className="space-y-8 border-t border-stone-200 dark:border-stone-800 pt-8"
        >
          <input type="hidden" name="redirect_base" value="/users/new" />

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
              Mínimo 6 caracteres. Compártesela a la persona de forma segura.
            </p>
          </div>

          <div>
            <span className={labelCls}>Rol</span>
            <RolePicker defaultValue="cajero" />
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-stone-200 dark:border-stone-800">
            <Link
              href="/dashboard"
              className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Cancelar
            </Link>
            <SubmitButton label="Crear usuario" pendingLabel="Creando…" />
          </div>
        </form>
      </main>
    </div>
  )
}
