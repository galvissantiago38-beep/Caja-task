'use client'

import { useState } from 'react'

type Props = {
  name: string
  id?: string
  required?: boolean
  minLength?: number
  defaultValue?: string
  placeholder?: string
  showGenerate?: boolean
}

function generatePassword(length = 16) {
  const charset =
    'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => charset[n % charset.length]).join('')
}

export default function PasswordInput({
  name,
  id,
  required,
  minLength = 6,
  defaultValue = '',
  placeholder = 'Mínimo 6 caracteres',
  showGenerate = false,
}: Props) {
  const [value, setValue] = useState(defaultValue)
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={id ?? name}
          name={name}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-20 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
        >
          {visible ? 'Ocultar' : 'Ver'}
        </button>
      </div>

      {showGenerate && (
        <button
          type="button"
          onClick={() => {
            const pwd = generatePassword()
            setValue(pwd)
            setVisible(true)
          }}
          className="text-sm text-rose-600 hover:text-rose-800 font-medium"
        >
          🎲 Generar contraseña segura
        </button>
      )}
    </div>
  )
}
