'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({
  label,
  pendingLabel,
  variant = 'primary',
}: {
  label: string
  pendingLabel?: string
  variant?: 'primary' | 'secondary'
}) {
  const { pending } = useFormStatus()
  const styles =
    variant === 'primary'
      ? 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300'
      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60'
  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed inline-flex items-center gap-2 ${styles}`}
    >
      {pending && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {pending ? pendingLabel ?? 'Procesando…' : label}
    </button>
  )
}
