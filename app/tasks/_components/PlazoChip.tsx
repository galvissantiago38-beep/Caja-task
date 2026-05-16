type Frecuencia = 'unica' | 'diaria' | 'semanal' | 'mensual' | 'lapso' | 'libre' | string

const FRECUENCIA_LABELS: Record<string, string> = {
  diaria: 'Diaria',
  unica: 'Definida',
  lapso: 'Lapso',
  semanal: 'Semanal',
  mensual: 'Mensual',
  libre: 'Sin fecha',
}

const DIAS_SEMANA: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
}

function formatDate(d: string | null) {
  if (!d) return null
  const [y, m, day] = d.split('-')
  if (!y || !m || !day) return d
  return `${day}/${m}/${y}`
}

function formatHora(h: string | null) {
  if (!h) return null
  return h.slice(0, 5)
}

export default function PlazoChip({
  frecuencia,
  hora_limite,
  fecha_limite,
  apertura,
  dia_semana,
}: {
  frecuencia: Frecuencia
  hora_limite: string | null
  fecha_limite: string | null
  apertura: string | null
  dia_semana?: number | null
}) {
  const label = FRECUENCIA_LABELS[frecuencia] ?? frecuencia

  let detalle = ''
  if (frecuencia === 'diaria' && hora_limite) {
    detalle = `cada día · ${formatHora(hora_limite)}`
  } else if (frecuencia === 'semanal' && dia_semana) {
    const dia = DIAS_SEMANA[dia_semana] ?? ''
    detalle = `${dia}${hora_limite ? ' · ' + formatHora(hora_limite) : ''}`
  } else if (frecuencia === 'unica' && fecha_limite) {
    detalle = `${formatDate(fecha_limite)}${
      hora_limite ? ' · ' + formatHora(hora_limite) : ''
    }`
  } else if (frecuencia === 'lapso' && apertura && fecha_limite) {
    detalle = `${formatDate(apertura)} – ${formatDate(fecha_limite)}`
  } else if (frecuencia === 'libre') {
    detalle = 'sin plazo'
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="uppercase tracking-[0.18em] text-stone-900 dark:text-stone-100 text-[10px] font-medium">
        {label}
      </span>
      {detalle && <span className="text-stone-500 dark:text-stone-400">{detalle}</span>}
    </div>
  )
}
