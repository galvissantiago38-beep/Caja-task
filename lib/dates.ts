const TZ_OFFSET_HOURS = 5

export function ymdInBogota(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() - TZ_OFFSET_HOURS * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 10)
}

export function isoWeekday(ymd: string): number {
  // 1 = Lunes ... 7 = Domingo (ISO 8601)
  const [y, m, d] = ymd.split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return day === 0 ? 7 : day
}

export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return dt.toISOString().slice(0, 10)
}

export function formatDateEs(ymd: string | null): string {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-')
  return `${d}/${m}/${y}`
}

export type Bucket =
  | 'vencida'
  | 'hoy'
  | 'mañana'
  | 'pronto'
  | 'despues'
  | 'sin_fecha'

export function bucketize(
  fecha: string | null,
  today: string,
  tomorrow: string,
  weekEnd: string
): Bucket {
  if (!fecha) return 'sin_fecha'
  if (fecha < today) return 'vencida'
  if (fecha === today) return 'hoy'
  if (fecha === tomorrow) return 'mañana'
  if (fecha <= weekEnd) return 'pronto'
  return 'despues'
}
