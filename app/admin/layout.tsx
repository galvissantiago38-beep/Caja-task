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
    <div className="min-h-screen bg-white">
      <header className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="font-serif text-xl tracking-wide"
            >
              CAJA TASKS
            </Link>
            <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500 border border-stone-300 px-2 py-0.5">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 transition-colors"
            >
              ← Sitio
            </Link>
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
              {profile?.nombre ?? 'Admin'}
            </span>
            <form>
              <button
                formAction={logout}
                className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-900 transition-colors"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <AdminNav />

      <main className="max-w-6xl mx-auto px-8 py-14">{children}</main>
    </div>
  )
}
