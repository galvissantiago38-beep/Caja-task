'use client'

import Link from 'next/link'
import { useState } from 'react'

type Cajero = {
  id: string
  nombre: string | null
  email: string
}

type Task = {
  id: string
  titulo: string
  descripcion: string | null
  frecuencia: string
  dia_del_mes: number | null
  prioridad: string
  asignado_a: string | null
}

type TaskFormProps = {
  cajeros: Cajero[]
  task?: Task
  action: (formData: FormData) => void | Promise<void>
  submitLabel: string
}

const PRIORIDADES = [
  { value: 'alta', label: 'Alta', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'media', label: 'Media', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'baja', label: 'Baja', color: 'bg-green-100 text-green-700 border-green-300' },
]

export default function TaskForm({ cajeros, task, action, submitLabel }: TaskFormProps) {
  const [frecuencia, setFrecuencia] = useState(task?.frecuencia ?? 'unica')
  const [prioridad, setPrioridad] = useState(task?.prioridad ?? 'media')

  const sinCajeros = cajeros.length === 0

  return (
    <form action={action} className="space-y-6">
      {sinCajeros && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-lg p-4 text-sm">
          ⚠️ No hay cajeros registrados todavía. Necesitas al menos un cajero para asignarle tareas.
        </div>
      )}

      {/* Título */}
      <div>
        <label htmlFor="titulo" className="block text-sm font-medium text-slate-700 mb-1">
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
        <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-1">
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

      {/* Frecuencia */}
      <div>
        <label htmlFor="frecuencia" className="block text-sm font-medium text-slate-700 mb-1">
          Frecuencia <span className="text-red-500">*</span>
        </label>
        <select
          id="frecuencia"
          name="frecuencia"
          required
          value={frecuencia}
          onChange={(e) => setFrecuencia(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="unica">Única</option>
          <option value="diaria">Diaria</option>
          <option value="semanal">Semanal</option>
          <option value="mensual">Mensual</option>
        </select>
      </div>

      {/* Día del mes (solo si frecuencia=mensual) */}
      {frecuencia === 'mensual' && (
        <div>
          <label htmlFor="dia_del_mes" className="block text-sm font-medium text-slate-700 mb-1">
            Día del mes (1–31)
          </label>
          <input
            id="dia_del_mes"
            name="dia_del_mes"
            type="number"
            min={1}
            max={31}
            defaultValue={task?.dia_del_mes ?? ''}
            placeholder="Ej. 15"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Prioridad (radios con colores) */}
      <div>
        <span className="block text-sm font-medium text-slate-700 mb-2">Prioridad</span>
        <div className="flex gap-3 flex-wrap">
          {PRIORIDADES.map((p) => {
            const seleccionada = prioridad === p.value
            return (
              <label
                key={p.value}
                className={`cursor-pointer border-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  seleccionada ? p.color : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
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
        <label htmlFor="asignado_a" className="block text-sm font-medium text-slate-700 mb-1">
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
