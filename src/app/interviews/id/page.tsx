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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

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

  const shareOnWhatsApp = () => {
    const text = `Mira la entrevista que encontre en Hoy Quien Toca: ${interview?.title}\n\nLink: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <div className="min-h-screen bg-black text-red-600 flex items-center justify-center font-franklin text-4xl animate-pulse uppercase italic text-center">Cargando...</div>;
  
  if (!interview) return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6 text-center font-black">
      <h1 className="text-6xl uppercase italic text-red-600 mb-4 tracking-tighter font-franklin">404</h1>
      <p className="text-xl uppercase tracking-widest mb-8 font-black">No encontramos la entrevista.</p>
      <Link href="/interviews" className="bg-white text-black px-8 py-3 hover:bg-red-600 transition-colors uppercase rounded-full font-black">Volver</Link>
    </div>
  );

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden text-left bg-zinc-900">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl font-black">
        <div className="max-w-6xl mx-auto flex justify-between items-center font-black">
          <div className="flex items-center gap-6 font-black">
            {/* LOGO SUPERIOR CLICKABLE */}
            <button 
              onClick={() => setShowLogoModal(true)} 
              className="hover:scale-110 transition-transform cursor-pointer focus:outline-none"
            >
               <Image src="/logo-rojo.jpg" alt="Logo Rojo" width={50} height={50} className="border border-white rounded-xl md:w-[65px] md:h-[65px] shadow-lg shadow-red-600/30 font-black" />
            </button>
            <div>
              <h1 className="text-xl md:text-4xl font-franklin tracking-tighter text-red-600 leading-none font-black font-black">Hoy Quien Toca</h1>
              <p className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-widest mt-1 font-black font-black">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
            </div>
          </div>

          <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center font-black font-black">
             <Link href="/" className="hover:text-red-600 transition-colors font-black">Fechas</Link>
             <Link href="/interviews" className="text-red-600 underline decoration-2 underline-offset-4 font-black">Entrevistas</Link>
             <Link href="/contact" className="hover:text-red-600 transition-colors font-black">Contacto</Link>
             <Link href="/submit" className="border-2 border-red-600 text-red-600 px-4 py-1 bg-black animate-pulse hover:bg-red-600 hover:text-white transition-colors rounded-full font-black font-black">Subir Fecha</Link>
          </nav>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-red-600">
            <svg className="w-8 h-8 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24 font-black"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8 md:hidden text-center font-black">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl font-black font-black">X</button>
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic font-franklin font-black font-black font-black">Fechas</Link>
          <Link href="/interviews" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-red-600 italic font-franklin font-black font-black font-black">Entrevistas</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic font-franklin font-black font-black font-black">Contacto</Link>
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl uppercase border-4 border-red-600 text-red-600 px-8 py-4 rounded-full animate-pulse font-franklin font-black font-black font-black">Subir Fecha</Link>
        </div>
      )}

      <article className="max-w-4xl mx-auto p-6 space-y-8 py-16 relative z-10 font-black">
        <div className="space-y-4 text-center font-black">
          <span className="bg-red-600 text-white px-4 py-1 text-sm font-franklin italic tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-full font-black">
            BANDA: {interview.band_name}
          </span>
          <h1 className="text-4xl md:text-6xl font-franklin tracking-tighter text-white leading-none font-black font-black">
            {interview.title}
          </h1>
          
          {/* SUBTÍTULO EN EL DETALLE */}
          {interview.subtitle && (
            <p className="text-xl md:text-2xl text-zinc-400 font-bold uppercase tracking-tight max-w-2xl mx-auto font-black italic">
              {interview.subtitle}
            </p>
          )}

          <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-4 font-black">
             <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest font-black font-black">
               Publicado el {new Date(interview.published_at).toLocaleDateString()}
             </p>
             {interview.author && (
               <p className="text-red-600 font-franklin uppercase text-xs italic tracking-widest font-black">
                 Por: {interview.author}
               </p>
             )}
          </div>
        </div>

        {interview.image_url && (
          <div className="flex justify-center font-black">
            <div className="border-8 border-white shadow-[12px_12px_0px_0px_rgba(220,38,38,0.3)] overflow-hidden relative group rounded-[40px] max-w-3xl w-full font-black">
              <img src={interview.image_url} alt={interview.band_name} className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700 font-black font-black" />
              {interview.photo_credit && (
                <div className="absolute bottom-4 right-4 bg-black/80 text-white text-[8px] font-black px-3 py-1 uppercase tracking-widest border border-red-600 rounded-full font-black">
                  Foto: {interview.photo_credit}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="prose prose-invert max-w-none text-xl md:text-2xl leading-relaxed font-bold space-y-6 text-zinc-200 uppercase tracking-tight font-black pt-8 font-black">
          {interview.content.split('\n').map((para: string, i: number) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className="pt-16 border-t-4 border-zinc-800 flex flex-col items-center gap-8 font-black font-black">
          <p className="text-zinc-500 font-black uppercase text-xs italic font-black">Gracias por leer Hoy Quien Toca</p>
          <button onClick={shareOnWhatsApp} className="bg-green-600 text-white px-10 py-4 font-black uppercase text-lg hover:bg-white hover:text-green-600 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all rounded-full border-4 border-black italic tracking-tighter font-franklin font-black font-black">Compartir en WhatsApp</button>
        </div>
      </article>

      {/* Logo Modal */}
      {showLogoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-black">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl font-black font-black" onClick={() => setShowLogoModal(false)} />
          <div className="relative max-w-lg w-full bg-zinc-900 border-8 border-white p-4 shadow-[30px_30px_0px_0px_rgba(220,38,38,0.5)] text-center rounded-[50px] transform hover:scale-105 transition-transform duration-500 font-black font-black font-black">
            <button onClick={() => setShowLogoModal(false)} className="absolute -top-4 -right-4 bg-red-600 text-white w-14 h-14 font-black text-3xl border-4 border-white hover:bg-black transition-colors z-[110] text-center flex items-center justify-center shadow-2xl rounded-full font-black font-black font-black">X</button>
            <Image src="/logo-rojo.jpg" alt="Logo Grande" width={800} height={800} className="w-full h-auto rounded-[40px] border-4 border-zinc-800 shadow-2xl font-black font-black font-black" />
            <div className="p-6 font-black font-black font-black">
              <h3 className="text-4xl font-franklin text-red-600 leading-none font-black font-black">Hoy Quien Toca</h3>
              <p className="text-xs font-black uppercase tracking-widest text-white/60 mt-2 italic font-black font-black font-black">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
