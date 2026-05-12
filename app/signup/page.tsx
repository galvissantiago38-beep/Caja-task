import Link from 'next/link'
import { signup } from '../auth/actions'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-14">
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 tracking-wide mb-3">
            TASKS
          </h1>
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400">
            Crear cuenta
          </p>
        </div>

        <form className="space-y-7">
          <div>
            <label
              htmlFor="full_name"
              className="block text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 mb-2"
            >
              Nombre completo
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="Juan Pérez"
              className="w-full px-0 py-2 border-0 border-b border-stone-300 dark:border-stone-700 bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:text-stone-500 focus:outline-none focus:border-stone-900 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 mb-2"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ejemplo@correo.com"
              className="w-full px-0 py-2 border-0 border-b border-stone-300 dark:border-stone-700 bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:text-stone-500 focus:outline-none focus:border-stone-900 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-0 py-2 border-0 border-b border-stone-300 dark:border-stone-700 bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:text-stone-500 focus:outline-none focus:border-stone-900 transition-colors"
            />
          </div>

          <button
            formAction={signup}
            className="w-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 py-3.5 text-xs uppercase tracking-[0.25em] font-medium hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors mt-4"
          >
            Registrarme
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-stone-500 dark:text-stone-400">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="text-stone-900 dark:text-stone-100 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
