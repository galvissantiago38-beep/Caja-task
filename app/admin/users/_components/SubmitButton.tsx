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
      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300'
      : 'border border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 dark:bg-stone-900'
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
