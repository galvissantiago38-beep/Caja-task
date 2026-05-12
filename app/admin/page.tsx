import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_lib/require-admin'
import { ymdInBogota } from '@/lib/dates'

export default async function AdminHome() {
  await requireAdmin()
  const admin = createAdminClient()

  const todayBogota = ymdInBogota(new Date())
  const monthStart = todayBogota.slice(0, 7) + '-01'

  const [
    { count: tareasActivas },
    { count: tareasArchivadas },
    { count: pendientes },
    { count: completadasMes },
    { count: notasTotales },
  ] = await Promise.all([
    admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('activa', true),
    admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('activa', false),
    admin
      .from('task_instances')
      .select('id', { count: 'exact', head: true })
      .is('completada_en', null),
    admin
      .from('task_instances')
      .select('id', { count: 'exact', head: true })
      .gte('completada_en', `${monthStart}T00:00:00`),
    admin.from('notes').select('id', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-14">
      <section>
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-3">
          Massimo Dutti · Calle 82
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 dark:text-stone-100 leading-tight">
          Vista general
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-3 max-w-md">
          Resumen del estado de la tienda.
        </p>
      </section>

      <section>
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-5">
          Tareas
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-200 dark:bg-stone-800">
          <Stat label="Activas" value={tareasActivas ?? 0} highlight />
          <Stat label="Pendientes" value={pendientes ?? 0} highlight />
          <Stat label="Completadas mes" value={completadasMes ?? 0} />
          <Stat label="Archivadas" value={tareasArchivadas ?? 0} muted />
        </div>
      </section>

      <section>
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-5">
          Comunicación
        </p>
        <div className="grid grid-cols-1 gap-px bg-stone-200 dark:bg-stone-800">
          <Stat label="Notas en circulación" value={notasTotales ?? 0} />
        </div>
      </section>

      <section className="border-t border-stone-200 dark:border-stone-800 pt-12">
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-5">
          Accesos rápidos
        </p>
        <div className="grid gap-px bg-stone-200 dark:bg-stone-800 sm:grid-cols-3">
          <ActionCard
            href="/dashboard"
            title="Áreas"
            description="Volver al dashboard de áreas"
            primary
          />
          <ActionCard
            href="/tasks"
            title="Tareas activas"
            description="Ver, crear, editar y archivar"
          />
          <ActionCard
            href="/tasks/historico"
            title="Histórico"
            description="Últimas 50 tareas completadas"
          />
        </div>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  highlight = false,
  muted = false,
}: {
  label: string
  value: number
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className="bg-white dark:bg-stone-900 p-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 mb-3">
        {label}
      </p>
      <p
        className={`font-serif text-3xl sm:text-4xl ${
          muted
            ? 'text-stone-400 dark:text-stone-500'
            : highlight
            ? 'text-stone-900 dark:text-stone-100'
            : 'text-stone-700 dark:text-stone-300'
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
          ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300'
          : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800'
      }`}
    >
      <p
        className={`text-[11px] uppercase tracking-[0.2em] mb-3 ${
          primary
            ? 'text-stone-300 dark:text-stone-700'
            : 'text-stone-500 dark:text-stone-400'
        }`}
      >
        Acceso
      </p>
      <p className="font-serif text-xl mb-2">{title}</p>
      <p
        className={`text-xs ${
          primary
            ? 'text-stone-300 dark:text-stone-700'
            : 'text-stone-500 dark:text-stone-400'
        }`}
      >
        {description}
      </p>
    </Link>
  )
}
