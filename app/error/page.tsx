import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Algo salió mal
        </h1>
        <p className="text-slate-600 mb-6">
          Hubo un problema al procesar tu solicitud. Verifica tus datos e intenta de nuevo.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Volver a iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            Crear cuenta nueva
          </Link>
        </div>
      </div>
    </div>
  )
}
