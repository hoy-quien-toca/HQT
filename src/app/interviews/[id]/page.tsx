import { supabase } from '@/lib/supabase';
import InterviewDetailClient from './InterviewDetailClient';

// Forzar renderizado dinámico absoluto
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Sanitizar ID
  const cleanId = id?.trim();

  console.log("Server side fetch for ID:", cleanId);

  // FETCH EN EL SERVIDOR
  let interview = null;
  let serverError = null;

  try {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', cleanId)
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
      id={cleanId} 
    />
  );
}
