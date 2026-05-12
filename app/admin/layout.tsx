import Link from 'next/link'
import ThemeToggle from '@/app/_components/ThemeToggle'
import { logout } from '../auth/actions'
import { requireAdmin } from './_lib/require-admin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireAdmin()

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="font-serif text-xl tracking-wide"
            >
              TASKS
            </Link>
            <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-700 px-2 py-0.5">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              ← Sitio
            </Link>
            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              {profile?.nombre ?? 'Admin'}
            </span>
            <form>
              <button
                formAction={logout}
                className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14">{children}</main>
    </div>
  )
}
