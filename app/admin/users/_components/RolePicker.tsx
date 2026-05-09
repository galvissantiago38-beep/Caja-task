'use client'

import { useState } from 'react'

type Rol = 'admin' | 'lider' | 'cajero'

const OPTIONS: { value: Rol; label: string; desc: string }[] = [
  {
    value: 'cajero',
    label: 'Cajero',
    desc: 'Ve y completa las tareas que se le asignan.',
  },
  {
    value: 'lider',
    label: 'Líder',
    desc: 'Crea, edita y asigna tareas a los cajeros.',
  },
  {
    value: 'admin',
    label: 'Administrador',
    desc: 'Gestiona usuarios y tiene acceso total al panel.',
  },
]

export default function RolePicker({
  defaultValue = 'cajero',
  name = 'rol',
}: {
  defaultValue?: Rol
  name?: string
}) {
  const [selected, setSelected] = useState<Rol>(defaultValue)

  return (
    <div className="grid gap-px bg-stone-200">
      {OPTIONS.map((opt) => {
        const active = selected === opt.value
        return (
          <label
            key={opt.value}
            className={`cursor-pointer p-5 transition-colors ${
              active
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-900 hover:bg-stone-50'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              onChange={() => setSelected(opt.value)}
              className="sr-only"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.2em] font-medium">
                {opt.label}
              </span>
              {active && (
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-300">
                  Seleccionado
                </span>
              )}
            </div>
            <p
              className={`text-xs mt-2 leading-relaxed ${
                active ? 'text-stone-300' : 'text-stone-500'
              }`}
            >
              {opt.desc}
            </p>
          </label>
        )
      })}
    </div>
  )
}
