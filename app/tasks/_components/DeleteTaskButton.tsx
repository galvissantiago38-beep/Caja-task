'use client'

type DeleteTaskButtonProps = {
  action: () => void | Promise<void>
  titulo: string
}

export default function DeleteTaskButton({ action, titulo }: DeleteTaskButtonProps) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(`¿Eliminar la tarea "${titulo}"? Esta acción la desactivará.`)) {
            e.preventDefault()
          }
        }}
        className="text-red-600 hover:text-red-800 text-sm font-medium"
      >
        Eliminar
      </button>
    </form>
  )
}
