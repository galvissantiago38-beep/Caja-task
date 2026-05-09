type RoleBadgeProps = {
  rol: string | null | undefined
  size?: 'sm' | 'md'
}

const LABELS: Record<string, string> = {
  admin: 'Admin',
  lider: 'Líder',
  cajero: 'Cajero',
  visual: 'Visual',
  almacenista: 'Almacenista',
}

const STYLES: Record<string, string> = {
  admin: 'border-stone-900 text-stone-900',
  lider: 'border-stone-500 text-stone-700',
  cajero: 'border-stone-300 text-stone-500',
  visual: 'border-stone-300 text-stone-500',
  almacenista: 'border-stone-300 text-stone-500',
}

export default function RoleBadge({ rol, size = 'md' }: RoleBadgeProps) {
  const label = LABELS[rol ?? ''] ?? rol ?? '—'
  const style = STYLES[rol ?? ''] ?? 'border-stone-200 text-stone-500'
  const sizeCls = size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
  return (
    <span
      className={`inline-block uppercase tracking-[0.2em] border ${style} ${sizeCls}`}
    >
      {label}
    </span>
  )
}
