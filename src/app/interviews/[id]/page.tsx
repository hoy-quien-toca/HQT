import { supabase } from '@/lib/supabase';
import InterviewDetailClient from './InterviewDetailClient';

// Forzar renderizado dinámico absoluto
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // FETCH EN EL SERVIDOR - AHORA FILTRAMOS POR IS_ACTIVE PARA LA PAUSA
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', id)
    .eq('is_active', true) // SI ESTÁ PAUSADA, EL SERVIDOR DEVUELVE NULL
    .maybeSingle();

  return (
    <InterviewDetailClient 
      initialInterview={interview} 
      initialError={error?.message} 
      id={id} 
    />
  );
}
