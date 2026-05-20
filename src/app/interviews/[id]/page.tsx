'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function InterviewDetail() {
  const { id } = useParams();
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchInterview();
  }, [id]);

  async function fetchInterview() {
    setLoading(true);
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setInterview(data);
    }
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen bg-black text-yellow-400 flex items-center justify-center font-black text-4xl animate-pulse uppercase">Cargando Entrevista...</div>;
  
  if (!interview) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-black uppercase italic text-red-600 mb-4 tracking-tighter">404</h1>
      <p className="text-xl font-bold uppercase tracking-widest mb-8">No encontramos la entrevista.</p>
      <Link href="/interviews" className="bg-white text-black font-black uppercase px-8 py-3 hover:bg-yellow-400 transition-colors">Volver</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <header className="border-b-4 border-yellow-400 p-6 flex justify-between items-center bg-zinc-900 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-4">
          <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="border border-white" />
          <h1 className="text-xl md:text-3xl font-black tracking-tighter uppercase italic text-yellow-400">Hoy Quien Toca</h1>
        </Link>
        <Link href="/interviews" className="font-black uppercase tracking-widest text-xs hover:text-yellow-400">← Volver</Link>
      </header>

      <article className="max-w-4xl mx-auto p-6 space-y-8 py-16">
        <div className="space-y-4">
          <span className="bg-red-600 text-white px-4 py-1 text-sm font-black uppercase tracking-widest italic shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            Entrevista: {interview.band_name}
          </span>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tighter">
            {interview.title}
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest border-l-4 border-yellow-400 pl-3">
            Publicado el {new Date(interview.published_at).toLocaleDateString()}
          </p>
        </div>

        {interview.image_url && (
          <div className="border-8 border-white shadow-[12px_12px_0px_0px_rgba(234,179,8,1)] overflow-hidden">
            <img src={interview.image_url} alt={interview.band_name} className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
        )}

        <div className="prose prose-invert max-w-none text-xl leading-relaxed font-medium space-y-6 text-zinc-300">
          {interview.content.split('\n').map((para: string, i: number) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className="pt-16 border-t-4 border-zinc-800 flex justify-between items-center flex-wrap gap-4">
          <p className="text-zinc-500 font-black uppercase text-xs italic">Gracias por leer Hoy Quien Toca</p>
          <div className="flex gap-4">
            <button className="bg-white text-black px-6 py-2 font-black uppercase text-sm hover:bg-yellow-400">Compartir</button>
          </div>
        </div>
      </article>
    </div>
  );
}
