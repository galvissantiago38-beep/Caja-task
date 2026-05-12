import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-4">
          Error
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 mb-3">
          Algo salió mal
        </h1>
        <p className="text-sm text-stone-600 mb-10 leading-relaxed">
          Hubo un problema al procesar tu solicitud. Verifica tus datos e
          intenta de nuevo.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full bg-stone-900 text-white py-3.5 text-xs uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
          >
            Volver a iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="w-full border border-stone-300 text-stone-900 py-3.5 text-xs uppercase tracking-[0.25em] font-medium hover:bg-stone-50 transition-colors"
          >
            Crear cuenta nueva
          </Link>
        </div>
      </div>
    </div>
  )
}
