type Frecuencia = 'unica' | 'diaria' | 'semanal' | 'mensual' | 'lapso' | string

const FRECUENCIA_LABELS: Record<string, { label: string; icon: string }> = {
  diaria: { label: 'Diaria', icon: '📅' },
  unica: { label: 'Definida', icon: '🎯' },
  lapso: { label: 'Lapso', icon: '🗓️' },
  semanal: { label: 'Semanal', icon: '📆' },
  mensual: { label: 'Mensual', icon: '📆' },
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
}: {
  frecuencia: Frecuencia
  hora_limite: string | null
  fecha_limite: string | null
  apertura: string | null
}) {
  const meta = FRECUENCIA_LABELS[frecuencia] ?? {
    label: frecuencia,
    icon: '📋',
  }

  let detalle = ''
  if (frecuencia === 'diaria' && hora_limite) {
    detalle = `cada día a las ${formatHora(hora_limite)}`
  } else if (frecuencia === 'unica' && fecha_limite) {
    detalle = `${formatDate(fecha_limite)}${
      hora_limite ? ' a las ' + formatHora(hora_limite) : ''
    }`
  } else if (frecuencia === 'lapso' && apertura && fecha_limite) {
    detalle = `${formatDate(apertura)} → ${formatDate(fecha_limite)}`
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
        <span aria-hidden>{meta.icon}</span> {meta.label}
      </span>
      {detalle && <span className="text-slate-500">{detalle}</span>}
    </div>
  )
}
