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
  admin: 'border-stone-900 text-stone-900 dark:text-stone-100',
  lider: 'border-stone-500 text-stone-700 dark:text-stone-300',
  cajero: 'border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400',
  visual: 'border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400',
  almacenista: 'border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400',
}

export default function RoleBadge({ rol, size = 'md' }: RoleBadgeProps) {
  const label = LABELS[rol ?? ''] ?? rol ?? '—'
  const style = STYLES[rol ?? ''] ?? 'border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400'
  const sizeCls = size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
  return (
    <span
      className={`inline-block uppercase tracking-[0.2em] border ${style} ${sizeCls}`}
    >
      {label}
    </span>
  )
}
