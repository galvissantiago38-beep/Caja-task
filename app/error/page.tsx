import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-4">
          Error
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 mb-3">
          Algo salió mal
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 dark:text-stone-500 mb-10 leading-relaxed">
          Hubo un problema al procesar tu solicitud. Verifica tus datos e
          intenta de nuevo.
        </p>

        <Link
          href="/login"
          className="inline-block bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 px-8 py-3.5 text-xs uppercase tracking-[0.25em] font-medium hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  )
}
