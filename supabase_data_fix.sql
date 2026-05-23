-- Insertar una entrevista de prueba si no hay ninguna
INSERT INTO interviews (title, subtitle, band_name, content, image_url, is_active, author)
SELECT 'Entrevista de Prueba', 'Esta es una entrevista para verificar el sistema', 'Banda Prueba', 'Contenido de prueba para la entrevista.', 'https://tacyoyfikjamuvcllonj.supabase.co/storage/v1/object/public/hqt-assets/logo-rojo.jpg', true, 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM interviews LIMIT 1);

-- Asegurar que todas las existentes sean activas para descartar problemas de filtro
UPDATE interviews SET is_active = true WHERE is_active IS NULL;
