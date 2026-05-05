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
      className="text-rose-600 hover:text-rose-800 text-sm font-medium disabled:text-slate-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Eliminando…' : 'Eliminar'}
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
            `¿Eliminar a "${nombre}"?\n\nEsto borra al usuario de Supabase Auth y su perfil. Las tareas que tenga asignadas pueden bloquear el borrado o quedar sin asignar.`
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
