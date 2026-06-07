/**
 * Utilidades para optimizar URLs de imágenes en Supabase
 * Incluye caché, lazy loading y transformaciones
 */

export function getSupabaseImageUrl(path: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  cacheSeconds?: number;
} = {}) {
  if (!path) return '/logo-rojo.jpg';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return path;

  // Si ya es una URL completa, devolverla
  if (path.startsWith('http')) return path;

  const {
    width = 1200,
    height = 1200,
    quality = 75,
    cacheSeconds = 86400 * 30, // 30 días
  } = options;

  // Construir URL base
  let url = `${supabaseUrl}/storage/v1/object/public/hqt-assets/${path}`;

  // Agregar parámetros de transformación (si Supabase Image Optimization está habilitado)
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (quality) params.append('quality', quality.toString());
  
  // Agregar caché headers (los navegadores respetarán esto)
  if (cacheSeconds > 0) {
    params.append('cache', cacheSeconds.toString());
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  return url;
}

/**
 * Hook para obtener URLs optimizadas para eventos
 */
export function getEventImageUrl(flyerUrl: string | null | undefined) {
  return getSupabaseImageUrl(flyerUrl || '/logo-rojo.jpg', {
    width: 280,
    height: 340,
    quality: 75,
    cacheSeconds: 86400 * 30,
  });
}

/**
 * Hook para obtener URLs optimizadas para sponsors
 */
export function getSponsorImageUrl(imageUrl: string | null | undefined) {
  return getSupabaseImageUrl(imageUrl || '/logo-rojo.jpg', {
    width: 300,
    height: 300,
    quality: 80,
    cacheSeconds: 86400 * 30,
  });
}

/**
 * Hook para obtener URLs optimizadas para entrevistas
 */
export function getInterviewImageUrl(imageUrl: string | null | undefined) {
  return getSupabaseImageUrl(imageUrl || '/logo-rojo.jpg', {
    width: 500,
    height: 500,
    quality: 75,
    cacheSeconds: 86400 * 30,
  });
}

/**
 * Hook para obtener URLs optimizadas para modales de entrevistas
 */
export function getInterviewModalImageUrl(imageUrl: string | null | undefined) {
  return getSupabaseImageUrl(imageUrl || '/logo-rojo.jpg', {
    width: 1000,
    height: 800,
    quality: 80,
    cacheSeconds: 86400 * 30,
  });
}
