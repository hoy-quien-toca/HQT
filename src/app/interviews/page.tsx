'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  async function fetchInterviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('is_active', true) // Solo entrevistas activas
      .order('published_at', { ascending: false });

    if (!error && data) {
      setInterviews(data);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
        <Image src="/logo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" />
      </div>

      <header className="border-b-4 border-yellow-400 p-6 flex justify-between items-center bg-zinc-950 sticky top-0 z-50 shadow-xl">
        <Link href="/" className="flex items-center gap-4">
          <Image src="/logo.jpg" alt="Logo" width={50} height={50} className="border-2 border-white" />
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic text-yellow-400">Hoy Quien Toca</h1>
        </Link>
        <nav className="flex gap-6 font-bold uppercase tracking-widest text-xs">
          <Link href="/" className="hover:text-yellow-400">Fechas</Link>
          <Link href="/interviews" className="hover:text-yellow-400 underline decoration-2 text-yellow-400">Entrevistas</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-12 relative z-10">
        <h2 className="text-6xl font-black uppercase italic tracking-tighter text-center py-10 border-b-8 border-white">Entrevistas</h2>

        {loading ? (
          <p className="text-center text-4xl font-black animate-pulse text-yellow-400 uppercase italic">Cargando...</p>
        ) : interviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl font-black uppercase italic text-zinc-600 tracking-tighter">Próximamente nuevas entrevistas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
            {interviews.map((interview) => (
              <Link 
                href={`/interviews/${interview.id}`} 
                key={interview.id}
                className="group border-4 border-white p-4 bg-zinc-950/80 hover:bg-zinc-900 transition-colors shadow-[8px_8px_0px_0px_rgba(234,179,8,1)]"
              >
                <div className="aspect-video bg-zinc-800 mb-6 border-2 border-zinc-700 overflow-hidden">
                  {interview.image_url ? (
                    <img src={interview.image_url} alt={interview.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-black italic uppercase">Sin Imagen</div>
                  )}
                </div>
                <div className="space-y-3">
                  <span className="bg-yellow-400 text-black px-3 py-1 text-xs font-black uppercase tracking-widest italic">{interview.band_name}</span>
                  <h3 className="text-3xl font-black uppercase leading-none group-hover:text-yellow-400 transition-colors">{interview.title}</h3>
                  <div className="flex justify-between items-center text-zinc-500 font-bold text-[10px] uppercase tracking-tighter">
                    <p>Publicado: {new Date(interview.published_at).toLocaleDateString()}</p>
                    {interview.author && <p>Por: {interview.author}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
