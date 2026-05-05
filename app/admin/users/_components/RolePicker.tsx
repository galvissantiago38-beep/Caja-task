'use client'

import { useState } from 'react'

type Rol = 'admin' | 'lider' | 'cajero'

const OPTIONS: { value: Rol; label: string; icon: string; desc: string; color: string }[] = [
  {
    value: 'cajero',
    label: 'Cajero',
    icon: '🧑‍💼',
    desc: 'Ve y completa las tareas que se le asignan.',
    color: 'border-blue-500 bg-blue-50',
  },
  {
    value: 'lider',
    label: 'Líder',
    icon: '👑',
    desc: 'Crea, edita y asigna tareas a los cajeros.',
    color: 'border-purple-500 bg-purple-50',
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: '🛡️',
    desc: 'Gestiona usuarios y tiene acceso total al panel.',
    color: 'border-rose-500 bg-rose-50',
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
    <div className="grid gap-2">
      {OPTIONS.map((opt) => {
        const active = selected === opt.value
        return (
          <label
            key={opt.value}
            className={`cursor-pointer border-2 rounded-xl px-4 py-3 transition-all ${
              active
                ? opt.color
                : 'border-slate-200 bg-white hover:border-slate-300'
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
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden>
                {opt.icon}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {opt.label}
                  </span>
                  {active && (
                    <span className="text-xs font-medium text-rose-700">
                      ● seleccionado
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{opt.desc}</p>
              </div>
            </div>
          </label>
        )
      })}
    </div>
  )
}
