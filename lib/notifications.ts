import 'server-only'
import { Resend } from 'resend'
import { createAdminClient } from './supabase/admin'
import { addDays, formatDateEs, ymdInBogota } from './dates'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
  'https://caja-task.vercel.app'
const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Caja Tasks <onboarding@resend.dev>'

type NotifKind = 'diaria_2h' | 'definida_24h' | 'lapso_apertura' | 'lapso_cierre'

type AsignadoLite = { email: string | null; nombre: string | null } | null

type TaskLite = {
  id: string
  titulo: string
  descripcion: string | null
  frecuencia: string
  prioridad: string
  hora_limite: string | null
  apertura: string | null
  asignado: AsignadoLite
}

type Instance = {
  id: string
  fecha_limite: string
  notificada_dia: boolean | null
  notificada_apertura: boolean | null
  task: TaskLite | null
}

export type NotificationsRunSummary = {
  instancias_generadas: number
  total_pendientes: number
  enviadas: number
  detalles: { kind: NotifKind; email: string; titulo: string }[]
  errores: { instance_id: string; error: string }[]
}

export async function runNotifications(): Promise<NotificationsRunSummary> {
  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY!)

  const now = new Date()
  const todayBogota = ymdInBogota(now)
  const tomorrowBogota = addDays(todayBogota, 1)

  // 1) Generar instancias de hoy para diarias activas que aún no la tienen.
  //    Sin esto, una tarea diaria solo tiene la instancia inicial y nunca se
  //    "renueva" después de que el cajero la marca hecha.
  const instancias_generadas = await generateMissingDailyInstances(
    admin,
    todayBogota
  )

  // 2) Levantar todas las instancias pendientes (ya con las recién creadas).
  const { data: instances, error } = await admin
    .from('task_instances')
    .select(
      'id, fecha_limite, notificada_dia, notificada_apertura, task:tasks!task_id(id, titulo, descripcion, frecuencia, prioridad, hora_limite, apertura, asignado:profiles!asignado_a(email, nombre))'
    )
    .is('completada_en', null)
    .overrideTypes<Instance[], { merge: false }>()

  if (error) {
    console.error('runNotifications fetch error:', error)
    return {
      instancias_generadas,
      total_pendientes: 0,
      enviadas: 0,
      detalles: [],
      errores: [{ instance_id: '-', error: error.message }],
    }
  }

  const list = instances ?? []

  const detalles: NotificationsRunSummary['detalles'] = []
  const errores: NotificationsRunSummary['errores'] = []

  for (const inst of list) {
    if (!inst.task) continue
    const task = inst.task
    const asignado = task.asignado
    if (!asignado || !asignado.email) continue
    const email: string = asignado.email
    const nombreCajero: string | null = asignado.nombre

    const send = async (kind: NotifKind, plazoText: string, flagColumn: 'notificada_dia' | 'notificada_apertura') => {
      const subject = subjectFor(kind, task.titulo)
      const html = renderEmail({
        kind,
        titulo: task.titulo,
        descripcion: task.descripcion,
        prioridad: task.prioridad,
        plazoText,
        nombreCajero,
      })
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject,
        html,
      })
      if (result.error) {
        throw new Error(result.error.message)
      }
      await admin
        .from('task_instances')
        .update({ [flagColumn]: true })
        .eq('id', inst.id)
      detalles.push({ kind, email, titulo: task.titulo })
    }

    try {
      // Cron diario (Hobby permite max 1 corrida/día). La idea: cada mañana,
      // por cada instancia que aplique, mandamos su recordatorio una vez.
      if (
        task.frecuencia === 'diaria' &&
        !inst.notificada_dia &&
        task.hora_limite &&
        inst.fecha_limite === todayBogota
      ) {
        await send(
          'diaria_2h',
          `Hoy ${formatDateEs(inst.fecha_limite)} a las ${task.hora_limite.slice(0, 5)}`,
          'notificada_dia'
        )
      } else if (
        task.frecuencia === 'unica' &&
        !inst.notificada_dia &&
        inst.fecha_limite === tomorrowBogota
      ) {
        const hora = task.hora_limite ?? '23:59:00'
        await send(
          'definida_24h',
          `Mañana ${formatDateEs(inst.fecha_limite)} a las ${hora.slice(0, 5)}`,
          'notificada_dia'
        )
      } else if (task.frecuencia === 'lapso') {
        if (
          !inst.notificada_apertura &&
          task.apertura &&
          task.apertura === tomorrowBogota
        ) {
          await send(
            'lapso_apertura',
            `Mañana ${formatDateEs(task.apertura)} se habilita la tarea`,
            'notificada_apertura'
          )
        }
        if (!inst.notificada_dia && inst.fecha_limite === tomorrowBogota) {
          await send(
            'lapso_cierre',
            `Cierre: mañana ${formatDateEs(inst.fecha_limite)}`,
            'notificada_dia'
          )
        }
      }
    } catch (err) {
      errores.push({
        instance_id: inst.id,
        error: err instanceof Error ? err.message : String(err),
      })
      console.error('Notification error:', inst.id, err)
    }
  }

  return {
    instancias_generadas,
    total_pendientes: list.length,
    enviadas: detalles.length,
    detalles,
    errores,
  }
}

type AdminClient = ReturnType<typeof createAdminClient>

async function generateMissingDailyInstances(
  admin: AdminClient,
  todayBogota: string
): Promise<number> {
  const { data: dailies } = await admin
    .from('tasks')
    .select('id')
    .eq('frecuencia', 'diaria')
    .eq('activa', true)
    .overrideTypes<{ id: string }[], { merge: false }>()

  if (!dailies || dailies.length === 0) return 0
  const taskIds = dailies.map((d) => d.id)

  const { data: existing } = await admin
    .from('task_instances')
    .select('task_id')
    .in('task_id', taskIds)
    .eq('fecha_limite', todayBogota)
    .overrideTypes<{ task_id: string }[], { merge: false }>()

  const yaTienen = new Set((existing ?? []).map((e) => e.task_id))
  const faltantes = dailies.filter((d) => !yaTienen.has(d.id))

  if (faltantes.length === 0) return 0

  const rows = faltantes.map((d) => ({
    task_id: d.id,
    fecha_limite: todayBogota,
  }))

  const { error } = await admin.from('task_instances').insert(rows)
  if (error) {
    console.error('generateMissingDailyInstances:', error)
    return 0
  }
  return rows.length
}


const SUBJECTS: Record<NotifKind, (titulo: string) => string> = {
  diaria_2h: (t) => `📅 Tu tarea de hoy: ${t}`,
  definida_24h: (t) => `⏰ Vence mañana: ${t}`,
  lapso_apertura: (t) => `🗓️ Mañana se habilita: ${t}`,
  lapso_cierre: (t) => `⚠️ Último día mañana: ${t}`,
}

function subjectFor(kind: NotifKind, titulo: string) {
  return SUBJECTS[kind](titulo)
}

const HEADLINES: Record<NotifKind, string> = {
  diaria_2h: 'Tarea para hoy',
  definida_24h: 'Tu tarea vence mañana',
  lapso_apertura: 'Mañana se abre tu tarea',
  lapso_cierre: 'Mañana es el último día',
}

const ACCENTS: Record<NotifKind, string> = {
  diaria_2h: '#f59e0b',
  definida_24h: '#3b82f6',
  lapso_apertura: '#10b981',
  lapso_cierre: '#ef4444',
}

const PRIORIDAD_COLOR: Record<string, string> = {
  alta: '#dc2626',
  media: '#d97706',
  baja: '#16a34a',
}

function renderEmail(opts: {
  kind: NotifKind
  titulo: string
  descripcion: string | null
  prioridad: string
  plazoText: string
  nombreCajero: string | null
}): string {
  const accent = ACCENTS[opts.kind]
  const prioColor = PRIORIDAD_COLOR[opts.prioridad] ?? '#475569'
  const greeting = opts.nombreCajero ? `Hola ${escapeHtml(opts.nombreCajero)},` : 'Hola,'
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:32px auto;padding:0 16px;">
    <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;">Caja Tasks</p>
    <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px;">${escapeHtml(HEADLINES[opts.kind])}</h1>
      <p style="color:#64748b;margin:0 0 24px;">${greeting}</p>
      <div style="border-left:4px solid ${accent};background:#f8fafc;padding:16px 18px;border-radius:0 8px 8px 0;">
        <p style="font-weight:600;font-size:18px;color:#0f172a;margin:0 0 4px;">${escapeHtml(opts.titulo)}</p>
        ${opts.descripcion ? `<p style="color:#475569;margin:8px 0;font-size:14px;line-height:1.5;">${escapeHtml(opts.descripcion)}</p>` : ''}
        <p style="color:#475569;margin:12px 0 4px;font-size:14px;">⏰ ${escapeHtml(opts.plazoText)}</p>
        <p style="color:${prioColor};margin:0;font-size:14px;font-weight:500;">⚡ Prioridad ${escapeHtml(opts.prioridad)}</p>
      </div>
      <div style="margin-top:24px;">
        <a href="${APP_URL}/tasks" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;font-size:15px;">Ir a mis tareas →</a>
      </div>
    </div>
    <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">Recordatorio automático. Si ya la completaste, marca como hecha en la app.</p>
  </div>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
