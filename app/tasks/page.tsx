import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addDays, bucketize, ymdInBogota, type Bucket } from '@/lib/dates'
import { completarInstancia, deleteTask } from './actions'
import DeleteTaskButton from './_components/DeleteTaskButton'
import PlazoChip from './_components/PlazoChip'
import CompletarBoton from './_components/CompletarBoton'

const PRIORIDAD_STYLES: Record<string, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja: 'bg-green-100 text-green-700',
}

const BUCKET_META: Record<Bucket, { label: string; color: string; icon: string }> = {
  vencida: {
    label: 'Vencidas',
    color: 'border-red-300 bg-red-50',
    icon: '🔴',
  },
  hoy: {
    label: 'Hoy',
    color: 'border-amber-300 bg-amber-50',
    icon: '⚡',
  },
  mañana: {
    label: 'Mañana',
    color: 'border-blue-300 bg-blue-50',
    icon: '📅',
  },
  pronto: {
    label: 'Esta semana',
    color: 'border-slate-300 bg-slate-50',
    icon: '🗓️',
  },
  despues: {
    label: 'Más adelante',
    color: 'border-slate-200 bg-white',
    icon: '⏳',
  },
}

type GestorTask = {
  id: string
  titulo: string
  frecuencia: string
  prioridad: string
  hora_limite: string | null
  fecha_limite: string | null
  apertura: string | null
  asignado_a: string | null
  asignado: { id: string; nombre: string | null; email: string } | null
}

type CajeroInstance = {
  id: string
  fecha_limite: string
  completada_en: string | null
  task: {
    id: string
    titulo: string
    descripcion: string | null
    frecuencia: string
    prioridad: string
    hora_limite: string | null
    apertura: string | null
  } | null
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>
}) {
  const supabase = await createClient()
  const sp = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, nombre')
    .eq('id', user.id)
    .single()

  const esGestor = profile?.rol === 'lider' || profile?.rol === 'admin'

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {esGestor ? 'Tareas' : 'Mis tareas pendientes'}
              </h1>
              <p className="text-slate-600 mt-1">
                {esGestor
                  ? 'Gestiona las tareas del equipo: créalas, edítalas o desactívalas.'
                  : 'Marca como hechas las tareas que vayas completando.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Dashboard
              </Link>
              {esGestor && (
                <Link
                  href="/tasks/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  + Nueva tarea
                </Link>
              )}
            </div>
          </div>
        </header>

        {sp.error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-4 py-3 text-sm">
            ⚠️{' '}
            {sp.error === 'no-autorizado'
              ? 'No tienes permiso para esta acción.'
              : sp.error === 'no-completada'
              ? 'No se pudo marcar la tarea como hecha.'
              : 'Algo salió mal.'}
          </div>
        )}

        {esGestor ? (
          <GestorView />
        ) : (
          <CajeroView userId={user.id} />
        )}
      </div>
    </div>
  )
}

async function GestorView() {
  const supabase = await createClient()

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(
      'id, titulo, frecuencia, prioridad, hora_limite, fecha_limite, apertura, asignado_a, asignado:profiles!asignado_a(id, nombre, email)'
    )
    .eq('activa', true)
    .order('created_at', { ascending: false })
    .returns<GestorTask[]>()

  if (error) {
    console.error('Error cargando tareas:', error)
    redirect('/error')
  }

  const lista = tasks ?? []

  if (lista.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Aún no hay tareas creadas
        </h2>
        <p className="text-slate-500 mb-5">
          Crea la primera tarea para tu equipo.
        </p>
        <Link
          href="/tasks/new"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Crear la primera tarea
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-3 px-5 font-semibold">Tarea</th>
              <th className="py-3 px-5 font-semibold">Plazo</th>
              <th className="py-3 px-5 font-semibold">Prioridad</th>
              <th className="py-3 px-5 font-semibold">Asignado a</th>
              <th className="py-3 px-5 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((t) => {
              const nombreCajero =
                t.asignado?.nombre || t.asignado?.email || '—'
              return (
                <tr
                  key={t.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="py-4 px-5 font-medium text-slate-900">
                    {t.titulo}
                  </td>
                  <td className="py-4 px-5">
                    <PlazoChip
                      frecuencia={t.frecuencia}
                      hora_limite={t.hora_limite}
                      fecha_limite={t.fecha_limite}
                      apertura={t.apertura}
                    />
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        PRIORIDAD_STYLES[t.prioridad] ??
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.prioridad}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-700">{nombreCajero}</td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/tasks/${t.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Editar
                      </Link>
                      <DeleteTaskButton
                        action={deleteTask.bind(null, t.id)}
                        titulo={t.titulo}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

async function CajeroView({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: misTareas } = await supabase
    .from('tasks')
    .select('id')
    .eq('asignado_a', userId)
    .eq('activa', true)

  const taskIds = (misTareas ?? []).map((t: { id: string }) => t.id)

  if (taskIds.length === 0) {
    return <EmptyCajero label="Aún no tienes tareas asignadas." />
  }

  const { data: instancesRaw, error } = await supabase
    .from('task_instances')
    .select(
      'id, fecha_limite, completada_en, task:tasks!task_id(id, titulo, descripcion, frecuencia, prioridad, hora_limite, apertura)'
    )
    .in('task_id', taskIds)
    .is('completada_en', null)
    .order('fecha_limite', { ascending: true })
    .returns<CajeroInstance[]>()

  if (error) {
    console.error('Error cargando instancias:', error)
    redirect('/error')
  }

  const instances = (instancesRaw ?? []).filter((i) => i.task)

  if (instances.length === 0) {
    return (
      <EmptyCajero label="🎉 ¡No tienes tareas pendientes! Bien hecho." />
    )
  }

  const today = ymdInBogota(new Date())
  const tomorrow = addDays(today, 1)
  const weekEnd = addDays(today, 7)

  const grupos = instances.reduce<Record<Bucket, CajeroInstance[]>>(
    (acc, inst) => {
      const b = bucketize(inst.fecha_limite, today, tomorrow, weekEnd)
      acc[b] = acc[b] ?? []
      acc[b].push(inst)
      return acc
    },
    {} as Record<Bucket, CajeroInstance[]>
  )

  const bucketsOrden: Bucket[] = ['vencida', 'hoy', 'mañana', 'pronto', 'despues']

  return (
    <div className="space-y-6">
      {bucketsOrden.map((b) => {
        const items = grupos[b]
        if (!items || items.length === 0) return null
        const meta = BUCKET_META[b]
        return (
          <section key={b}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{meta.icon}</span>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                {meta.label}
              </h2>
              <span className="text-xs text-slate-500">
                ({items.length})
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((inst) => (
                <article
                  key={inst.id}
                  className={`rounded-xl border-2 p-5 ${meta.color}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">
                      {inst.task!.titulo}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                        PRIORIDAD_STYLES[inst.task!.prioridad] ??
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {inst.task!.prioridad}
                    </span>
                  </div>
                  {inst.task!.descripcion && (
                    <p className="text-sm text-slate-600 mb-3">
                      {inst.task!.descripcion}
                    </p>
                  )}
                  <div className="mb-3">
                    <PlazoChip
                      frecuencia={inst.task!.frecuencia}
                      hora_limite={inst.task!.hora_limite}
                      fecha_limite={inst.fecha_limite}
                      apertura={inst.task!.apertura}
                    />
                  </div>
                  <CompletarBoton
                    action={completarInstancia.bind(null, inst.id)}
                  />
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function EmptyCajero({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
      <p className="text-slate-600 text-lg">{label}</p>
    </div>
  )
}
