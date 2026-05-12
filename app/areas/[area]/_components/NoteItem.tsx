'use client'

import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteNote, updateNote } from '../../_actions/notes'

type Note = {
  id: string
  contenido: string
  firma: string | null
  created_at: string
  updated_at: string
}

type Props = {
  note: Note
  area: string
}

function UpdateButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-5 py-2 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Guardar'}
    </button>
  )
}

export default function NoteItem({ note, area }: Props) {
  const [editing, setEditing] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const fueEditada = note.updated_at !== note.created_at

  if (editing) {
    return (
      <li className="border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-5">
        <form
          ref={formRef}
          action={async (formData: FormData) => {
            await updateNote(note.id, formData)
            setEditing(false)
          }}
          className="space-y-3"
        >
          <input type="hidden" name="area" value={area} />
          <textarea
            name="contenido"
            rows={3}
            required
            defaultValue={note.contenido}
            autoFocus
            className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors text-sm leading-relaxed"
          />
          <input
            name="firma"
            type="text"
            placeholder="Firma (opcional)"
            defaultValue={note.firma ?? ''}
            className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors text-sm"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Cancelar
            </button>
            <UpdateButton />
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="bg-white dark:bg-stone-900 p-5">
      <p className="text-stone-900 dark:text-stone-100 whitespace-pre-line leading-relaxed">
        {note.contenido}
      </p>
      <div className="flex items-end justify-between flex-wrap gap-3 mt-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          {note.firma ? <span className="mr-2">— {note.firma}</span> : null}
          <span>{formatRelative(note.created_at)}</span>
          {fueEditada && (
            <span className="ml-2 text-stone-400 dark:text-stone-500">
              · editada
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-300 dark:decoration-stone-700 hover:decoration-stone-900 dark:hover:decoration-stone-100 transition-colors"
          >
            Editar
          </button>
          <form
            action={deleteNote.bind(null, note.id, area)}
            onSubmit={(e) => {
              if (!confirm('¿Eliminar esta nota?')) e.preventDefault()
            }}
          >
            <DeleteSubmit />
          </form>
        </div>
      </div>
    </li>
  )
}

function DeleteSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-200 dark:decoration-stone-800 hover:decoration-stone-900 dark:hover:decoration-stone-100 transition-colors disabled:opacity-50"
    >
      {pending ? 'Eliminando…' : 'Eliminar'}
    </button>
  )
}

function formatRelative(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'Justo ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
