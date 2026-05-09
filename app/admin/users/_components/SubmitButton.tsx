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
      ? 'bg-stone-900 text-white hover:bg-stone-700'
      : 'border border-stone-900 text-stone-900 hover:bg-stone-50'
  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-7 py-3 text-[11px] uppercase tracking-[0.25em] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 ${styles}`}
    >
      {pending && (
        <span
          className={`w-3 h-3 border border-current border-t-transparent rounded-full animate-spin`}
        />
      )}
      {pending ? pendingLabel ?? 'Procesando' : label}
    </button>
  )
}
