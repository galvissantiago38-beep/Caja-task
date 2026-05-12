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
          className="w-full px-3 py-2.5 pr-20 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:text-stone-500 focus:outline-none focus:border-stone-900 font-mono transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 px-2 py-1 transition-colors"
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
          className="text-[11px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
        >
          Generar contraseña segura
        </button>
      )}
    </div>
  )
}
