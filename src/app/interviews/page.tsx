'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

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

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden bg-zinc-900 font-black">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl text-left">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowLogoModal(true)} className="hover:scale-110 transition-transform cursor-pointer focus:outline-none">
               <Image src="/logo-rojo.jpg" alt="Logo" width={70} height={70} className="border-2 border-white rounded-2xl md:w-[85px] md:h-[85px] shadow-lg shadow-red-600/30" />
            </button>
            <div>
              <h1 className="text-2xl md:text-5xl font-franklin tracking-tighter text-red-600 leading-none uppercase">Hoy Quien Toca</h1>
              <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest mt-1">Descubri recitales en tu Ciudad</p>
            </div>
          </div>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center">
            <Link href="/" className="hover:text-red-600 font-black transition-colors">Fechas</Link>
            <Link href="/interviews" className="text-red-600 underline decoration-2 underline-offset-4 font-black">Entrevistas</Link>
            <Link href="/contact" className="hover:text-red-600 transition-colors font-black">Contacto</Link>
            <Link href="/submit" className="border-2 border-red-600 text-red-600 px-4 py-1 bg-black rounded-full animate-pulse hover:bg-red-600 hover:text-white transition-colors font-black">Subir Fecha</Link>
          </nav>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-red-600 focus:outline-none">
            <svg className="w-8 h-8 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8 md:hidden font-black text-center">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl">X</button>
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl font-franklin text-white italic">Fechas</Link>
          <Link href="/interviews" onClick={() => setIsMenuOpen(false)} className="text-4xl font-franklin text-red-600 italic">Entrevistas</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-4xl font-franklin text-white italic">Contacto</Link>
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl font-franklin border-4 border-red-600 text-red-600 px-8 py-4 rounded-full animate-pulse">Subir Fecha</Link>
        </div>
      )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left font-black">
            {interviews.map((interview) => (
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
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 font-black"
                      style={{ objectPosition: interview.image_position || 'center' }} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-black italic uppercase text-center font-black">Sin Imagen</div>
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
        )}
      </main>

      {/* Logo Modal */}
      {showLogoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-black">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowLogoModal(false)} />
          <div className="relative max-w-lg w-full bg-zinc-900 border-8 border-white p-4 rounded-[50px] shadow-2xl text-center font-black">
            <button onClick={() => setShowLogoModal(false)} className="absolute -top-4 -right-4 bg-red-600 text-white w-12 h-12 font-black text-2xl border-4 border-white rounded-full font-black">X</button>
            <Image src="/logo-rojo.jpg" alt="Logo Grande" width={800} height={800} className="w-full h-auto rounded-[30px] font-black" />
            <h3 className="text-3xl font-franklin text-red-600 mt-4 leading-none font-black">Hoy Quien Toca</h3>
          </div>
        </div>
      )}
    </div>
  );
}
