'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [visibleInterviewsCount, setVisibleInterviewsCount] = useState(6);

  useEffect(() => {
    fetchInterviews();
  }, []);

  async function fetchInterviews() {
    try {
      setLoading(true);
      setErrorMsg("");
      
      // RESTAURADO: Ahora solo carga las que NO están pausadas
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('is_active', true) 
        .order('published_at', { ascending: false });

      if (error) {
        setErrorMsg("Error de base de datos: " + error.message);
      } else {
        setInterviews(data || []);
      }
    } catch (e: any) {
      setErrorMsg("Error de conexión: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // reset pagination when interviews list updates
    setVisibleInterviewsCount(6);
  }, [interviews]);

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-clip bg-zinc-900 font-black text-left">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-[100] shadow-xl text-left">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:scale-110 transition-transform cursor-pointer focus:outline-none shrink-0">
               <Image src="/logo-rojo.jpg" alt="Logo" width={80} height={80} className="border-2 border-white rounded-2xl md:w-[100px] md:h-[100px] shadow-[0_0_30px_rgba(220,38,38,0.35)] shadow-red-600/40" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-5xl font-franklin tracking-tighter text-red-600 leading-none">Hoy Quien Toca</h1>
              <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest mt-1">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
              {/* Navegación rápida móvil */}
              <div className="flex md:hidden gap-2 mt-3 flex-wrap">
                <Link href="/" className="text-[8px] font-black bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-full uppercase text-white">Fechas</Link>
                <Link href="/contact" className="text-[8px] font-black bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-full uppercase text-white">Contacto</Link>
                <Link href="/submit" className="text-[8px] font-black bg-red-600 text-white px-2 py-1 rounded-full uppercase animate-pulse border border-white/20">Subir Fecha</Link>
              </div>
            </div>
          </div>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center">
            <Link href="/" className="hover:text-red-600 font-black transition-colors">Fechas</Link>
            <Link href="/interviews" className="text-red-600 underline decoration-2 underline-offset-4 font-black">Entrevistas</Link>
            <Link href="/contact" className="hover:text-red-600 transition-colors font-black">Contacto</Link>
            <Link href="/submit" className="border-2 border-red-600 text-red-600 px-4 py-1 bg-black rounded-full animate-pulse hover:bg-red-600 hover:text-white transition-colors font-black">Subir Fecha</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-12 relative z-10">
        <h2 className="text-4xl md:text-6xl font-franklin text-center py-10 border-b-8 border-red-600 text-white leading-none uppercase">Entrevistas</h2>

        {loading ? (
          <div className="flex flex-col items-center py-20 animate-pulse font-black">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-2xl font-franklin uppercase italic">Cargando...</p>
          </div>
        ) : errorMsg ? (
          <div className="text-center py-20 bg-red-600/20 border-4 border-red-600 rounded-[40px] p-10 font-black">
            <p className="text-2xl font-black uppercase mb-4">{errorMsg}</p>
            <button onClick={fetchInterviews} className="bg-white text-black px-8 py-3 rounded-full font-black uppercase border-4 border-black">Reintentar</button>
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-20 font-black">
            <p className="text-3xl font-black uppercase italic text-zinc-600 tracking-tighter font-black">No hay entrevistas publicadas aún.</p>
          </div>
) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left font-black">
            {interviews.slice(0, visibleInterviewsCount).map((interview) => (
              <Link
                href={`/interviews/${interview.id}`}
                key={interview.id}
                className="group border-4 border-white p-4 bg-zinc-950/80 hover:border-red-600 transition-all shadow-[8px_8px_0px_0px_rgba(220,38,38,0.3)] rounded-[32px] block font-black"
              >
                <div className="aspect-video bg-zinc-800 mb-6 border-2 border-zinc-700 overflow-hidden rounded-2xl relative font-black">
                  {interview.image_url ? (
                    <img
                      src={interview.image_url}
                      alt={interview.title}
                      className="absolute inset-0 w-full h-full object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-500"
                      style={{ objectPosition: 'center' }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-black italic uppercase text-center">Sin Imagen</div>
                  )}
                </div>
                <div className="space-y-3 font-black">
                  <span className="bg-red-600 text-white px-3 py-1 text-xs font-black uppercase tracking-widest italic rounded-full font-black">BANDA: {interview.band_name}</span>
                  <h3 className="text-3xl font-franklin leading-none group-hover:text-red-600 transition-colors text-white uppercase font-black">{interview.title}</h3>
                  {interview.subtitle && (
                    <p className="text-zinc-400 text-sm font-bold line-clamp-2 uppercase italic font-black">{interview.subtitle}</p>
                  )}
                  <div className="flex justify-between items-center text-zinc-500 font-bold text-[10px] uppercase tracking-tighter font-black">
                    <p className="font-black">Publicado: {new Date(interview.published_at).toLocaleDateString()}</p>
                    {interview.author && <p className="text-red-600 font-black">Por: {interview.author}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {interviews.length > visibleInterviewsCount && (
            <div className="w-full text-center pt-8">
              <button
                onClick={() => setVisibleInterviewsCount((v) => v + 6)}
                className="inline-flex items-center justify-center w-full max-w-xs mx-auto bg-red-600 text-white uppercase text-xs font-black px-4 py-3 rounded-full border-2 border-white hover:bg-red-500 transition-colors"
              >
                Cargar más ({interviews.length - visibleInterviewsCount})
              </button>
            </div>
          )}

          {interviews.length > 0 && interviews.length <= visibleInterviewsCount && (
            <div className="w-full text-center pt-8 text-red-500 text-xs uppercase tracking-widest font-black">
              PROXIMAMENTE MÁS ENTREVISTAS
            </div>
    )}
          </>
        )}
      </main>
    </div>
  );
}
