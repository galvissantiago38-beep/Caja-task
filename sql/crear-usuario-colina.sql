-- =====================================================================
-- Asignar a la cuenta de Colina su tienda + rol admin
-- =====================================================================
-- PRE-REQUISITO: primero crea la cuenta de Auth en Supabase:
--   1. Supabase Dashboard > Authentication > Users > Add user > Create new user
--   2. Email:     mdutti.colina@tendenzanova.com.co
--   3. Password:  MdColina2026-Tendenza!   (o la que prefieras)
--   4. Marcar:    Auto Confirm User
--   5. Click "Create user"
-- Después de eso, vuelve al SQL Editor y ejecuta este bloque.
-- =====================================================================

WITH usuario_colina AS (
  SELECT id, email
  FROM auth.users
  WHERE email = 'mdutti.colina@tendenzanova.com.co'
  LIMIT 1
)
INSERT INTO public.profiles (id, email, nombre, rol, tienda)
SELECT
  id,
  email,
  'Massimo Dutti · Colina',
  'admin',
  'colina'
FROM usuario_colina
ON CONFLICT (id) DO UPDATE
  SET nombre  = EXCLUDED.nombre,
      rol     = EXCLUDED.rol,
      tienda  = EXCLUDED.tienda;

-- Verificar:
SELECT id, email, nombre, rol, tienda
FROM public.profiles
WHERE email = 'mdutti.colina@tendenzanova.com.co';
