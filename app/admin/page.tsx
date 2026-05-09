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
    <div className="space-y-14">
      <section>
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
          Bienvenido
        </p>
        <h1 className="font-serif text-5xl text-stone-900 leading-tight">
          {profile?.nombre ?? 'Admin'}
        </h1>
        <p className="text-sm text-stone-600 mt-3">
          Resumen del equipo y accesos rápidos.
        </p>
      </section>

      <section>
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-5">
          Equipo
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-200">
          <Stat label="Total" value={total} />
          <Stat label="Admins" value={admins} />
          <Stat label="Líderes" value={lideres} />
          <Stat label="Cajeros" value={cajeros} />
        </div>
      </section>

      <section>
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-5">
          Tareas
        </p>
        <div className="grid grid-cols-2 gap-px bg-stone-200">
          <Stat label="Activas" value={tareasActivas ?? 0} />
          <Stat label="Archivadas" value={tareasInactivas ?? 0} muted />
        </div>
      </section>

      <section className="border-t border-stone-200 pt-12">
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-5">
          Accesos rápidos
        </p>
        <div className="grid gap-px bg-stone-200 sm:grid-cols-3">
          <ActionCard
            href="/admin/users/new"
            title="Nuevo usuario"
            description="Crear cuenta con rol asignado"
            primary
          />
          <ActionCard
            href="/admin/users"
            title="Ver usuarios"
            description="Lista, edición y permisos"
          />
          <ActionCard
            href="/tasks"
            title="Tareas del equipo"
            description="Ver y administrar tareas"
          />
        </div>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  muted = false,
}: {
  label: string
  value: number
  muted?: boolean
}) {
  return (
    <div className="bg-white p-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500 mb-3">
        {label}
      </p>
      <p
        className={`font-serif text-4xl ${
          muted ? 'text-stone-400' : 'text-stone-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function ActionCard({
  href,
  title,
  description,
  primary = false,
}: {
  href: string
  title: string
  description: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`block p-7 group transition-colors ${
        primary
          ? 'bg-stone-900 text-white hover:bg-stone-700'
          : 'bg-white text-stone-900 hover:bg-stone-50'
      }`}
    >
      <p
        className={`text-[11px] uppercase tracking-[0.2em] mb-3 ${
          primary ? 'text-stone-300' : 'text-stone-500'
        }`}
      >
        {primary ? '＋ Crear' : 'Acceso'}
      </p>
      <p className="font-serif text-xl mb-2">{title}</p>
      <p
        className={`text-xs ${
          primary ? 'text-stone-300' : 'text-stone-500'
        }`}
      >
        {description}
      </p>
    </Link>
  )
}
