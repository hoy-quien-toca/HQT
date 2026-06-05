import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://hoyquientoca.com';

  // Rutas estáticas
  const routes = [
    '',
    '/interviews',
    '/contact',
    '/submit',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Rutas dinámicas de entrevistas
  try {
    const { data: interviews } = await supabase
      .from('interviews')
      .select('id, published_at')
      .eq('is_active', true);

    const interviewRoutes = (interviews || []).map((interview) => ({
      url: `${baseUrl}/interviews/${interview.id}`,
      lastModified: new Date(interview.published_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...routes, ...interviewRoutes];
  } catch (error) {
    console.error('Error generating sitemap interviews:', error);
    return routes;
  }
}
