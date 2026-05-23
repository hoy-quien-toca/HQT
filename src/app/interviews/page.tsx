'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

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
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl text-left">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6 font-black">
            <button 
              onClick={() => setShowLogoModal(true)} 
              className="hover:scale-110 transition-transform cursor-pointer focus:outline-none"
            >
               <Image src="/logo-rojo.jpg" alt="Logo Rojo" width={70} height={70} className="border-2 border-white rounded-2xl md:w-[85px] md:h-[85px] shadow-lg shadow-red-600/30" />
            </button>
            <div>
              <h1 className="text-2xl md:text-5xl font-franklin tracking-tighter text-red-600 leading-none">Hoy Quien Toca</h1>
              <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest mt-1">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
            </div>
          </div>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center">
            <Link href="/" className="hover:text-red-600 transition-colors font-black">Fechas</Link>
            <Link href="/interviews" className="text-red-600 underline decoration-2 underline-offset-4 font-black">Entrevistas</Link>
            <Link href="/contact" className="hover:text-red-600 transition-colors font-black">Contacto</Link>
            <Link href="/submit" className="border-2 border-red-600 text-red-600 px-4 py-1 bg-black rounded-full animate-pulse hover:bg-red-600 hover:text-white transition-colors font-black">Subir Fecha</Link>
          </nav>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-red-600">
            <svg className="w-8 h-8 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24 font-black"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8 md:hidden text-center font-black">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl font-black font-black font-black">X</button>
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic font-franklin font-black font-black font-black font-black">Fechas</Link>
          <Link href="/interviews" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-red-600 italic font-franklin font-black font-black font-black font-black">Entrevistas</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic font-franklin font-black font-black font-black font-black">Contacto</Link>
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl uppercase border-4 border-red-600 text-red-600 px-8 py-4 rounded-full animate-pulse font-franklin font-black font-black font-black font-black">Subir Fecha</Link>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-12 relative z-10 font-black">
        <h2 className="text-4xl md:text-6xl font-franklin text-center py-10 border-b-8 border-red-600 text-white leading-none font-black font-black">Entrevistas</h2>

        {loading ? (
          <p className="text-center text-4xl font-franklin animate-pulse text-red-600 uppercase italic font-black font-black">Cargando...</p>
        ) : interviews.length === 0 ? (
          <div className="text-center py-20 font-black">
            <p className="text-3xl font-black uppercase italic text-zinc-600 tracking-tighter font-black font-black">Próximamente nuevas entrevistas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left font-black">
            {interviews.map((interview) => (
              <Link 
                href={`/interviews/${interview.id}`} 
                key={interview.id}
                className="group border-4 border-white p-4 bg-zinc-950/80 hover:border-red-600 transition-all shadow-[8px_8px_0px_0px_rgba(220,38,38,0.3)] rounded-[32px] font-black"
              >
                <div className="aspect-video bg-zinc-800 mb-6 border-2 border-zinc-700 overflow-hidden rounded-2xl font-black">
                  {interview.image_url ? (
                    <img src={interview.image_url} alt={interview.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 font-black font-black" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-black italic uppercase text-center font-black font-black font-black">Sin Imagen</div>
                  )}
                </div>
                <div className="space-y-3 font-black font-black">
                  <span className="bg-red-600 text-white px-3 py-1 text-xs font-black uppercase tracking-widest italic rounded-full font-black">BANDA: {interview.band_name}</span>
                  <h3 className="text-3xl font-franklin leading-none group-hover:text-red-600 transition-colors text-white font-black font-black">{interview.title}</h3>
                  
                  {/* SUBTÍTULO EN MINIATURA */}
                  {interview.subtitle && (
                    <p className="text-zinc-400 text-sm font-bold line-clamp-2 uppercase font-black">{interview.subtitle}</p>
                  )}

                  <div className="flex justify-between items-center text-zinc-500 font-bold text-[10px] uppercase tracking-tighter font-black font-black">
                    <p className="font-black font-black font-black">Publicado: {new Date(interview.published_at).toLocaleDateString()}</p>
                    {interview.author && <p className="text-red-600 font-black font-black font-black">Por: {interview.author}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Logo Modal */}
        {showLogoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-black">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl font-black font-black" onClick={() => setShowLogoModal(false)} />
            <div className="relative max-w-lg w-full bg-zinc-900 border-8 border-white p-4 shadow-[30px_30px_0px_0px_rgba(220,38,38,0.5)] text-center rounded-[50px] transform hover:scale-105 transition-transform duration-500 font-black font-black">
              <button onClick={() => setShowLogoModal(false)} className="absolute -top-4 -right-4 bg-red-600 text-white w-14 h-14 font-black text-3xl border-4 border-white hover:bg-black transition-colors z-[110] text-center flex items-center justify-center shadow-2xl rounded-full font-black font-black font-black font-black font-black">X</button>
              <Image src="/logo-rojo.jpg" alt="Logo Grande" width={800} height={800} className="w-full h-auto rounded-[40px] border-4 border-zinc-800 shadow-2xl font-black font-black font-black font-black" />
              <div className="p-6 font-black font-black">
                <h3 className="text-4xl font-franklin text-red-600 leading-none font-black font-black">Hoy Quien Toca</h3>
                <p className="text-xs font-black uppercase tracking-widest text-white/60 mt-2 italic font-black font-black font-black">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
