import Link from 'next/link'
import { logout } from '../auth/actions'
import { requireAdmin } from './_lib/require-admin'
import AdminNav from './_components/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireAdmin()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-600 text-white rounded-lg flex items-center justify-center font-bold">
              🛡️
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Caja Tasks
              </p>
              <h1 className="text-lg font-bold text-slate-900 leading-none">
                Panel de admin
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Volver al sitio
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <span className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-medium text-slate-700">
                {(profile?.nombre ?? '?').charAt(0).toUpperCase()}
              </span>
              <span className="font-medium text-slate-900">
                {profile?.nombre ?? 'Admin'}
              </span>
            </div>
            <form>
              <button
                formAction={logout}
                className="text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <AdminNav />

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
