type FlashKind = 'ok' | 'error'

type Props = {
  kind: FlashKind
  code: string
  messages: Record<string, string>
}

const STYLES: Record<FlashKind, string> = {
  ok: 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800',
  error: 'border-stone-900 text-stone-900 dark:text-stone-100',
}

export default function FlashMessage({ kind, code, messages }: Props) {
  const text = messages[code] ?? messages._default
  if (!text) return null
  return (
    <div
      className={`border px-5 py-4 text-sm ${STYLES[kind]}`}
      role="status"
    >
      {text}
    </div>
  )
}
