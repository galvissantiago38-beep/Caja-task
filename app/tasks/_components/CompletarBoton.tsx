'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

type Props = {
  action: (formData: FormData) => void | Promise<void>
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-stone-900 text-white px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
    >
      {pending && (
        <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
      )}
      {pending ? 'Marcando' : 'Marcar hecha'}
    </button>
  )
}

export default function CompletarBoton({ action }: Props) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-stone-900 text-white px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
      >
        Marcar hecha
      </button>
    )
  }

  return (
    <form action={action} className="space-y-3">
      <textarea
        name="notas"
        rows={2}
        placeholder="Notas (opcional)"
        className="w-full text-sm px-3 py-2.5 border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-stone-900 transition-colors"
      />
      <div className="flex items-center gap-3">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-900 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
