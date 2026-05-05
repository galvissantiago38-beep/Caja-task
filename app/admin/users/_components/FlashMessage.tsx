type FlashKind = 'ok' | 'error'

type Props = {
  kind: FlashKind
  code: string
  messages: Record<string, string>
}

const STYLES: Record<FlashKind, string> = {
  ok: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-rose-50 border-rose-200 text-rose-800',
}

const ICONS: Record<FlashKind, string> = {
  ok: '✅',
  error: '⚠️',
}

export default function FlashMessage({ kind, code, messages }: Props) {
  const text = messages[code] ?? messages._default
  if (!text) return null
  return (
    <div
      className={`flex items-start gap-2 border rounded-lg px-4 py-3 text-sm ${STYLES[kind]}`}
      role="status"
    >
      <span aria-hidden>{ICONS[kind]}</span>
      <span>{text}</span>
    </div>
  )
}
