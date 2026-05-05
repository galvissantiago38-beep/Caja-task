import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '../_lib/require-admin'
import { deleteUser } from '../actions'
import RoleBadge from '../_components/RoleBadge'
import UserFilterBar from './_components/UserFilterBar'
import DeleteUserButton from './_components/DeleteUserButton'
import FlashMessage from './_components/FlashMessage'

type Profile = {
  id: string
  nombre: string | null
  email: string | null
  rol: string | null
}

const OK_MESSAGES: Record<string, string> = {
  creado: 'Usuario creado correctamente.',
  actualizado: 'Cambios guardados.',
  eliminado: 'Usuario eliminado.',
  _default: 'Listo.',
}

const ERROR_MESSAGES: Record<string, string> = {
  auto: 'No puedes eliminar tu propia cuenta.',
  eliminar:
    'No fue posible eliminar al usuario. Puede tener tareas asignadas u otra restricción.',
  _default: 'Algo salió mal. Intenta de nuevo.',
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; rol?: string; ok?: string; error?: string }>
}) {
  const { user: currentUser } = await requireAdmin()
  const sp = await searchParams

  const admin = createAdminClient()

  let query = admin
    .from('profiles')
    .select('id, nombre, email, rol')
    .order('rol', { ascending: true })
    .order('nombre', { ascending: true })

  if (sp.rol && ['admin', 'lider', 'cajero'].includes(sp.rol)) {
    query = query.eq('rol', sp.rol)
  }
  if (sp.q && sp.q.trim()) {
    const term = `%${sp.q.trim()}%`
    query = query.or(`nombre.ilike.${term},email.ilike.${term}`)
  }

  const { data: users } = await query.overrideTypes<
    Profile[],
    { merge: false }
  >()
  const lista = users ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Usuarios</h2>
          <p className="text-slate-600 mt-1">
            {lista.length === 1
              ? '1 usuario'
              : `${lista.length} usuarios`}{' '}
            en el sistema
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="bg-rose-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5"
        >
          <span>+</span> Nuevo usuario
        </Link>
      </div>

      {sp.ok && (
        <FlashMessage kind="ok" code={sp.ok} messages={OK_MESSAGES} />
      )}
      {sp.error && (
        <FlashMessage kind="error" code={sp.error} messages={ERROR_MESSAGES} />
      )}

      <UserFilterBar />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {lista.length === 0 ? (
          <EmptyState filtered={!!(sp.q || sp.rol)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-5 py-3">
                    Usuario
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-5 py-3">
                    Rol
                  </th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500 px-5 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {lista.map((u) => {
                  const eresTu = u.id === currentUser.id
                  const inicial =
                    (u.nombre ?? u.email ?? '?').charAt(0).toUpperCase()
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-semibold text-slate-700">
                            {inicial}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900 truncate">
                                {u.nombre || 'Sin nombre'}
                              </p>
                              {eresTu && (
                                <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 rounded-full px-2 py-0.5">
                                  Tú
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 truncate">
                              {u.email ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <RoleBadge rol={u.rol} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/admin/users/${u.id}/edit`}
                            className="text-rose-600 hover:text-rose-800 text-sm font-medium"
                          >
                            Editar
                          </Link>
                          <DeleteUserButton
                            action={deleteUser.bind(null, u.id)}
                            nombre={u.nombre || u.email || 'este usuario'}
                            disabled={eresTu}
                            disabledReason={
                              eresTu ? 'No puedes eliminar tu propia cuenta' : undefined
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-4xl mb-3">{filtered ? '🔍' : '👥'}</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        {filtered ? 'Sin resultados' : 'Aún no hay usuarios'}
      </h3>
      <p className="text-slate-500 mb-5">
        {filtered
          ? 'Prueba con otra búsqueda o quita los filtros.'
          : 'Crea el primer usuario del equipo.'}
      </p>
      {!filtered && (
        <Link
          href="/admin/users/new"
          className="inline-block bg-rose-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-700 transition-colors"
        >
          + Crear usuario
        </Link>
      )}
    </div>
  )
}
