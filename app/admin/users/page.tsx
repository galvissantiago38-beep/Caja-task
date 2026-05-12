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
  eliminar: 'No fue posible eliminar al usuario.',
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

  if (
    sp.rol &&
    ['admin', 'lider', 'cajero', 'visual', 'almacenista'].includes(sp.rol)
  ) {
    query = query.eq('rol', sp.rol)
  }
  if (sp.q && sp.q.trim()) {
    const term = `%${sp.q.trim()}%`
    query = query.or(`nombre.ilike.${term},email.ilike.${term}`)
  }

  const { data: users } = await query.overrideTypes<Profile[], { merge: false }>()
  const lista = users ?? []

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between flex-wrap gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
            Equipo
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 mb-2">Usuarios</h1>
          <p className="text-sm text-stone-600">
            {lista.length === 1 ? '1 usuario' : `${lista.length} usuarios`} en
            el sistema
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
        >
          Nuevo usuario
        </Link>
      </div>

      {sp.ok && (
        <FlashMessage kind="ok" code={sp.ok} messages={OK_MESSAGES} />
      )}
      {sp.error && (
        <FlashMessage kind="error" code={sp.error} messages={ERROR_MESSAGES} />
      )}

      <UserFilterBar />

      {lista.length === 0 ? (
        <EmptyState filtered={!!(sp.q || sp.rol)} />
      ) : (
        <div className="border-t border-stone-200 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left min-w-[560px]">
            <thead>
              <tr className="border-b border-stone-200 text-[10px] uppercase tracking-[0.18em] text-stone-500">
                <th className="py-4 pr-4 font-medium">Usuario</th>
                <th className="py-4 pr-4 font-medium">Rol</th>
                <th className="py-4 pr-4 font-medium text-right">Acciones</th>
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
                    className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="py-5 pr-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 border border-stone-300 flex items-center justify-center font-serif text-lg text-stone-900">
                          {inicial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <p className="text-stone-900 truncate">
                              {u.nombre || 'Sin nombre'}
                            </p>
                            {eresTu && (
                              <span className="text-[9px] uppercase tracking-[0.2em] text-stone-500 border border-stone-300 px-1.5 py-0.5">
                                Tú
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-stone-500 truncate">
                            {u.email ?? '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 pr-4">
                      <RoleBadge rol={u.rol} />
                    </td>
                    <td className="py-5 pr-4">
                      <div className="flex items-center justify-end gap-6">
                        <Link
                          href={`/admin/users/${u.id}/edit`}
                          className="text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
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
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="border-t border-stone-200 pt-20 text-center">
      <h3 className="font-serif text-xl sm:text-2xl text-stone-900 mb-2">
        {filtered ? 'Sin resultados' : 'Aún no hay usuarios'}
      </h3>
      <p className="text-sm text-stone-600 mb-8">
        {filtered
          ? 'Prueba con otra búsqueda o quita los filtros.'
          : 'Crea el primer usuario del equipo.'}
      </p>
      {!filtered && (
        <Link
          href="/admin/users/new"
          className="inline-block bg-stone-900 text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-stone-700 transition-colors"
        >
          Crear usuario
        </Link>
      )}
    </div>
  )
}
