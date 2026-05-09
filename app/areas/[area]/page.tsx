import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addDays, bucketize, ymdInBogota, type Bucket } from '@/lib/dates'
import { completarInstancia } from '../../tasks/actions'
import PlazoChip from '../../tasks/_components/PlazoChip'
import CompletarBoton from '../../tasks/_components/CompletarBoton'

const AREA_MAP: Record<string, { rol: string; label: string }> = {
  caja: { rol: 'cajero', label: 'Caja' },
  visual: { rol: 'visual', label: 'Visual' },
  almacen: { rol: 'almacenista', label: 'Almacén' },
}

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

type AreaInstance = {
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
    area: string | null
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

  let instances: AreaInstance[] = []
  if (taskIds.length > 0) {
    const { data, error } = await supabase
      .from('task_instances')
      .select(
        'id, fecha_limite, completada_en, task:tasks!task_id(id, titulo, descripcion, frecuencia, prioridad, hora_limite, apertura, area)'
      )
      .in('task_id', taskIds)
      .is('completada_en', null)
      .order('fecha_limite', { ascending: true })
      .overrideTypes<AreaInstance[], { merge: false }>()
    if (error) {
      console.error('Error cargando instancias del área:', error)
      redirect('/error')
    }
    instances = (data ?? []).filter((i) => i.task)
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

  const bucketsOrden: Bucket[] = ['vencida', 'hoy', 'mañana', 'pronto', 'despues']

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/dashboard" className="font-serif text-xl tracking-wide">
            TASKS
          </Link>
          <Link
            href="/dashboard"
            className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 transition-colors"
          >
            ← Áreas
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-14">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
              Área
            </p>
            <h1 className="font-serif text-5xl text-stone-900 leading-tight">
              {meta.label}
            </h1>
            <p className="text-sm text-stone-600 mt-3">
              {instances.length === 0
                ? 'Sin tareas pendientes en esta área.'
                : `${instances.length} ${
                    instances.length === 1 ? 'tarea pendiente' : 'tareas pendientes'
                  }`}
            </p>
          </div>
          <Link
            href={`/tasks/new?area=${meta.rol}`}
            className="bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
          >
            + Nueva tarea
          </Link>
        </div>

        {instances.length === 0 ? (
          <div className="border-t border-stone-200 pt-20 text-center">
            <p className="text-base text-stone-700 mb-2">
              Todo al día en {meta.label}.
            </p>
            <p className="text-sm text-stone-500">
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
                  <div className="flex items-end justify-between mb-6 border-b border-stone-200 pb-3">
                    <h2 className="font-serif text-2xl text-stone-900">
                      {bm.label}
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
        )}

        <div className="border-t border-stone-200 pt-10 mt-16 flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.18em]">
          <Link
            href={`/tasks?area=${meta.rol}`}
            className="text-stone-700 hover:text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
          >
            Ver tareas activas →
          </Link>
          <Link
            href="/tasks/historico"
            className="text-stone-700 hover:text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
          >
            Histórico →
          </Link>
        </div>
      </main>
    </div>
  )
}
