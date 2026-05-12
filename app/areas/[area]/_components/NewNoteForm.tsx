'use client'

import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createNote } from '../../_actions/notes'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Guardando…' : 'Publicar'}
    </button>
  )
}

export default function NewNoteForm({ area }: { area: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100 px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
      >
        + Nueva nota
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      action={async (formData: FormData) => {
        await createNote(area, formData)
        formRef.current?.reset()
        setOpen(false)
      }}
      className="space-y-3 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5"
    >
      <textarea
        name="contenido"
        rows={3}
        required
        autoFocus
        placeholder="Escribe la nota…"
        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors text-sm leading-relaxed"
      />
      <input
        name="firma"
        type="text"
        placeholder="Firma (opcional)"
        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors text-sm"
      />
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={() => {
            formRef.current?.reset()
            setOpen(false)
          }}
          className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          Cancelar
        </button>
        <SubmitButton />
      </div>
    </form>
  )
}
