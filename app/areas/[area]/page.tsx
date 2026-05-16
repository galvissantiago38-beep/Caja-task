import Link from 'next/link'
import ThemeToggle from '@/app/_components/ThemeToggle'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addDays, bucketize, ymdInBogota, type Bucket } from '@/lib/dates'
import { completarInstancia } from '../../tasks/actions'
import PlazoChip from '../../tasks/_components/PlazoChip'
import CompletarBoton from '../../tasks/_components/CompletarBoton'
import NewNoteForm from './_components/NewNoteForm'
import NoteItem from './_components/NoteItem'

type AreaNote = {
  id: string
  contenido: string
  firma: string | null
  created_at: string
  updated_at: string
}

const AREA_MAP: Record<string, { rol: string; label: string }> = {
  caja: { rol: 'cajero', label: 'Caja' },
  visual: { rol: 'visual', label: 'Visual' },
  almacen: { rol: 'almacenista', label: 'Almacén' },
}

const PRIORIDAD_CLASSES: Record<string, string> = {
  alta: 'text-stone-900 dark:text-stone-100 font-medium',
  media: 'text-stone-600 dark:text-stone-400 dark:text-stone-500',
  baja: 'text-stone-400 dark:text-stone-500',
}

const BUCKET_META: Record<Bucket, { label: string }> = {
  vencida: { label: 'Vencidas' },
  hoy: { label: 'Hoy' },
  mañana: { label: 'Mañana' },
  pronto: { label: 'Esta semana' },
  despues: { label: 'Más adelante' },
  sin_fecha: { label: 'Sin fecha' },
}

type AreaInstance = {
  id: string
  fecha_limite: string | null
  completada_en: string | null
  notas: string | null
  task: {
    id: string
    titulo: string
    descripcion: string | null
    frecuencia: string
    prioridad: string
    hora_limite: string | null
    apertura: string | null
    area: string | null
    dia_semana: number | null
  } | null
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ area: string }>
}) {
  const { area } = await params
  const meta = AREA_MAP[area]
  if (!meta) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar tareas activas de este área
  const { data: tasksOfArea } = await supabase
    .from('tasks')
    .select('id')
    .eq('activa', true)
    .eq('area', meta.rol)
    .overrideTypes<{ id: string }[], { merge: false }>()

  const taskIds = (tasksOfArea ?? []).map((t) => t.id)

  // Notas del área (independientes de las tareas)
  const { data: notesData } = await supabase
    .from('notes')
    .select('id, contenido, firma, created_at, updated_at')
    .eq('area', meta.rol)
    .order('created_at', { ascending: false })
    .overrideTypes<AreaNote[], { merge: false }>()
  const notas = notesData ?? []

  let instances: AreaInstance[] = []
  let completadas: AreaInstance[] = []
  if (taskIds.length > 0) {
    const [pending, done] = await Promise.all([
      supabase
        .from('task_instances')
        .select(
          'id, fecha_limite, completada_en, notas, task:tasks!task_id(id, titulo, descripcion, frecuencia, prioridad, hora_limite, apertura, area, dia_semana)'
        )
        .in('task_id', taskIds)
        .is('completada_en', null)
        .order('fecha_limite', { ascending: true })
        .overrideTypes<AreaInstance[], { merge: false }>(),
      supabase
        .from('task_instances')
        .select(
          'id, fecha_limite, completada_en, notas, task:tasks!task_id(id, titulo, descripcion, frecuencia, prioridad, hora_limite, apertura, area, dia_semana)'
        )
        .in('task_id', taskIds)
        .not('completada_en', 'is', null)
        .order('completada_en', { ascending: false })
        .limit(20)
        .overrideTypes<AreaInstance[], { merge: false }>(),
    ])
    if (pending.error) {
      console.error('Error cargando pendientes:', pending.error)
      redirect('/error')
    }
    if (done.error) {
      console.error('Error cargando completadas:', done.error)
    }
    instances = (pending.data ?? []).filter((i) => i.task)
    completadas = (done.data ?? []).filter((i) => i.task)
  }

  const today = ymdInBogota(new Date())
  const tomorrow = addDays(today, 1)
  const weekEnd = addDays(today, 7)

  const grupos = instances.reduce<Record<Bucket, AreaInstance[]>>(
    (acc, inst) => {
      const b = bucketize(inst.fecha_limite, today, tomorrow, weekEnd)
      acc[b] = acc[b] ?? []
      acc[b].push(inst)
      return acc
    },
    {} as Record<Bucket, AreaInstance[]>
  )

  const bucketsOrden: Bucket[] = [
    'vencida',
    'hoy',
    'mañana',
    'pronto',
    'despues',
    'sin_fecha',
  ]

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            TASKS
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              ← Áreas
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-3">
              Área
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 dark:text-stone-100 leading-tight">
              {meta.label}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 dark:text-stone-500 mt-3">
              {instances.length === 0
                ? 'Sin tareas pendientes en esta área.'
                : `${instances.length} ${
                    instances.length === 1 ? 'tarea pendiente' : 'tareas pendientes'
                  }`}
            </p>
          </div>
          <Link
            href={`/tasks/new?area=${meta.rol}`}
            className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
          >
            + Nueva tarea
          </Link>
        </div>

        {instances.length === 0 ? (
          <div className="border-t border-stone-200 dark:border-stone-800 pt-20 text-center">
            <p className="text-base text-stone-700 dark:text-stone-300 mb-2">
              Todo al día en {meta.label}.
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Crea una tarea para empezar.
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {bucketsOrden.map((b) => {
              const items = grupos[b]
              if (!items || items.length === 0) return null
              const bm = BUCKET_META[b]
              return (
                <section key={b}>
                  <div className="flex items-end justify-between mb-6 border-b border-stone-200 dark:border-stone-800 pb-3">
                    <h2 className="font-serif text-xl sm:text-2xl text-stone-900 dark:text-stone-100">
                      {bm.label}
                    </h2>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                      {items.length}
                    </span>
                  </div>
                  <div className="grid gap-px bg-stone-200 dark:bg-stone-800 sm:grid-cols-2">
                    {items.map((inst) => (
                      <article key={inst.id} className="bg-white dark:bg-stone-900 p-7">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="font-serif text-xl text-stone-900 dark:text-stone-100 leading-tight">
                            {inst.task!.titulo}
                          </h3>
                          <span
                            className={`shrink-0 text-[10px] uppercase tracking-widest ${
                              PRIORIDAD_CLASSES[inst.task!.prioridad] ??
                              'text-stone-500 dark:text-stone-400'
                            }`}
                          >
                            {inst.task!.prioridad}
                          </span>
                        </div>
                        {inst.task!.descripcion && (
                          <p className="text-sm text-stone-600 dark:text-stone-400 dark:text-stone-500 mb-4 leading-relaxed">
                            {inst.task!.descripcion}
                          </p>
                        )}
                        <div className="mb-5">
                          <PlazoChip
                            frecuencia={inst.task!.frecuencia}
                            hora_limite={inst.task!.hora_limite}
                            fecha_limite={inst.fecha_limite}
                            apertura={inst.task!.apertura}
                            dia_semana={inst.task!.dia_semana}
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
        )}

        <section className="border-t border-stone-200 dark:border-stone-800 pt-14 mt-16">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-3">
                Comunicación del área
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                Notas
              </h2>
            </div>
            <NewNoteForm area={meta.rol} />
          </div>
          {notas.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 border-t border-stone-200 dark:border-stone-800 pt-6">
              Aún no hay notas en esta área. Deja la primera con el botón
              &quot;Nueva nota&quot;.
            </p>
          ) : (
            <ul className="grid gap-px bg-stone-200 dark:bg-stone-800 border border-stone-200 dark:border-stone-800">
              {notas.map((n) => (
                <NoteItem key={n.id} note={n} area={meta.rol} />
              ))}
            </ul>
          )}
        </section>

        {completadas.length > 0 && (
          <section className="border-t border-stone-200 dark:border-stone-800 pt-14 mt-16">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400 mb-3">
                  Histórico reciente
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                  Completadas
                </h2>
              </div>
              <Link
                href={`/tasks/historico?area=${meta.rol}`}
                className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
              >
                Ver todo →
              </Link>
            </div>
            <CompletadasList items={completadas} todayBogota={today} />
          </section>
        )}

        <div className="border-t border-stone-200 dark:border-stone-800 pt-10 mt-16 flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.18em]">
          <Link
            href={`/tasks?area=${meta.rol}`}
            className="text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
          >
            Ver tareas activas →
          </Link>
          <Link
            href={`/tasks/historico?area=${meta.rol}`}
            className="text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
          >
            Histórico completo →
          </Link>
        </div>
      </main>
    </div>
  )
}

function CompletadasList({
  items,
  todayBogota,
}: {
  items: AreaInstance[]
  todayBogota: string
}) {
  const yesterdayBogota = addDays(todayBogota, -1)

  const grouped = items.reduce<Record<string, AreaInstance[]>>((acc, inst) => {
    const completedDate = inst.completada_en
      ? ymdInBogota(new Date(inst.completada_en))
      : 'sin-fecha'
    acc[completedDate] = acc[completedDate] ?? []
    acc[completedDate].push(inst)
    return acc
  }, {})

  const fechas = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  function labelForDate(d: string): string {
    if (d === todayBogota) return 'Hoy'
    if (d === yesterdayBogota) return 'Ayer'
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  function formatTime(iso: string | null): string {
    if (!iso) return ''
    const date = new Date(iso)
    return date.toLocaleTimeString('es-CO', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-8">
      {fechas.map((fecha) => {
        const day = grouped[fecha]
        return (
          <div key={fecha}>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-700 dark:text-stone-300 font-medium">
                {labelForDate(fecha)}
              </span>
              <span className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                {day.length}
              </span>
            </div>
            <ul className="divide-y divide-stone-200">
              {day.map((inst) => (
                <li key={inst.id} className="py-4 flex items-start gap-4">
                  <span className="text-stone-400 dark:text-stone-500 text-sm mt-0.5">✓</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-900 dark:text-stone-100 line-through decoration-stone-300">
                      {inst.task!.titulo}
                    </p>
                    {inst.notas && (
                      <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                        {inst.notas}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 shrink-0">
                    {formatTime(inst.completada_en)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
