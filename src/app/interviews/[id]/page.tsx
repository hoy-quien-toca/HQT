import { supabase } from '@/lib/supabase';
import InterviewDetailClient from './InterviewDetailClient';

// Forzar renderizado dinámico absoluto
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  console.log("Server side fetch for ID:", id);

  // FETCH EN EL SERVIDOR
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error("Supabase server error:", error);
  }

  return (
    <InterviewDetailClient 
      initialInterview={interview} 
      initialError={error?.message} 
      id={id} 
    />
  );
}
