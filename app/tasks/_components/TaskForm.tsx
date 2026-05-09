'use client'

import Link from 'next/link'
import { useState } from 'react'

type Cajero = {
  id: string
  nombre: string | null
  email: string
  rol?: string | null
}

const ROL_LABEL: Record<string, string> = {
  cajero: 'Cajero',
  visual: 'Visual',
  almacenista: 'Almacén',
}

export type TaskFormData = {
  id: string
  titulo: string
  descripcion: string | null
  frecuencia: string
  prioridad: string
  asignado_a: string | null
  hora_limite: string | null
  fecha_limite: string | null
  apertura: string | null
}

type TaskFormProps = {
  cajeros: Cajero[]
  task?: TaskFormData
  action: (formData: FormData) => void | Promise<void>
  submitLabel: string
}

type Frecuencia = 'diaria' | 'unica' | 'lapso'

const FRECUENCIAS: {
  value: Frecuencia
  label: string
  desc: string
}[] = [
  {
    value: 'diaria',
    label: 'Diaria',
    desc: 'Se repite todos los días con una hora límite.',
  },
  {
    value: 'unica',
    label: 'Definida',
    desc: 'Una sola vez, fecha y hora específicas.',
  },
  {
    value: 'lapso',
    label: 'Por lapso',
    desc: 'Ventana entre apertura y cierre.',
  },
]

const PRIORIDADES = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
]

function normalizeFrecuencia(raw: string | undefined): Frecuencia {
  if (raw === 'diaria' || raw === 'unica' || raw === 'lapso') return raw
  return 'diaria'
}

const inputCls =
  'w-full px-3 py-2.5 border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors'

const labelCls =
  'block text-[11px] uppercase tracking-[0.18em] text-stone-700 mb-2'

export default function TaskForm({
  cajeros,
  task,
  action,
  submitLabel,
}: TaskFormProps) {
  const [frecuencia, setFrecuencia] = useState<Frecuencia>(
    normalizeFrecuencia(task?.frecuencia)
  )
  const [prioridad, setPrioridad] = useState(task?.prioridad ?? 'media')

  const sinCajeros = cajeros.length === 0

  return (
    <form action={action} className="space-y-10">
      {sinCajeros && (
        <div className="border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          No hay miembros del equipo registrados aún. Necesitas al menos uno
          para asignarle tareas.
        </div>
      )}

      <div>
        <label htmlFor="titulo" className={labelCls}>
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          defaultValue={task?.titulo ?? ''}
          placeholder="Ej. Cuadre de caja"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="descripcion" className={labelCls}>
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={task?.descripcion ?? ''}
          placeholder="Detalles opcionales"
          className={inputCls}
        />
      </div>

      <div>
        <span className={labelCls}>Tipo</span>
        <div className="grid gap-px bg-stone-200 sm:grid-cols-3">
          {FRECUENCIAS.map((f) => {
            const active = frecuencia === f.value
            return (
              <label
                key={f.value}
                className={`cursor-pointer p-5 transition-colors ${
                  active
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-900 hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="frecuencia"
                  value={f.value}
                  checked={active}
                  onChange={() => setFrecuencia(f.value)}
                  className="sr-only"
                />
                <span className="block text-[11px] uppercase tracking-[0.2em] mb-2">
                  {f.label}
                </span>
                <span
                  className={`block text-xs leading-relaxed ${
                    active ? 'text-stone-200' : 'text-stone-500'
                  }`}
                >
                  {f.desc}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="border-t border-stone-200 pt-8">
        <span className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-5 block">
          Plazo de ejecución
        </span>

        {frecuencia === 'diaria' && (
          <div>
            <label htmlFor="hora_limite" className={labelCls}>
              Hora límite cada día
            </label>
            <input
              id="hora_limite"
              name="hora_limite"
              type="time"
              required
              defaultValue={task?.hora_limite?.slice(0, 5) ?? '17:00'}
              className={inputCls}
            />
            <p className="text-xs text-stone-500 mt-2">
              La persona asignada recibirá un aviso antes de esta hora.
            </p>
          </div>
        )}

        {frecuencia === 'unica' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="fecha_limite" className={labelCls}>
                Fecha
              </label>
              <input
                id="fecha_limite"
                name="fecha_limite"
                type="date"
                required
                defaultValue={task?.fecha_limite ?? ''}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="hora_limite_unica" className={labelCls}>
                Hora
              </label>
              <input
                id="hora_limite_unica"
                name="hora_limite"
                type="time"
                required
                defaultValue={task?.hora_limite?.slice(0, 5) ?? '17:00'}
                className={inputCls}
              />
            </div>
            <p className="text-xs text-stone-500 sm:col-span-2">
              Aviso 24 horas antes.
            </p>
          </div>
        )}

        {frecuencia === 'lapso' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="apertura" className={labelCls}>
                Apertura
              </label>
              <input
                id="apertura"
                name="apertura"
                type="date"
                required
                defaultValue={task?.apertura ?? ''}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="fecha_limite_lapso" className={labelCls}>
                Cierre
              </label>
              <input
                id="fecha_limite_lapso"
                name="fecha_limite"
                type="date"
                required
                defaultValue={task?.fecha_limite ?? ''}
                className={inputCls}
              />
            </div>
            <p className="text-xs text-stone-500 sm:col-span-2">
              Aviso 1 día antes de la apertura y 1 día antes del cierre.
            </p>
          </div>
        )}
      </div>

      <div>
        <span className={labelCls}>Prioridad</span>
        <div className="flex gap-3">
          {PRIORIDADES.map((p) => {
            const active = prioridad === p.value
            return (
              <label
                key={p.value}
                className={`cursor-pointer border px-5 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  active
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-300 text-stone-600 hover:border-stone-900 hover:text-stone-900'
                }`}
              >
                <input
                  type="radio"
                  name="prioridad"
                  value={p.value}
                  checked={active}
                  onChange={(e) => setPrioridad(e.target.value)}
                  className="sr-only"
                />
                {p.label}
              </label>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="asignado_a" className={labelCls}>
          Asignado a
        </label>
        <select
          id="asignado_a"
          name="asignado_a"
          required
          defaultValue={task?.asignado_a ?? ''}
          disabled={sinCajeros}
          className={`${inputCls} disabled:bg-stone-50 disabled:text-stone-400`}
        >
          <option value="" disabled>
            Selecciona una persona
          </option>
          {cajeros.map((c) => {
            const rolLabel = c.rol ? ROL_LABEL[c.rol] : null
            return (
              <option key={c.id} value={c.id}>
                {c.nombre || c.email}
                {rolLabel ? ` — ${rolLabel}` : ''}
              </option>
            )
          })}
        </select>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-stone-200">
        <Link
          href="/tasks"
          className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-900 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={sinCajeros}
          className="bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
