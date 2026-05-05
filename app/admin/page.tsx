import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_lib/require-admin'

type RoleCount = { rol: string | null }

export default async function AdminHome() {
  const { profile } = await requireAdmin()
  const admin = createAdminClient()

  const [{ data: users }, { count: tareasActivas }, { count: tareasInactivas }] =
    await Promise.all([
      admin
        .from('profiles')
        .select('rol')
        .overrideTypes<RoleCount[], { merge: false }>(),
      admin
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('activa', true),
      admin
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('activa', false),
    ])

  const total = users?.length ?? 0
  const admins = users?.filter((u) => u.rol === 'admin').length ?? 0
  const lideres = users?.filter((u) => u.rol === 'lider').length ?? 0
  const cajeros = users?.filter((u) => u.rol === 'cajero').length ?? 0

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-slate-500 mb-1">Bienvenido de vuelta,</p>
        <h2 className="text-3xl font-bold text-slate-900">
          {profile?.nombre ?? 'Admin'} 👋
        </h2>
        <p className="text-slate-600 mt-1">
          Resumen del equipo y accesos rápidos.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuarios totales" value={total} accent="rose" />
        <StatCard label="Admins" value={admins} accent="rose" muted />
        <StatCard label="Líderes" value={lideres} accent="purple" muted />
        <StatCard label="Cajeros" value={cajeros} accent="blue" muted />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Tareas activas"
          value={tareasActivas ?? 0}
          accent="emerald"
        />
        <StatCard
          label="Tareas archivadas"
          value={tareasInactivas ?? 0}
          accent="slate"
          muted
        />
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Accesos rápidos
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <ActionCard
            href="/admin/users/new"
            title="Nuevo usuario"
            description="Crear cuenta con rol asignado"
            icon="+"
            primary
          />
          <ActionCard
            href="/admin/users"
            title="Ver usuarios"
            description="Lista, edición y permisos"
            icon="👥"
          />
          <ActionCard
            href="/tasks"
            title="Tareas del equipo"
            description="Ver y administrar tareas"
            icon="📋"
          />
        </div>
      </section>
    </div>
  )
}

const ACCENT_BG: Record<string, string> = {
  rose: 'bg-rose-600',
  purple: 'bg-purple-600',
  blue: 'bg-blue-600',
  emerald: 'bg-emerald-600',
  slate: 'bg-slate-500',
}

function StatCard({
  label,
  value,
  accent,
  muted = false,
}: {
  label: string
  value: number
  accent: keyof typeof ACCENT_BG
  muted?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`w-2 h-2 rounded-full ${
            muted ? 'bg-slate-300' : ACCENT_BG[accent]
          }`}
        />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function ActionCard({
  href,
  title,
  description,
  icon,
  primary = false,
}: {
  href: string
  title: string
  description: string
  icon: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-5 transition-all hover:shadow-md ${
        primary
          ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
          : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${
          primary
            ? 'bg-white/20 text-white'
            : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
        }`}
      >
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      <p
        className={`text-sm mt-0.5 ${primary ? 'text-rose-100' : 'text-slate-500'}`}
      >
        {description}
      </p>
    </Link>
  )
}
