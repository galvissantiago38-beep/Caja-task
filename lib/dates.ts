const TZ_OFFSET_HOURS = 5

export function ymdInBogota(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() - TZ_OFFSET_HOURS * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 10)
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

export type Bucket = 'vencida' | 'hoy' | 'mañana' | 'pronto' | 'despues'

export function bucketize(
  fecha: string,
  today: string,
  tomorrow: string,
  weekEnd: string
): Bucket {
  if (fecha < today) return 'vencida'
  if (fecha === today) return 'hoy'
  if (fecha === tomorrow) return 'mañana'
  if (fecha <= weekEnd) return 'pronto'
  return 'despues'
}
