type RoleBadgeProps = {
  rol: string | null | undefined
  size?: 'sm' | 'md'
}

const STYLES: Record<string, { class: string; label: string }> = {
  admin: { class: 'bg-rose-100 text-rose-700', label: '🛡️ Admin' },
  lider: { class: 'bg-purple-100 text-purple-700', label: '👑 Líder' },
  cajero: { class: 'bg-blue-100 text-blue-700', label: '🧑‍💼 Cajero' },
}

export default function RoleBadge({ rol, size = 'md' }: RoleBadgeProps) {
  const style = STYLES[rol ?? ''] ?? {
    class: 'bg-slate-100 text-slate-600',
    label: rol ?? '—',
  }
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span className={`rounded-full font-medium ${sizeClass} ${style.class}`}>
      {style.label}
    </span>
  )
}
