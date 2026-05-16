'use client'

import Link from 'next/link'
import { useState } from 'react'

export type TaskFormData = {
  id: string
  titulo: string
  descripcion: string | null
  frecuencia: string
  prioridad: string
  area: string | null
  hora_limite: string | null
  fecha_limite: string | null
  apertura: string | null
  dia_semana: number | null
}

type TaskFormProps = {
  task?: TaskFormData
  defaultArea?: string
  cancelHref?: string
  action: (formData: FormData) => void | Promise<void>
  submitLabel: string
}

type Frecuencia = 'diaria' | 'semanal' | 'unica' | 'lapso' | 'libre'

const FRECUENCIAS: {
  value: Frecuencia
  label: string
  desc: string
}[] = [
  {
    value: 'diaria',
    label: 'Diaria',
    desc: 'Todos los días con una hora límite.',
  },
  {
    value: 'semanal',
    label: 'Semanal',
    desc: 'Un día fijo cada semana (ej. miércoles).',
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
  {
    value: 'libre',
    label: 'Sin fecha',
    desc: 'Pendiente sin plazo hasta que la marquen hecha.',
  },
]

const AREAS = [
  { value: 'cajero', label: 'Caja' },
  { value: 'visual', label: 'Visual' },
  { value: 'almacenista', label: 'Almacén' },
]

const PRIORIDADES = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
]

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

function normalizeFrecuencia(raw: string | undefined): Frecuencia {
  if (
    raw === 'diaria' ||
    raw === 'semanal' ||
    raw === 'unica' ||
    raw === 'lapso' ||
    raw === 'libre'
  )
    return raw
  return 'diaria'
}

function normalizeArea(raw: string | null | undefined): string {
  if (raw === 'cajero' || raw === 'visual' || raw === 'almacenista') return raw
  return 'cajero'
}

const inputCls =
  'w-full px-3 py-2.5 border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors'

const labelCls =
  'block text-[11px] uppercase tracking-[0.18em] text-stone-700 mb-2'

export default function TaskForm({
  task,
  defaultArea,
  cancelHref = '/tasks',
  action,
  submitLabel,
}: TaskFormProps) {
  const [frecuencia, setFrecuencia] = useState<Frecuencia>(
    normalizeFrecuencia(task?.frecuencia)
  )
  const [prioridad, setPrioridad] = useState(task?.prioridad ?? 'media')
  const [area, setArea] = useState<string>(
    normalizeArea(task?.area ?? defaultArea)
  )

  return (
    <form action={action} className="space-y-10">
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
        <span className={labelCls}>Área</span>
        <div className="grid gap-px bg-stone-200 sm:grid-cols-3">
          {AREAS.map((a) => {
            const active = area === a.value
            return (
              <label
                key={a.value}
                className={`cursor-pointer p-5 transition-colors text-center ${
                  active
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-900 hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="area"
                  value={a.value}
                  checked={active}
                  onChange={() => setArea(a.value)}
                  className="sr-only"
                />
                <span className="font-serif text-lg block">{a.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div>
        <span className={labelCls}>Tipo</span>
        <div className="grid gap-px bg-stone-200 sm:grid-cols-3 lg:grid-cols-5">
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

      {frecuencia !== 'libre' && (
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
                El equipo recibirá un aviso antes de esta hora.
              </p>
            </div>
          )}

          {frecuencia === 'semanal' && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="dia_semana" className={labelCls}>
                  Día de la semana
                </label>
                <select
                  id="dia_semana"
                  name="dia_semana"
                  required
                  defaultValue={task?.dia_semana ?? 3}
                  className={inputCls}
                >
                  {DIAS_SEMANA.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="hora_limite_semanal" className={labelCls}>
                  Hora límite
                </label>
                <input
                  id="hora_limite_semanal"
                  name="hora_limite"
                  type="time"
                  required
                  defaultValue={task?.hora_limite?.slice(0, 5) ?? '17:00'}
                  className={inputCls}
                />
              </div>
              <p className="text-xs text-stone-500 sm:col-span-2">
                Cada semana, ese día, se genera automáticamente la tarea.
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
      )}

      {frecuencia === 'libre' && (
        <div className="border-t border-stone-200 pt-8">
          <p className="text-xs text-stone-500 leading-relaxed">
            Esta tarea no tiene plazo ni recordatorios automáticos. Aparece en
            la lista de pendientes hasta que alguien la marque como hecha.
          </p>
        </div>
      )}

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

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-stone-200">
        <Link
          href={cancelHref}
          className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-900 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          className="bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
