import 'server-only'
import { Resend } from 'resend'
import { createAdminClient } from './supabase/admin'
import { addDays, formatDateEs, isoWeekday, ymdInBogota } from './dates'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
  'https://tasks-calle82.vercel.app'
const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Caja Tasks <onboarding@resend.dev>'
// Single inbox para todas las notificaciones del cron. Default = correo
// corporativo de la tienda. Sobreescribir con NOTIFICATIONS_TO en Vercel
// si en algún momento se quiere apuntar a otro lado.
const EMAIL_TO_OVERRIDE_DEFAULT = 'mdutti.calle82@tendenzanova.com.co'
const NOTIFICATIONS_TO_RAW = process.env.NOTIFICATIONS_TO?.trim()
const EMAIL_TO_FINAL = NOTIFICATIONS_TO_RAW || EMAIL_TO_OVERRIDE_DEFAULT

const AREA_LABEL: Record<string, string> = {
  cajero: 'Caja',
  visual: 'Visual',
  almacenista: 'Almacén',
}

type NotifKind =
  | 'diaria_2h'
  | 'semanal_2h'
  | 'definida_24h'
  | 'lapso_apertura'
  | 'lapso_cierre'

type TaskLite = {
  id: string
  titulo: string
  descripcion: string | null
  frecuencia: string
  prioridad: string
  hora_limite: string | null
  apertura: string | null
  area: string | null
  dia_semana: number | null
}

type Instance = {
  id: string
  fecha_limite: string | null
  notificada_dia: boolean | null
  notificada_apertura: boolean | null
  task: TaskLite | null
}

export type NotificationsRunSummary = {
  instancias_generadas: number
  total_pendientes: number
  enviadas: number
  detalles: { kind: NotifKind; area: string | null; titulo: string }[]
  errores: { instance_id: string; error: string }[]
}

export async function runNotifications(): Promise<NotificationsRunSummary> {
  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY!)

  const now = new Date()
  const todayBogota = ymdInBogota(now)
  const tomorrowBogota = addDays(todayBogota, 1)

  const daily = await generateMissingDailyInstances(admin, todayBogota)
  const weekly = await generateMissingWeeklyInstances(admin, todayBogota)
  const instancias_generadas = daily + weekly

  const { data: instances, error } = await admin
    .from('task_instances')
    .select(
      'id, fecha_limite, notificada_dia, notificada_apertura, task:tasks!task_id(id, titulo, descripcion, frecuencia, prioridad, hora_limite, apertura, area, dia_semana)'
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

    const send = async (
      kind: NotifKind,
      plazoText: string,
      flagColumn: 'notificada_dia' | 'notificada_apertura'
    ) => {
      const subject = subjectFor(kind, task.titulo)
      const html = renderEmail({
        kind,
        titulo: task.titulo,
        descripcion: task.descripcion,
        prioridad: task.prioridad,
        plazoText,
        area: task.area,
      })
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: EMAIL_TO_FINAL,
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
      detalles.push({ kind, area: task.area, titulo: task.titulo })
    }

    try {
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
        task.frecuencia === 'semanal' &&
        !inst.notificada_dia &&
        task.hora_limite &&
        inst.fecha_limite === todayBogota
      ) {
        await send(
          'semanal_2h',
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

async function generateMissingWeeklyInstances(
  admin: AdminClient,
  todayBogota: string
): Promise<number> {
  const weekday = isoWeekday(todayBogota)

  const { data: weeklies } = await admin
    .from('tasks')
    .select('id')
    .eq('frecuencia', 'semanal')
    .eq('activa', true)
    .eq('dia_semana', weekday)
    .overrideTypes<{ id: string }[], { merge: false }>()

  if (!weeklies || weeklies.length === 0) return 0
  const taskIds = weeklies.map((d) => d.id)

  const { data: existing } = await admin
    .from('task_instances')
    .select('task_id')
    .in('task_id', taskIds)
    .eq('fecha_limite', todayBogota)
    .overrideTypes<{ task_id: string }[], { merge: false }>()

  const yaTienen = new Set((existing ?? []).map((e) => e.task_id))
  const faltantes = weeklies.filter((d) => !yaTienen.has(d.id))

  if (faltantes.length === 0) return 0

  const rows = faltantes.map((d) => ({
    task_id: d.id,
    fecha_limite: todayBogota,
  }))

  const { error } = await admin.from('task_instances').insert(rows)
  if (error) {
    console.error('generateMissingWeeklyInstances:', error)
    return 0
  }
  return rows.length
}

const SUBJECTS: Record<NotifKind, (titulo: string) => string> = {
  diaria_2h: (t) => `Tarea de hoy: ${t}`,
  semanal_2h: (t) => `Tarea de hoy: ${t}`,
  definida_24h: (t) => `Vence mañana: ${t}`,
  lapso_apertura: (t) => `Mañana se habilita: ${t}`,
  lapso_cierre: (t) => `Último día mañana: ${t}`,
}

function subjectFor(kind: NotifKind, titulo: string) {
  return SUBJECTS[kind](titulo)
}

const HEADLINES: Record<NotifKind, string> = {
  diaria_2h: 'Tarea para hoy',
  semanal_2h: 'Tarea semanal para hoy',
  definida_24h: 'Tarea que vence mañana',
  lapso_apertura: 'Mañana se abre una tarea',
  lapso_cierre: 'Mañana es el último día',
}

function renderEmail(opts: {
  kind: NotifKind
  titulo: string
  descripcion: string | null
  prioridad: string
  plazoText: string
  area: string | null
}): string {
  const areaLabel = opts.area ? AREA_LABEL[opts.area] ?? opts.area : '—'
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#faf6ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:560px;margin:32px auto;padding:0 16px;">
    <p style="color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.25em;margin:0 0 12px;">Caja Tasks</p>
    <div style="background:white;border:1px solid #e7e5e4;padding:32px;">
      <p style="color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.25em;margin:0 0 8px;">Área · ${escapeHtml(areaLabel)}</p>
      <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1c1917;margin:0 0 24px;letter-spacing:0.01em;">${escapeHtml(HEADLINES[opts.kind])}</h1>
      <div style="border-top:1px solid #e7e5e4;padding-top:20px;margin-top:8px;">
        <p style="font-weight:600;font-size:17px;color:#1c1917;margin:0 0 6px;">${escapeHtml(opts.titulo)}</p>
        ${opts.descripcion ? `<p style="color:#57534e;margin:8px 0;font-size:14px;line-height:1.55;">${escapeHtml(opts.descripcion)}</p>` : ''}
        <p style="color:#57534e;margin:14px 0 4px;font-size:13px;">${escapeHtml(opts.plazoText)}</p>
        <p style="color:#57534e;margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;">Prioridad · ${escapeHtml(opts.prioridad)}</p>
      </div>
      <div style="margin-top:28px;">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#1c1917;color:white;padding:12px 28px;text-decoration:none;font-size:11px;text-transform:uppercase;letter-spacing:0.25em;font-weight:500;">Abrir Caja Tasks</a>
      </div>
    </div>
    <p style="color:#a8a29e;font-size:11px;margin:24px 0 0;text-align:center;letter-spacing:0.05em;">Recordatorio automático. Si ya está hecha, márcala desde la app.</p>
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
