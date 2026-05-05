'use client'

import Link from 'next/link'
import { useState } from 'react'

type Cajero = {
  id: string
  nombre: string | null
  email: string
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
  icon: string
  desc: string
  color: string
}[] = [
  {
    value: 'diaria',
    label: 'Diaria',
    icon: '📅',
    desc: 'Se repite todos los días con una hora límite.',
    color: 'border-blue-500 bg-blue-50',
  },
  {
    value: 'unica',
    label: 'Definida',
    icon: '🎯',
    desc: 'Una sola vez, en una fecha y hora específicas.',
    color: 'border-purple-500 bg-purple-50',
  },
  {
    value: 'lapso',
    label: 'Por lapso',
    icon: '🗓️',
    desc: 'Ventana de fechas: se abre un día y debe cerrarse antes de otro.',
    color: 'border-emerald-500 bg-emerald-50',
  },
]

const PRIORIDADES = [
  { value: 'alta', label: 'Alta', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'media', label: 'Media', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'baja', label: 'Baja', color: 'bg-green-100 text-green-700 border-green-300' },
]

function normalizeFrecuencia(raw: string | undefined): Frecuencia {
  if (raw === 'diaria' || raw === 'unica' || raw === 'lapso') return raw
  return 'diaria'
}

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
    <form action={action} className="space-y-6">
      {sinCajeros && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-lg p-4 text-sm">
          ⚠️ No hay cajeros registrados todavía. Necesitas al menos un cajero
          para asignarle tareas.
        </div>
      )}

      {/* Título */}
      <div>
        <label
          htmlFor="titulo"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Título <span className="text-red-500">*</span>
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          defaultValue={task?.titulo ?? ''}
          placeholder="Ej. Cuadre de caja"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Descripción */}
      <div>
        <label
          htmlFor="descripcion"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={task?.descripcion ?? ''}
          placeholder="Detalles opcionales de la tarea"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tipo de tarea */}
      <div>
        <span className="block text-sm font-medium text-slate-700 mb-2">
          Tipo de tarea <span className="text-red-500">*</span>
        </span>
        <div className="grid gap-2 sm:grid-cols-3">
          {FRECUENCIAS.map((f) => {
            const active = frecuencia === f.value
            return (
              <label
                key={f.value}
                className={`cursor-pointer border-2 rounded-xl p-3 transition-all ${
                  active
                    ? f.color
                    : 'border-slate-200 bg-white hover:border-slate-300'
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl" aria-hidden>
                    {f.icon}
                  </span>
                  <span className="font-semibold text-slate-900">{f.label}</span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">{f.desc}</p>
              </label>
            )
          })}
        </div>
      </div>

      {/* Plazo (cambia según el tipo) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <span>⏰</span> Plazo de ejecución
        </h3>

        {frecuencia === 'diaria' && (
          <div>
            <label
              htmlFor="hora_limite"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Hora límite cada día <span className="text-red-500">*</span>
            </label>
            <input
              id="hora_limite"
              name="hora_limite"
              type="time"
              required
              defaultValue={task?.hora_limite?.slice(0, 5) ?? '17:00'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              El cajero recibirá un aviso 2 horas antes de esta hora.
            </p>
          </div>
        )}

        {frecuencia === 'unica' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="fecha_limite"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                id="fecha_limite"
                name="fecha_limite"
                type="date"
                required
                defaultValue={task?.fecha_limite ?? ''}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="hora_limite_unica"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Hora <span className="text-red-500">*</span>
              </label>
              <input
                id="hora_limite_unica"
                name="hora_limite"
                type="time"
                required
                defaultValue={task?.hora_limite?.slice(0, 5) ?? '17:00'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-slate-500 sm:col-span-2">
              El cajero recibirá un aviso 24 horas antes.
            </p>
          </div>
        )}

        {frecuencia === 'lapso' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="apertura"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Apertura (se habilita) <span className="text-red-500">*</span>
              </label>
              <input
                id="apertura"
                name="apertura"
                type="date"
                required
                defaultValue={task?.apertura ?? ''}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="fecha_limite_lapso"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Cierre (fecha límite) <span className="text-red-500">*</span>
              </label>
              <input
                id="fecha_limite_lapso"
                name="fecha_limite"
                type="date"
                required
                defaultValue={task?.fecha_limite ?? ''}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-slate-500 sm:col-span-2">
              Avisos: 1 día antes de la apertura y 1 día antes del cierre.
            </p>
          </div>
        )}
      </div>

      {/* Prioridad */}
      <div>
        <span className="block text-sm font-medium text-slate-700 mb-2">
          Prioridad
        </span>
        <div className="flex gap-3 flex-wrap">
          {PRIORIDADES.map((p) => {
            const seleccionada = prioridad === p.value
            return (
              <label
                key={p.value}
                className={`cursor-pointer border-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  seleccionada
                    ? p.color
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="prioridad"
                  value={p.value}
                  checked={seleccionada}
                  onChange={(e) => setPrioridad(e.target.value)}
                  className="sr-only"
                />
                {p.label}
              </label>
            )
          })}
        </div>
      </div>

      {/* Asignado a */}
      <div>
        <label
          htmlFor="asignado_a"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Asignado a <span className="text-red-500">*</span>
        </label>
        <select
          id="asignado_a"
          name="asignado_a"
          required
          defaultValue={task?.asignado_a ?? ''}
          disabled={sinCajeros}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
        >
          <option value="" disabled>
            Selecciona un cajero
          </option>
          {cajeros.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre || c.email}
            </option>
          ))}
        </select>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Link
          href="/tasks"
          className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={sinCajeros}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
