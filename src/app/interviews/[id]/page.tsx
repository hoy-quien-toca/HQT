import { supabase } from '@/lib/supabase';
import InterviewDetailClient from './InterviewDetailClient';

// Forzar renderizado dinamico para que siempre busque los datos frescos
export const dynamic = 'force-dynamic';

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // FETCH EN EL SERVIDOR: Esto evita problemas con el navegador movil
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return (
    <InterviewDetailClient 
      initialInterview={interview} 
      initialError={error?.message} 
      id={id} 
    />
  );
}
