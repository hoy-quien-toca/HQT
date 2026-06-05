import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import InterviewDetailClient from './InterviewDetailClient';

// Forzar renderizado dinámico absoluto
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const { data: interview } = await supabase
    .from('interviews')
    .select('title, band_name, subtitle, image_url')
    .eq('id', id)
    .single();

  if (!interview) {
    return {
      title: 'Entrevista no encontrada',
    };
  }

  return {
    title: `${interview.band_name}: ${interview.title}`,
    description: interview.subtitle || `Leé la entrevista completa a ${interview.band_name} en Hoy Quien Toca.`,
    openGraph: {
      title: `${interview.band_name}: ${interview.title} | Hoy Quien Toca`,
      description: interview.subtitle || `Leé la entrevista completa a ${interview.band_name}.`,
      images: interview.image_url ? [interview.image_url] : [],
    },
  };
}

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
