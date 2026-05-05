import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '../auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verificar si hay un usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si no hay usuario, redirigir al login
  if (!user) {
    redirect('/login')
  }

  // Buscar el perfil del usuario en la tabla profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, rol')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                ¡Hola, {profile?.nombre || 'Usuario'}! 👋
              </h1>
              <p className="text-slate-600 mt-1">
                Bienvenido a Caja Tasks
              </p>
            </div>

            <form>
              <button
                formAction={logout}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        {/* Tarjeta con info del usuario */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Tu información
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 w-32">Nombre:</span>
              <span className="text-slate-900 font-medium">
                {profile?.nombre || 'Sin nombre'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500 w-32">Correo:</span>
              <span className="text-slate-900 font-medium">{user.email}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500 w-32">Rol:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.rol === 'admin'
                    ? 'bg-rose-100 text-rose-700'
                    : profile?.rol === 'lider'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {profile?.rol === 'admin'
                  ? '🛡️ Admin'
                  : profile?.rol === 'lider'
                  ? '👑 Líder'
                  : '🧑‍💼 Cajero'}
              </span>
            </div>
          </div>
        </div>

        {/* Panel de admin (solo admins) */}
        {profile?.rol === 'admin' && (
          <div className="bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold mb-1">
                  🛡️ Panel de administración
                </h2>
                <p className="text-rose-100">
                  Crea usuarios, asigna roles y gestiona el equipo.
                </p>
              </div>
              <Link
                href="/admin"
                className="bg-white text-rose-700 px-4 py-2 rounded-lg font-medium hover:bg-rose-50 transition-colors"
              >
                Ir al panel
              </Link>
            </div>
          </div>
        )}

        {/* Accesos a tareas */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Tareas
          </h2>
          <p className="text-slate-600 mb-4">
            {profile?.rol === 'lider'
              ? 'Gestiona las tareas del equipo: crea nuevas, edita o desactiva las existentes.'
              : profile?.rol === 'admin'
              ? 'Como admin puedes consultarlas. Para crearlas y asignarlas usa una cuenta con rol Líder.'
              : 'Consulta las tareas que tienes asignadas.'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/tasks"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ir a tareas
            </Link>
            {profile?.rol === 'lider' && (
              <Link
                href="/tasks/new"
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                + Nueva tarea
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}