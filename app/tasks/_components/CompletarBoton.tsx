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
      className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
    >
      {pending && (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {pending ? 'Marcando…' : '✓ Marcar hecha'}
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
        className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
      >
        ✓ Marcar hecha
      </button>
    )
  }

  return (
    <form action={action} className="space-y-2">
      <textarea
        name="notas"
        rows={2}
        placeholder="Notas (opcional): ¿algo a comentar al cerrar?"
        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <div className="flex items-center gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
