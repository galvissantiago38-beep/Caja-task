-- =====================================================================
-- Migración multi-tenant: una app, varias tiendas, una cuenta por tienda
-- =====================================================================
-- Idempotente: se puede correr más de una vez sin romper nada.
-- Pegar TODO el bloque en Supabase SQL Editor y ejecutar.
-- =====================================================================

-- 1) Tabla de tiendas (catálogo) -------------------------------------
CREATE TABLE IF NOT EXISTS public.tiendas (
  slug                  TEXT PRIMARY KEY,
  nombre                TEXT NOT NULL,
  correo_notificaciones  TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed inicial (Calle 82 + Colina). UPSERT para no duplicar.
INSERT INTO public.tiendas (slug, nombre, correo_notificaciones) VALUES
  ('calle82', 'Massimo Dutti · Calle 82', 'mdutti.calle82@tendenzanova.com.co'),
  ('colina',  'Massimo Dutti · Colina',   'mdutti.colina@tendenzanova.com.co')
ON CONFLICT (slug) DO UPDATE
  SET nombre = EXCLUDED.nombre,
      correo_notificaciones = EXCLUDED.correo_notificaciones;

-- 2) Columna `tienda` en profiles, tasks, notes, task_instances -----
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tienda TEXT;
UPDATE public.profiles SET tienda = 'calle82' WHERE tienda IS NULL;
ALTER TABLE public.profiles ALTER COLUMN tienda SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_tienda_fk FOREIGN KEY (tienda)
    REFERENCES public.tiendas(slug) ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS tienda TEXT;
UPDATE public.tasks SET tienda = 'calle82' WHERE tienda IS NULL;
ALTER TABLE public.tasks ALTER COLUMN tienda SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_tienda_fk FOREIGN KEY (tienda)
    REFERENCES public.tiendas(slug) ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS tienda TEXT;
UPDATE public.notes SET tienda = 'calle82' WHERE tienda IS NULL;
ALTER TABLE public.notes ALTER COLUMN tienda SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE public.notes
    ADD CONSTRAINT notes_tienda_fk FOREIGN KEY (tienda)
    REFERENCES public.tiendas(slug) ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.task_instances
  ADD COLUMN IF NOT EXISTS tienda TEXT;
UPDATE public.task_instances ti
  SET tienda = (SELECT tienda FROM public.tasks WHERE id = ti.task_id)
  WHERE tienda IS NULL;
ALTER TABLE public.task_instances ALTER COLUMN tienda SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE public.task_instances
    ADD CONSTRAINT task_instances_tienda_fk FOREIGN KEY (tienda)
    REFERENCES public.tiendas(slug) ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Helper: tienda del usuario autenticado --------------------------
CREATE OR REPLACE FUNCTION public.current_tienda()
RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tienda FROM public.profiles WHERE id = auth.uid()
$$;

-- 4) Triggers: auto-stampar tienda en inserts ------------------------
CREATE OR REPLACE FUNCTION public.stamp_tienda_from_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tienda IS NULL THEN
    NEW.tienda := public.current_tienda();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_stamp_tienda ON public.tasks;
CREATE TRIGGER tasks_stamp_tienda
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.stamp_tienda_from_user();

DROP TRIGGER IF EXISTS notes_stamp_tienda ON public.notes;
CREATE TRIGGER notes_stamp_tienda
  BEFORE INSERT ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.stamp_tienda_from_user();

CREATE OR REPLACE FUNCTION public.stamp_tienda_from_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tienda IS NULL THEN
    SELECT t.tienda INTO NEW.tienda FROM public.tasks t WHERE t.id = NEW.task_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_instances_stamp_tienda ON public.task_instances;
CREATE TRIGGER task_instances_stamp_tienda
  BEFORE INSERT ON public.task_instances
  FOR EACH ROW EXECUTE FUNCTION public.stamp_tienda_from_task();

-- 5) RLS por tienda --------------------------------------------------
-- TASKS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_select_tienda"  ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_tienda"  ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_tienda"  ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_tienda"  ON public.tasks;
CREATE POLICY "tasks_select_tienda" ON public.tasks
  FOR SELECT TO authenticated
  USING (tienda = public.current_tienda());
CREATE POLICY "tasks_insert_tienda" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (tienda = public.current_tienda() OR tienda IS NULL);
CREATE POLICY "tasks_update_tienda" ON public.tasks
  FOR UPDATE TO authenticated
  USING (tienda = public.current_tienda())
  WITH CHECK (tienda = public.current_tienda());
CREATE POLICY "tasks_delete_tienda" ON public.tasks
  FOR DELETE TO authenticated
  USING (tienda = public.current_tienda());

-- TASK_INSTANCES
ALTER TABLE public.task_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ti_select_tienda" ON public.task_instances;
DROP POLICY IF EXISTS "ti_insert_tienda" ON public.task_instances;
DROP POLICY IF EXISTS "ti_update_tienda" ON public.task_instances;
DROP POLICY IF EXISTS "ti_delete_tienda" ON public.task_instances;
CREATE POLICY "ti_select_tienda" ON public.task_instances
  FOR SELECT TO authenticated
  USING (tienda = public.current_tienda());
CREATE POLICY "ti_insert_tienda" ON public.task_instances
  FOR INSERT TO authenticated
  WITH CHECK (tienda = public.current_tienda() OR tienda IS NULL);
CREATE POLICY "ti_update_tienda" ON public.task_instances
  FOR UPDATE TO authenticated
  USING (tienda = public.current_tienda())
  WITH CHECK (tienda = public.current_tienda());
CREATE POLICY "ti_delete_tienda" ON public.task_instances
  FOR DELETE TO authenticated
  USING (tienda = public.current_tienda());

-- NOTES
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notes_select_tienda" ON public.notes;
DROP POLICY IF EXISTS "notes_insert_tienda" ON public.notes;
DROP POLICY IF EXISTS "notes_update_tienda" ON public.notes;
DROP POLICY IF EXISTS "notes_delete_tienda" ON public.notes;
CREATE POLICY "notes_select_tienda" ON public.notes
  FOR SELECT TO authenticated
  USING (tienda = public.current_tienda());
CREATE POLICY "notes_insert_tienda" ON public.notes
  FOR INSERT TO authenticated
  WITH CHECK (tienda = public.current_tienda() OR tienda IS NULL);
CREATE POLICY "notes_update_tienda" ON public.notes
  FOR UPDATE TO authenticated
  USING (tienda = public.current_tienda())
  WITH CHECK (tienda = public.current_tienda());
CREATE POLICY "notes_delete_tienda" ON public.notes
  FOR DELETE TO authenticated
  USING (tienda = public.current_tienda());

-- PROFILES: cada cuenta solo ve y edita su propio perfil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- TIENDAS: lectura para usuarios autenticados (necesario para mostrar nombre)
ALTER TABLE public.tiendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tiendas_select_all" ON public.tiendas;
CREATE POLICY "tiendas_select_all" ON public.tiendas
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================================
-- LISTO. Tu cuenta actual quedó asignada a 'calle82'.
-- Para crear la cuenta de Colina, ve a Authentication > Users en Supabase
-- y luego corre el SQL `crear-usuario-colina.sql` con su user_id.
-- =====================================================================
