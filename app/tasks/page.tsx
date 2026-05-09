import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addDays, bucketize, ymdInBogota, type Bucket } from '@/lib/dates'
import { completarInstancia, deleteTask } from './actions'
import DeleteTaskButton from './_components/DeleteTaskButton'
import PlazoChip from './_components/PlazoChip'
import CompletarBoton from './_components/CompletarBoton'
import TaskFilterBar from './_components/TaskFilterBar'

const PRIORIDAD_CLASSES: Record<string, string> = {
  alta: 'text-stone-900 font-medium',
  media: 'text-stone-600',
  baja: 'text-stone-400',
}

const BUCKET_META: Record<Bucket, { label: string }> = {
  vencida: { label: 'Vencidas' },
  hoy: { label: 'Hoy' },
  mañana: { label: 'Mañana' },
  pronto: { label: 'Esta semana' },
  despues: { label: 'Más adelante' },
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
  searchParams: Promise<{
    error?: string
    ok?: string
    q?: string
    prioridad?: string
    asignado?: string
  }>
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
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            CAJA TASKS
          </Link>
          <Link
            href="/dashboard"
            className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-14">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
              Tareas
            </p>
            <h1 className="font-serif text-4xl text-stone-900 mb-2">
              {esGestor ? 'Gestión' : 'Mis pendientes'}
            </h1>
            <p className="text-sm text-stone-600 max-w-md">
              {esGestor
                ? 'Crea, edita y desactiva las tareas del equipo.'
                : 'Marca como hechas las tareas que vayas completando.'}
            </p>
          </div>
          {esGestor && (
            <Link
              href="/tasks/new"
              className="bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
            >
              Nueva tarea
            </Link>
          )}
        </div>

        {sp.error && (
          <div className="mb-8 border border-stone-300 bg-stone-50 px-5 py-4 text-sm text-stone-800">
            {sp.error === 'no-autorizado'
              ? 'No tienes permiso para esta acción.'
              : sp.error === 'no-completada'
              ? 'No se pudo marcar la tarea como hecha.'
              : 'Algo salió mal.'}
          </div>
        )}

        {esGestor ? (
          <GestorView
            q={sp.q}
            prioridad={sp.prioridad}
            asignado={sp.asignado}
          />
        ) : (
          <CajeroView userId={user.id} />
        )}
      </main>
    </div>
  )
}

async function GestorView({
  q,
  prioridad,
  asignado,
}: {
  q?: string
  prioridad?: string
  asignado?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select(
      'id, titulo, frecuencia, prioridad, hora_limite, fecha_limite, apertura, asignado_a, asignado:profiles!asignado_a(id, nombre, email)'
    )
    .eq('activa', true)
    .order('created_at', { ascending: false })

  if (q && q.trim()) {
    query = query.ilike('titulo', `%${q.trim()}%`)
  }
  if (prioridad && ['alta', 'media', 'baja'].includes(prioridad)) {
    query = query.eq('prioridad', prioridad)
  }
  if (asignado && asignado !== 'all') {
    query = query.eq('asignado_a', asignado)
  }

  const [{ data: tasks, error }, { data: cajeros }] = await Promise.all([
    query.overrideTypes<GestorTask[], { merge: false }>(),
    supabase
      .from('profiles')
      .select('id, nombre, email, rol')
      .in('rol', ['cajero', 'visual', 'almacenista'])
      .order('rol', { ascending: true })
      .order('nombre', { ascending: true })
      .overrideTypes<
        { id: string; nombre: string | null; email: string; rol: string | null }[],
        { merge: false }
      >(),
  ])

  if (error) {
    console.error('Error cargando tareas:', error)
    redirect('/error')
  }

  const lista = tasks ?? []
  const cajerosLista = cajeros ?? []
  const tieneFiltros = !!(q || prioridad || asignado)

  if (lista.length === 0 && !tieneFiltros) {
    return (
      <div className="border-t border-stone-200 pt-20 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
          Vacío
        </p>
        <h2 className="font-serif text-2xl text-stone-900 mb-3">
          Aún no hay tareas creadas
        </h2>
        <p className="text-sm text-stone-600 mb-8">
          Crea la primera tarea para tu equipo.
        </p>
        <Link
          href="/tasks/new"
          className="inline-block bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
        >
          Crear tarea
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TaskFilterBar cajeros={cajerosLista} />

      {lista.length === 0 ? (
        <div className="border-t border-stone-200 pt-20 text-center">
          <h3 className="font-serif text-2xl text-stone-900 mb-2">
            Sin resultados
          </h3>
          <p className="text-sm text-stone-600">
            Prueba con otra búsqueda o quita los filtros.
          </p>
        </div>
      ) : (
        <div className="border-t border-stone-200">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200 text-[10px] uppercase tracking-[0.18em] text-stone-500">
                <th className="py-4 pr-4 font-medium">Tarea</th>
                <th className="py-4 pr-4 font-medium">Plazo</th>
                <th className="py-4 pr-4 font-medium">Prioridad</th>
                <th className="py-4 pr-4 font-medium">Asignado</th>
                <th className="py-4 pr-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((t) => {
                const nombreCajero =
                  t.asignado?.nombre || t.asignado?.email || '—'
                return (
                  <tr
                    key={t.id}
                    className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="py-5 pr-4 text-stone-900">{t.titulo}</td>
                    <td className="py-5 pr-4">
                      <PlazoChip
                        frecuencia={t.frecuencia}
                        hora_limite={t.hora_limite}
                        fecha_limite={t.fecha_limite}
                        apertura={t.apertura}
                      />
                    </td>
                    <td className="py-5 pr-4">
                      <span
                        className={`text-[11px] uppercase tracking-widest ${
                          PRIORIDAD_CLASSES[t.prioridad] ?? 'text-stone-500'
                        }`}
                      >
                        {t.prioridad}
                      </span>
                    </td>
                    <td className="py-5 pr-4 text-sm text-stone-700">
                      {nombreCajero}
                    </td>
                    <td className="py-5 pr-4">
                      <div className="flex items-center justify-end gap-6">
                        <Link
                          href={`/tasks/${t.id}/edit`}
                          className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
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
      )}
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
    .overrideTypes<CajeroInstance[], { merge: false }>()

  if (error) {
    console.error('Error cargando instancias:', error)
    redirect('/error')
  }

  const instances = (instancesRaw ?? []).filter((i) => i.task)

  if (instances.length === 0) {
    return <EmptyCajero label="No tienes tareas pendientes. Buen trabajo." />
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
    <div className="space-y-14">
      {bucketsOrden.map((b) => {
        const items = grupos[b]
        if (!items || items.length === 0) return null
        const meta = BUCKET_META[b]
        return (
          <section key={b}>
            <div className="flex items-end justify-between mb-6 border-b border-stone-200 pb-3">
              <h2 className="font-serif text-2xl text-stone-900">
                {meta.label}
              </h2>
              <span className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                {items.length}
              </span>
            </div>
            <div className="grid gap-px bg-stone-200 sm:grid-cols-2">
              {items.map((inst) => (
                <article key={inst.id} className="bg-white p-7">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-serif text-xl text-stone-900 leading-tight">
                      {inst.task!.titulo}
                    </h3>
                    <span
                      className={`shrink-0 text-[10px] uppercase tracking-widest ${
                        PRIORIDAD_CLASSES[inst.task!.prioridad] ??
                        'text-stone-500'
                      }`}
                    >
                      {inst.task!.prioridad}
                    </span>
                  </div>
                  {inst.task!.descripcion && (
                    <p className="text-sm text-stone-600 mb-4 leading-relaxed">
                      {inst.task!.descripcion}
                    </p>
                  )}
                  <div className="mb-5">
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
    <div className="border-t border-stone-200 pt-20 text-center">
      <p className="text-base text-stone-700">{label}</p>
    </div>
  )
}
