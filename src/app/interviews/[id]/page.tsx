import { supabase } from '@/lib/supabase';
import InterviewDetailClient from './InterviewDetailClient';

// Forzar renderizado dinámico absoluto para evitar cachés viejos
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const rawId = resolvedParams.id;
  
  // Limpiar ID por si el navegador manda basura
  const id = rawId ? decodeURIComponent(rawId).trim() : '';

  console.log("Server side fetch for ID:", id);

  // FETCH EN EL SERVIDOR (CAPA 1)
  let interview = null;
  let serverError = null;

  try {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .maybeSingle();
      
    interview = data;
    serverError = error?.message;
  } catch (e: any) {
    serverError = e.message;
  }

  return (
    <InterviewDetailClient 
      initialInterview={interview} 
      initialError={serverError} 
      id={id} 
    />
  );
}
