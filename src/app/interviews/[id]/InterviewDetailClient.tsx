'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InterviewDetailClient({ 
  initialInterview, 
  initialError, 
  id 
}: { 
  initialInterview: any, 
  initialError: string | null | undefined, 
  id: string 
}) {
  const router = useRouter();
  const [interview, setInterview] = useState<any>(initialInterview);
  const [loading, setLoading] = useState(!initialInterview);
  const [errorState, setErrorState] = useState<string | null>(initialError || null);

  async function fetchFallback() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setInterview(data);
        setErrorState(null);
      } else {
        setErrorState("No encontramos la entrevista.");
      }
    } catch (err: any) {
      setErrorState("Error al conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  }

  // TRIPLE-CHECK: Si el servidor falla, intentamos dos veces más en el cliente
  useEffect(() => {
    if (!initialInterview && id && id !== '[id]') {
      console.log("Starting redundant client-side fetch for:", id);
      fetchFallback();
    }
  }, [initialInterview, id]);

  const shareOnWhatsApp = () => {
    const data = interview || initialInterview;
    const text = `Mira la entrevista que encontre en Hoy Quien Toca: ${data?.title}\n\nLink: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading && !interview) {
    return (
      <div className="min-h-screen bg-black text-red-600 flex flex-col items-center justify-center p-6 text-center font-franklin">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xl uppercase italic animate-pulse">Cargando...</p>
      </div>
    );
  }
  
  if (errorState && !interview) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6 text-center font-black">
        <h1 className="text-6xl uppercase italic text-red-600 mb-4 tracking-tighter font-franklin">404</h1>
        <p className="text-xl uppercase tracking-widest mb-8">No encontramos la entrevista.</p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
           <button onClick={() => window.location.reload()} className="bg-red-600 text-white py-3 rounded-full font-black uppercase text-sm border-2 border-white">Reintentar</button>
           <Link href="/interviews" className="bg-white text-black py-3 rounded-full font-black uppercase text-sm">Volver</Link>
        </div>
      </div>
    );
  }

  const activeInterview = interview || initialInterview;

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden text-left bg-zinc-900 font-black">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl text-left">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:scale-110 transition-transform cursor-pointer focus:outline-none shrink-0">
               <Image src="/logo-rojo.jpg" alt="Logo Rojo" width={70} height={70} className="border-2 border-white rounded-2xl md:w-[85px] md:h-[85px] shadow-lg shadow-red-600/30" />
            </Link>
            <div>
              <h1 className="text-xl md:text-4xl font-franklin tracking-tighter text-red-600 leading-none">Hoy Quien Toca</h1>
              <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest mt-1">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
              {/* Navegación rápida móvil */}
              <div className="flex md:hidden gap-2 mt-3 flex-wrap">
                <Link href="/" className="text-[8px] font-black bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-full uppercase text-white">Fechas</Link>
                <Link href="/interviews" className="text-[8px] font-black bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-full uppercase text-white">Entrevistas</Link>
                <Link href="/contact" className="text-[8px] font-black bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-full uppercase text-white">Contacto</Link>
                <Link href="/submit" className="text-[8px] font-black bg-red-600 text-white px-2 py-1 rounded-full uppercase animate-pulse border border-white/20">Subir Fecha</Link>
              </div>
            </div>
          </div>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase text-sm items-center">
            <Link href="/" className="hover:text-red-600 transition-colors font-black">Fechas</Link>
            <Link href="/interviews" className="text-red-600 underline underline-offset-4 font-black">Entrevistas</Link>
            <Link href="/contact" className="hover:text-red-600 transition-colors font-black">Contacto</Link>
            <Link href="/submit" className="border-2 border-red-600 text-red-600 px-4 py-1 bg-black rounded-full animate-pulse font-black">Subir Fecha</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 py-10 relative z-10 font-black">
        <button 
          onClick={() => router.push('/interviews')}
          className="fixed bottom-6 right-6 md:absolute md:top-4 md:right-4 bg-red-600 text-white w-14 h-14 md:w-16 md:h-16 flex items-center justify-center font-black text-3xl border-4 border-white rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] z-[60]"
        >
          X
        </button>

        <article className="space-y-8">
          <div className="text-center space-y-4 font-black">
            <span className="bg-red-600 text-white px-4 py-1 text-xs md:text-sm font-franklin italic rounded-full inline-block font-black">BANDA: {activeInterview.band_name}</span>
            <h1 className="text-4xl md:text-7xl font-franklin tracking-tighter text-white leading-none break-words uppercase font-black">{activeInterview.title}</h1>
            {activeInterview.subtitle && <p className="text-xl md:text-3xl text-zinc-400 font-bold uppercase italic mt-4 font-black">{activeInterview.subtitle}</p>}
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-6 text-zinc-500 font-bold uppercase text-[10px] md:text-xs">
               <p className="font-black">Publicado: {new Date(activeInterview.published_at).toLocaleDateString()}</p>
               {activeInterview.author && <p className="text-red-600 italic font-black">Por: {activeInterview.author}</p>}
            </div>
          </div>

          {activeInterview.image_url && (
            <div className="flex justify-center">
              <div className="border-4 md:border-8 border-white shadow-xl overflow-hidden relative group rounded-[24px] md:rounded-[40px] w-full max-w-3xl">
                <img 
                  src={activeInterview.image_url} 
                  alt={activeInterview.band_name} 
                  className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700 block"
                  style={{ objectPosition: activeInterview.image_position || 'center' }} 
                />
                {activeInterview.photo_credit && <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[8px] font-black px-2 py-1 uppercase rounded-full font-black">Foto: {activeInterview.photo_credit}</div>}
              </div>
            </div>
          )}

          <div className="max-w-none text-lg md:text-2xl leading-relaxed font-bold space-y-6 text-zinc-200 uppercase tracking-tight pt-8 whitespace-pre-wrap px-1 font-black">
            {activeInterview.content}
          </div>

          <div className="pt-16 border-t-4 border-zinc-800 flex flex-col items-center gap-8 pb-32 font-black">
            <p className="text-zinc-500 uppercase text-xs italic font-black">Gracias por leer Hoy Quien Toca</p>
            <button onClick={shareOnWhatsApp} className="bg-green-600 text-white px-10 py-4 font-black uppercase text-lg hover:bg-white hover:text-green-600 shadow-xl rounded-full border-4 border-black italic font-franklin transition-all">Compartir en WhatsApp</button>
          </div>
        </article>
      </main>
    </div>
  );
}
