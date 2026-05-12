import { redirect } from 'next/navigation'

// El registro público está deshabilitado. Las cuentas se gestionan
// desde Supabase Auth o, a futuro, desde /admin/users/new.
export default function SignupPage() {
  redirect('/login')
}
