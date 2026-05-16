import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { login } from '../auth/actions'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-md-vanilla dark:bg-[color:var(--background)] px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-14">
          <h1 className="text-[28px] sm:text-[32px] font-light text-md-black dark:text-md-white tracking-[0.06em] mb-4">
            TASKS
          </h1>
          <p className="text-[12px] uppercase tracking-[0.16em] font-light text-md-dark-grey">
            Iniciar sesión
          </p>
        </div>

        <form className="space-y-8">
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] uppercase tracking-[0.16em] font-light text-md-dark-grey mb-3"
            >
              Correo electrónico
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ejemplo@correo.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] uppercase tracking-[0.16em] font-light text-md-dark-grey mb-3"
            >
              Contraseña
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>

          <Button formAction={login} className="w-full mt-6">
            Ingresar
          </Button>
        </form>

        <p className="mt-12 text-center text-[12px] text-md-dark-grey font-light leading-[1.45]">
          Acceso restringido al equipo de la tienda. Si necesitas credenciales,
          pídelas al administrador.
        </p>
      </div>
    </div>
  )
}
