'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InterviewDetailClient({ 
  initialInterview, 
  initialError, 
  id 
}: { 
  initialInterview: any, 
  initialError: string | undefined, 
  id: string 
}) {
  const router = useRouter();
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const shareOnWhatsApp = () => {
    const text = `Mira la entrevista que encontre en Hoy Quien Toca: ${initialInterview?.title}\n\nLink: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Si no hay entrevista (404)
  if (!initialInterview) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6 text-center font-black">
        <h1 className="text-6xl uppercase italic text-red-600 mb-4 tracking-tighter font-franklin">404</h1>
        <p className="text-xl uppercase tracking-widest mb-8">{initialError || "No encontramos la entrevista."}</p>
        <div className="bg-black/40 p-4 rounded-xl text-[10px] text-zinc-600 font-mono mb-8">
           DEBUG: ID {id} | SERVER_STATUS: FAIL
        </div>
        <Link href="/interviews" className="bg-white text-black px-8 py-3 rounded-full font-black uppercase text-sm">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden text-left bg-zinc-900">
      {/* Fondo Agua */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowLogoModal(true)} className="hover:scale-110 transition-transform cursor-pointer focus:outline-none">
               <Image src="/logo-rojo.jpg" alt="Logo" width={50} height={50} className="border border-white rounded-xl shadow-lg" />
            </button>
            <div>
              <h1 className="text-xl md:text-4xl font-franklin tracking-tighter text-red-600 leading-none">Hoy Quien Toca</h1>
              <p className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-widest mt-1">Descubri recitales en tu Ciudad</p>
            </div>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-red-600 focus:outline-none">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
            </svg>
          </button>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase text-sm items-center">
            <Link href="/" className="hover:text-red-600 transition-colors font-black">Fechas</Link>
            <Link href="/interviews" className="text-red-600 underline underline-offset-4 font-black">Entrevistas</Link>
            <Link href="/contact" className="hover:text-red-600 transition-colors font-black">Contacto</Link>
          </nav>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8 md:hidden font-black">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl">X</button>
          <Link href="/" className="text-4xl uppercase text-white italic font-franklin">Fechas</Link>
          <Link href="/interviews" className="text-4xl uppercase text-red-600 italic font-franklin">Entrevistas</Link>
          <Link href="/contact" className="text-4xl uppercase text-white italic font-franklin">Contacto</Link>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-4 md:p-6 py-10 relative z-10 font-black">
        {/* BOTON VOLVER X GIGANTE */}
        <button 
          onClick={() => router.push('/interviews')}
          className="fixed bottom-6 right-6 md:absolute md:top-4 md:right-4 bg-red-600 text-white w-14 h-14 md:w-16 md:h-16 flex items-center justify-center font-black text-3xl border-4 border-white rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] z-[60]"
        >
          X
        </button>

        <article className="space-y-8">
          <div className="text-center space-y-4 font-black">
            <span className="bg-red-600 text-white px-4 py-1 text-xs md:text-sm font-franklin italic rounded-full inline-block">BANDA: {initialInterview.band_name}</span>
            <h1 className="text-4xl md:text-7xl font-franklin tracking-tighter text-white leading-none break-words uppercase">{initialInterview.title}</h1>
            {initialInterview.subtitle && <p className="text-xl md:text-3xl text-zinc-400 font-bold uppercase italic mt-4">{initialInterview.subtitle}</p>}
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-6 text-zinc-500 font-bold uppercase text-[10px] md:text-xs">
               <p>Publicado: {new Date(initialInterview.published_at).toLocaleDateString()}</p>
               {initialInterview.author && <p className="text-red-600 italic">Por: {initialInterview.author}</p>}
            </div>
          </div>

          {initialInterview.image_url && (
            <div className="flex justify-center px-1">
              <div className="border-4 md:border-8 border-white shadow-xl overflow-hidden relative group rounded-[24px] md:rounded-[40px] w-full max-w-3xl">
                <img 
                  src={initialInterview.image_url} 
                  alt={initialInterview.band_name} 
                  className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700 block"
                  style={{ objectPosition: initialInterview.image_position || 'center' }} 
                />
                {initialInterview.photo_credit && <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[8px] font-black px-2 py-1 uppercase rounded-full">Foto: {initialInterview.photo_credit}</div>}
              </div>
            </div>
          )}

          <div className="max-w-none text-lg md:text-2xl leading-relaxed font-bold space-y-6 text-zinc-200 uppercase tracking-tight pt-8 whitespace-pre-wrap px-1 font-black">
            {initialInterview.content}
          </div>

          <div className="pt-16 border-t-4 border-zinc-800 flex flex-col items-center gap-8 pb-32">
            <p className="text-zinc-500 uppercase text-xs italic">Gracias por leer Hoy Quien Toca</p>
            <button onClick={shareOnWhatsApp} className="bg-green-600 text-white px-10 py-4 font-black uppercase text-lg hover:bg-white hover:text-green-600 shadow-xl rounded-full border-4 border-black italic font-franklin">Compartir en WhatsApp</button>
          </div>
        </article>
      </main>

      {showLogoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowLogoModal(false)} />
          <div className="relative max-w-lg w-full bg-zinc-900 border-8 border-white p-6 rounded-[50px] shadow-2xl text-center font-black">
            <button onClick={() => setShowLogoModal(false)} className="absolute -top-4 -right-4 bg-red-600 text-white w-12 h-12 font-black text-2xl border-4 border-white rounded-full">X</button>
            <Image src="/logo-rojo.jpg" alt="Logo Grande" width={600} height={600} className="w-full h-auto rounded-[30px]" />
            <h3 className="text-3xl font-franklin text-red-600 mt-4 leading-none">Hoy Quien Toca</h3>
          </div>
        </div>
      )}
    </div>
  );
}
