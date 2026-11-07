-- Script para agregar soporte a roles de Colaborador en Hoy Quien Toca

-- 1. Agregar columnas a la tabla 'events' para registrar quién creó la fecha
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by_email text;

-- 2. (Opcional) Si deseas asignar a un usuario el rol de colaborador mediante metadatos de Supabase Auth:
-- Puedes ejecutar en el Editor SQL de Supabase para convertir un usuario específico en colaborador:
-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "collaborator"}'::jsonb 
-- WHERE email = 'email_del_colaborador@ejemplo.com';

-- 3. (Opcional) Si deseas asegurar que tu usuario siga siendo Super Admin explícitamente:
-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "superadmin"}'::jsonb 
-- WHERE email = 'tu_email_admin@ejemplo.com';
