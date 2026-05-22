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
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden bg-zinc-900">
      {/* Watermark Roja */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl text-left">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/logo-rojo.jpg" alt="Logo Rojo" width={50} height={50} className="border-2 border-white rounded-2xl md:w-[60px] md:h-[60px]" />
            <div>
              <h1 className="text-2xl md:text-5xl font-black tracking-tighter uppercase italic text-red-600 leading-none">Hoy Quien Toca</h1>
              <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest mt-1">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
            </div>
          </div>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center">
            <Link href="/" className="hover:text-red-600">Fechas</Link>
            <Link href="/interviews" className="text-red-600 underline decoration-2 underline-offset-4 font-black">Entrevistas</Link>
            <Link href="/contact" className="hover:text-red-600">Contacto</Link>
            <Link href="/submit" className="border-2 border-red-600 text-red-600 px-4 py-1 bg-black rounded-full animate-pulse hover:bg-red-600 hover:text-white transition-colors">Subir Fecha</Link>
          </nav>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-red-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8 md:hidden text-center font-black">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl">X</button>
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic">Fechas</Link>
          <Link href="/interviews" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-red-600 italic">Entrevistas</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic">Contacto</Link>
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl uppercase border-4 border-red-600 text-red-600 px-8 py-4 rounded-full animate-pulse">Subir Fecha</Link>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-12 relative z-10">
        <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-center py-10 border-b-8 border-red-600 text-white leading-none">Entrevistas</h2>

        {loading ? (
          <p className="text-center text-4xl font-black animate-pulse text-red-600 uppercase italic">Cargando...</p>
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
                className="group border-4 border-white p-4 bg-zinc-950/80 hover:border-red-600 transition-all shadow-[8px_8px_0px_0px_rgba(220,38,38,0.3)] rounded-[32px]"
              >
                <div className="aspect-video bg-zinc-800 mb-6 border-2 border-zinc-700 overflow-hidden rounded-2xl">
                  {interview.image_url ? (
                    <img src={interview.image_url} alt={interview.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-black italic uppercase text-center">Sin Imagen</div>
                  )}
                </div>
                <div className="space-y-3">
                  <span className="bg-red-600 text-white px-3 py-1 text-xs font-black uppercase tracking-widest italic rounded-full">BANDA: {interview.band_name}</span>
                  <h3 className="text-3xl font-black uppercase leading-none group-hover:text-red-600 transition-colors">{interview.title}</h3>
                  <div className="flex justify-between items-center text-zinc-500 font-bold text-[10px] uppercase tracking-tighter">
                    <p>Publicado: {new Date(interview.published_at).toLocaleDateString()}</p>
                    {interview.author && <p className="text-red-600">Por: {interview.author}</p>}
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
