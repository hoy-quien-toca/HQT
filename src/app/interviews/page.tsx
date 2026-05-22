'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchInterviews();
  }, []);

  async function fetchInterviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('is_active', true) 
      .order('published_at', { ascending: false });

    if (!error && data) {
      setInterviews(data);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
        <Image src="/logo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-yellow-400 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl text-left">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="Logo" width={50} height={50} className="border-2 border-white md:w-[60px] md:h-[60px]" />
            <div>
              <h1 className="text-2xl md:text-5xl font-black tracking-tighter uppercase italic text-yellow-400 leading-none">Hoy Quien Toca</h1>
              <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest mt-1">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
            </div>
          </div>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center">
            <Link href="/" className="hover:text-yellow-400">Fechas</Link>
            <Link href="/interviews" className="hover:text-yellow-400 underline decoration-2 underline-offset-4 text-yellow-400">Entrevistas</Link>
            <Link href="/contact" className="hover:text-yellow-400">Contacto</Link>
            <Link href="/submit" className="border-2 border-yellow-400 text-yellow-400 px-4 py-1 bg-black animate-[pulse_2s_infinite] hover:bg-yellow-400 hover:text-black transition-colors">Subir Fecha</Link>
          </nav>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-yellow-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8 md:hidden text-center font-black">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl">X</button>
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic">Fechas</Link>
          <Link href="/interviews" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-yellow-400 italic">Entrevistas</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic">Contacto</Link>
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl uppercase border-4 border-yellow-400 text-yellow-400 px-8 py-4 animate-pulse">Subir Fecha</Link>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-12 relative z-10">
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
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-black italic uppercase text-center">Sin Imagen</div>
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
