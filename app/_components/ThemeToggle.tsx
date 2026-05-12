'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null)

  useEffect(() => {
    // Leemos el DOM (el script inline en <head> ya aplicó el tema antes
    // del primer paint) y sincronizamos el estado de React para que el
    // botón muestre el icono correcto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {}
  }

  // No renderizamos hasta saber el estado real, para evitar el flicker
  // del icono incorrecto durante el primer paint.
  if (isDark === null) {
    return <span className="w-6 h-6 inline-block" aria-hidden />
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors text-base leading-none w-6 h-6 flex items-center justify-center"
    >
      {isDark ? '☀' : '☾'}
    </button>
  )
}
