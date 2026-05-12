'use client'

import { useFormStatus } from 'react-dom'

type Props = {
  action: () => void | Promise<void>
  nombre: string
  disabled?: boolean
  disabledReason?: string
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-200 hover:decoration-stone-900 transition-colors disabled:text-stone-300 dark:text-stone-700 disabled:no-underline disabled:cursor-not-allowed"
    >
      {pending ? 'Eliminando' : 'Eliminar'}
    </button>
  )
}

export default function DeleteUserButton({
  action,
  nombre,
  disabled,
  disabledReason,
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `¿Eliminar a "${nombre}"? Esto borra al usuario de Supabase Auth y su perfil.`
          )
        ) {
          e.preventDefault()
        }
      }}
      title={disabled ? disabledReason : undefined}
    >
      <SubmitButton disabled={disabled} />
    </form>
  )
}
