'use client'

type DeleteTaskButtonProps = {
  action: () => void | Promise<void>
  titulo: string
}

export default function DeleteTaskButton({
  action,
  titulo,
}: DeleteTaskButtonProps) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(e) => {
          if (
            !confirm(
              `¿Eliminar la tarea "${titulo}"? Esta acción la desactivará.`
            )
          ) {
            e.preventDefault()
          }
        }}
        className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-200 hover:decoration-stone-900 transition-colors"
      >
        Eliminar
      </button>
    </form>
  )
}
