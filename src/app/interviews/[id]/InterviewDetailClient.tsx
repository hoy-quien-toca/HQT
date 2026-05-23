'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InterviewDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const log = (msg: string) => {
    console.log(msg);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    log("Component mounted with ID: " + id);
    if (id && id !== '[id]') {
      fetchInterview();
    } else {
      log("ERROR: Invalid ID received");
      setErrorState("Identificador de entrevista no válido.");
      setLoading(false);
    }
  }, [id]);

  async function fetchInterview() {
    try {
      setLoading(true);
      setErrorState(null);
      log("Fetching data from Supabase...");

      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        log("Supabase error: " + error.message);
        throw error;
      }
      
      if (data) {
        log("Data found: " + data.title);
        setInterview(data);
      } else {
        log("ERROR: No data found for ID " + id);
        setErrorState("No encontramos la entrevista solicitada.");
      }
    } catch (err: any) {
      log("Catch error: " + (err.message || "Unknown"));
      setErrorState(err.message || "Error de conexión");
    } finally {
      setLoading(false);
      log("Loading finished");
    }
  }

  const shareOnWhatsApp = () => {
    const text = `Mira la entrevista que encontre en Hoy Quien Toca: ${interview?.title}\n\nLink: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-red-600 flex flex-col items-center justify-center p-6 text-center font-franklin">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xl uppercase italic animate-pulse">Cargando entrevista...</p>
        <div className="mt-10 text-[8px] text-zinc-600 font-mono">ID: {id}</div>
      </div>
    );
  }
  
  if (errorState || !interview) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6 text-center font-black">
        <h1 className="text-6xl uppercase italic text-red-600 mb-4 tracking-tighter font-franklin">404</h1>
        <p className="text-xl uppercase tracking-widest mb-4">{errorState || "Entrevista no encontrada."}</p>
        
        {/* DEBUG PANEL VISIBLE FOR THE USER */}
        <div className="bg-black/50 p-4 rounded-xl text-left font-mono text-[9px] text-zinc-500 mb-8 max-w-xs w-full overflow-auto max-h-40 border border-zinc-800">
           <p className="text-red-500 font-bold mb-1 underline">DEBUG INFO (Dile esto al programador):</p>
           {debugLog.map((l, i) => <p key={i}>{l}</p>)}
           <p>ID_PARAMS: {id}</p>
           <p>URL: {typeof window !== 'undefined' ? window.location.pathname : 'server'}</p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs font-black">
           <button onClick={() => window.location.reload()} className="bg-red-600 text-white py-3 rounded-full font-black uppercase text-sm border-2 border-white">Reintentar</button>
           <Link href="/interviews" className="bg-white text-black py-3 rounded-full font-black uppercase text-sm border-2 border-zinc-800">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden text-left bg-zinc-900">
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

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-red-600">
            <svg className="w-8 h-8 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase text-sm items-center">
            <Link href="/" className="hover:text-red-600 transition-colors">Fechas</Link>
            <Link href="/interviews" className="text-red-600 underline underline-offset-4 font-black">Entrevistas</Link>
            <Link href="/contact" className="hover:text-red-600 transition-colors">Contacto</Link>
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
        <button 
          onClick={() => router.push('/interviews')}
          className="fixed bottom-6 right-6 md:absolute md:top-4 md:right-4 bg-red-600 text-white w-14 h-14 md:w-16 md:h-16 flex items-center justify-center font-black text-3xl border-4 border-white rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] z-[60]"
        >
          X
        </button>

        <article className="space-y-8">
          <div className="text-center space-y-4 font-black">
            <span className="bg-red-600 text-white px-4 py-1 text-[10px] md:text-sm font-franklin italic rounded-full inline-block">BANDA: {interview.band_name}</span>
            <h1 className="text-4xl md:text-7xl font-franklin tracking-tighter text-white leading-none break-words uppercase">{interview.title}</h1>
            {interview.subtitle && <p className="text-xl md:text-3xl text-zinc-400 font-bold uppercase italic mt-4">{interview.subtitle}</p>}
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4 pt-6 text-zinc-500 font-bold uppercase text-[9px] md:text-xs font-black">
               <p>Publicado: {new Date(interview.published_at).toLocaleDateString()}</p>
               {interview.author && <p className="text-red-600 italic">Por: {interview.author}</p>}
            </div>
          </div>

          {interview.image_url && (
            <div className="flex justify-center px-1">
              <div className="border-4 md:border-8 border-white shadow-xl overflow-hidden relative group rounded-[24px] md:rounded-[40px] w-full max-w-3xl">
                <img 
                  src={interview.image_url} 
                  alt={interview.band_name} 
                  className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700 block"
                  style={{ objectPosition: interview.image_position || 'center' }} 
                />
                {interview.photo_credit && <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[7px] md:text-[9px] font-black px-2 py-1 uppercase rounded-full">Foto: {interview.photo_credit}</div>}
              </div>
            </div>
          )}

          <div className="max-w-none text-lg md:text-2xl leading-relaxed font-bold space-y-6 text-zinc-200 uppercase tracking-tight pt-8 whitespace-pre-wrap px-1 font-black">
            {interview.content}
          </div>

          <div className="pt-16 border-t-4 border-zinc-800 flex flex-col items-center gap-8 pb-32 font-black">
            <p className="text-zinc-500 uppercase text-xs italic">Gracias por leer Hoy Quien Toca</p>
            <button onClick={shareOnWhatsApp} className="bg-green-600 text-white px-10 py-4 font-black uppercase text-lg hover:bg-white hover:text-green-600 shadow-xl rounded-full border-4 border-black italic font-franklin">Compartir en WhatsApp</button>
          </div>
        </article>
      </main>

      {showLogoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-black">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowLogoModal(false)} />
          <div className="relative max-w-lg w-full bg-zinc-900 border-8 border-white p-6 rounded-[50px] shadow-2xl text-center">
            <button onClick={() => setShowLogoModal(false)} className="absolute -top-4 -right-4 bg-red-600 text-white w-12 h-12 font-black text-2xl border-4 border-white rounded-full">X</button>
            <Image src="/logo-rojo.jpg" alt="Logo Grande" width={600} height={600} className="w-full h-auto rounded-[30px]" />
            <h3 className="text-3xl font-franklin text-red-600 mt-4 leading-none">Hoy Quien Toca</h3>
          </div>
        </div>
      )}
    </div>
  );
}
