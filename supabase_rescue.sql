-- Asegurar que la tabla interviews existe y tiene los campos necesarios
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'interviews') THEN
    CREATE TABLE interviews (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      published_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      title text NOT NULL,
      subtitle text,
      band_name text NOT NULL,
      content text NOT NULL,
      image_url text,
      is_active boolean DEFAULT true,
      author text,
      photo_credit text,
      image_position text DEFAULT 'center'
    );
  END IF;
END $$;

-- Habilitar RLS (Seguridad de filas)
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Crear política para que CUALQUIERA pueda leer las entrevistas
DROP POLICY IF EXISTS "Permitir lectura pública de entrevistas" ON interviews;
CREATE POLICY "Permitir lectura pública de entrevistas" ON interviews FOR SELECT USING (true);

-- Crear política para que los administradores puedan insertar/actualizar/borrar
-- (Asumiendo que el usuario está autenticado)
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON interviews;
CREATE POLICY "Permitir todo a usuarios autenticados" ON interviews ALL USING (auth.role() = 'authenticated');
