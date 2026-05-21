'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]); // Store all for filter derivation
  const [featuredEvent, setFeaturedEvent] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null); // For Modal
  
  const [department, setDepartment] = useState('');
  const [genre, setGenre] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // Fetch Approved Events
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('is_approved', true)
      .order('date', { ascending: true });

    // Fetch Ads
    const { data: adData } = await supabase
      .from('ads')
      .select('*')
      .eq('is_active', true);

    if (eventData) {
      setAllEvents(eventData);
      applyFilters(eventData, department, genre, date);
      setFeaturedEvent(eventData.find(e => e.is_featured) || eventData[0]);
    }
    
    if (adData) setAds(adData);
    setLoading(false);
  }

  function applyFilters(data: any[], dep: string, gen: string, d: string) {
    let filtered = [...data];
    if (dep) filtered = filtered.filter(e => e.department === dep);
    if (gen) filtered = filtered.filter(e => e.genre === gen);
    if (d) filtered = filtered.filter(e => e.date === d);
    setEvents(filtered);
  }

  // Derive dynamic filters from active events
  const activeDepartments = Array.from(new Set(allEvents.map(e => e.department))).sort();
  const activeGenres = Array.from(new Set(allEvents.map(e => e.genre))).sort();

  const shareOnWhatsApp = (event: any) => {
    const text = `¡Mirá esto que encontré en Hoy Quien Toca! ¿Vamos?\n\n${event.band_name} en ${event.venue}\nFecha: ${event.date}\nLink: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTicketAction = (event: any) => {
    if (event.ticket_type === 'whatsapp') {
      window.open(`https://wa.me/${event.ticket_contact}`, '_blank');
    } else {
      window.open(event.ticket_contact, '_blank');
    }
  };

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden">
      <header className="border-b-4 border-yellow-400 p-6 flex justify-between items-center bg-zinc-950 sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <Image src="/logo.jpg" alt="Logo" width={60} height={60} className="border-2 border-white shadow-[4px_4px_0px_0px_rgba(250,204,21,1)]" />
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-yellow-400">Hoy Quien Toca</h1>
        </div>
        <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm">
          <Link href="/" className="hover:text-yellow-400 underline decoration-2 underline-offset-4">Fechas</Link>
          <Link href="/interviews" className="hover:text-yellow-400">Entrevistas</Link>
          <Link href="/submit" className="hover:text-yellow-400 border-2 border-yellow-400 px-3 py-1 animate-pulse">Subir Fecha</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-12 relative z-10">
        {topAd && (
          <a href={topAd.link} target="_blank" rel="noopener noreferrer" className="block w-full h-24 bg-zinc-950 border-4 border-white overflow-hidden shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] group">
            <img src={topAd.image_url} alt="Publicidad" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
          </a>
        )}

        {featuredEvent && (
          <section className="relative h-[400px] border-8 border-white bg-zinc-800 flex items-end p-8 overflow-hidden shadow-[12px_12px_0px_0px_rgba(234,179,8,1)]">
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80 z-10" />
            <div className="relative z-20">
              <span className="bg-red-600 text-white px-4 py-1 text-sm font-black uppercase italic tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                {featuredEvent.suggestion_tag || 'Planazo'}
              </span>
              <h2 className="text-5xl md:text-8xl font-black uppercase italic leading-[0.8] tracking-tighter mt-4 drop-shadow-2xl">
                {featuredEvent.band_name}
              </h2>
              <p className="text-xl font-bold text-yellow-400 uppercase tracking-widest border-l-4 border-yellow-400 pl-3 mt-2">
                {featuredEvent.date} @ {featuredEvent.venue}
              </p>
              <button onClick={() => setSelectedEvent(featuredEvent)} className="mt-6 bg-white text-black font-black uppercase px-6 py-2 hover:bg-yellow-400 transition-colors">Ver Detalles</button>
            </div>
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/asfalt-light.png')]" />
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-12">
            {/* Filters */}
            <section className="bg-yellow-400 text-black p-4 flex flex-wrap gap-4 items-center font-black uppercase italic shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
              <span className="text-xl tracking-tighter">Filtrar:</span>
              <select 
                value={department}
                onChange={(e) => { setDepartment(e.target.value); applyFilters(allEvents, e.target.value, genre, date); }}
                className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold min-w-[150px]"
              >
                <option value="">Cualquier Depto</option>
                {activeDepartments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select 
                value={genre}
                onChange={(e) => { setGenre(e.target.value); applyFilters(allEvents, department, e.target.value, date); }}
                className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold min-w-[150px]"
              >
                <option value="">Cualquier Género</option>
                {activeGenres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input 
                type="date" 
                value={date}
                onChange={(e) => { setDate(e.target.value); applyFilters(allEvents, department, genre, e.target.value); }}
                className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold" 
              />
              <button onClick={() => {setDepartment(''); setGenre(''); setDate(''); setEvents(allEvents);}} className="text-[10px] underline hover:text-red-600">Limpiar</button>
            </section>

            {/* Event Feed */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {loading ? (
                <p className="col-span-full text-center text-4xl font-black animate-pulse text-yellow-400 uppercase italic">Cargando fechas...</p>
              ) : events.length === 0 ? (
                <div className="col-span-full text-center py-20 space-y-4 border-4 border-dashed border-zinc-700">
                  <p className="text-4xl font-black uppercase italic text-zinc-600 tracking-tighter">No hay resultados...</p>
                  <button onClick={() => {setDepartment(''); setGenre(''); setDate(''); setEvents(allEvents);}} className="bg-white text-black px-6 py-2 font-black uppercase">Mostrar Todo</button>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} onClick={() => setSelectedEvent(event)} className="border-4 border-white p-4 hover:translate-x-2 hover:-translate-y-2 transition-all bg-zinc-950 shadow-[8px_8px_0px_0px_rgba(234,179,8,1)] flex flex-col group/card relative overflow-hidden cursor-pointer">
                    {event.suggestion_tag && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 z-20 shadow-md">
                        {event.suggestion_tag}
                      </div>
                    )}
                    {event.is_sold_out && (
                      <div className="absolute top-8 -right-12 bg-red-600 text-white font-black py-2 px-12 rotate-45 uppercase text-sm border-y-2 border-white z-20 shadow-xl">
                        ¡AGOTADO!
                      </div>
                    )}
                    
                    <div className="aspect-square bg-zinc-800 mb-4 border-2 border-zinc-700 relative flex items-center justify-center italic font-bold text-zinc-500 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                      {event.flyer_url ? (
                        <img src={event.flyer_url} alt="Flyer" className={`object-cover w-full h-full transition-all duration-500 ${event.is_sold_out ? 'grayscale blur-[1px]' : 'grayscale group-hover/card:grayscale-0'}`} />
                      ) : (
                        "Flyer del Show"
                      )}
                    </div>
                    <div className="space-y-2 flex-1 text-left">
                      <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-black uppercase leading-[0.9] break-words max-w-[70%] group-hover/card:text-yellow-400 transition-colors">{event.band_name}</h3>
                        <span className="text-[10px] bg-red-600 text-white px-2 py-1 uppercase font-black italic shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">{event.genre || 'Show'}</span>
                      </div>
                      <p className="font-bold text-yellow-400 tracking-tighter uppercase">{event.date} - {event.time}hs</p>
                      <p className="text-xs uppercase tracking-tight text-zinc-400 font-bold leading-tight">{event.venue}, {event.city}</p>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          <aside className="lg:w-72 space-y-8 relative z-10">
            <h3 className="text-xl font-black uppercase italic text-yellow-400 border-b-4 border-yellow-400 pb-2 tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] inline-block px-2 bg-zinc-950 text-left">Auspician</h3>
            <div className="space-y-6">
              {sidebarAds.map(ad => (
                <a key={ad.id} href={ad.link} target="_blank" rel="noopener noreferrer" className="block border-4 border-white bg-zinc-950 p-2 shadow-[8px_8px_0px_0px_rgba(234,179,8,1)] hover:-translate-x-1 transition-transform group">
                  <div className="aspect-[4/5] overflow-hidden border-2 border-zinc-800">
                    <img src={ad.image_url} alt={ad.client_name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <div className="p-2 text-center font-black uppercase text-[10px] tracking-widest text-zinc-500">{ad.client_name}</div>
                </a>
              ))}
              <Link href="/contact" className="block border-4 border-dashed border-zinc-700 p-8 text-center hover:border-white hover:text-white transition-colors group text-zinc-500">
                <span className="text-xs font-black uppercase group-hover:text-white">Publicá acá</span>
              </Link>
            </div>
          </aside>
        </div>

        {/* Modal de Detalles */}
        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
            <div className="relative w-full max-w-4xl bg-zinc-900 border-8 border-white shadow-[20px_20px_0px_0px_rgba(234,179,8,1)] flex flex-col md:flex-row overflow-y-auto max-h-full">
              <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 bg-red-600 text-white w-10 h-10 font-black text-xl border-4 border-white z-50">X</button>
              
              <div className="md:w-1/2 bg-zinc-800 border-b-8 md:border-b-0 md:border-r-8 border-white flex items-center justify-center p-4">
                {selectedEvent.flyer_url ? (
                  <img src={selectedEvent.flyer_url} alt="Flyer" className="max-w-full h-auto shadow-2xl border-4 border-white" />
                ) : (
                  <p className="font-black italic text-zinc-600">SIN FLYER</p>
                )}
              </div>

              <div className="md:w-1/2 p-8 space-y-6">
                <div>
                  <span className="bg-red-600 text-white px-3 py-1 text-xs font-black uppercase italic tracking-widest">{selectedEvent.genre}</span>
                  <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mt-2 text-yellow-400 leading-none">{selectedEvent.band_name}</h2>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xl font-bold text-white uppercase">{selectedEvent.date} - {selectedEvent.time}hs</p>
                  <p className="text-sm font-black text-zinc-400 uppercase italic">{selectedEvent.venue} - {selectedEvent.city}, {selectedEvent.department}</p>
                </div>

                <div className="border-t-2 border-zinc-800 pt-6">
                  <h4 className="text-xs font-black uppercase text-zinc-500 mb-2">Reseña / Bio del Show</h4>
                  <div className="text-zinc-300 leading-relaxed font-medium space-y-4 max-h-48 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-yellow-400">
                    {selectedEvent.description?.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>) || <p className="italic">No hay reseña disponible.</p>}
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-zinc-800 space-y-4">
                  <p className="text-2xl font-black italic">
                    {selectedEvent.price_type === 'free' ? 'ENTRADA LIBRE' : 
                     selectedEvent.price_type === 'gorra' ? 'A LA GORRA' : 
                     selectedEvent.price_type === 'sobre' ? 'SOBRE ARTÍSTICO' : 
                     `$${selectedEvent.price_min}${selectedEvent.price_max ? ` - $${selectedEvent.price_max}` : ''}`}
                  </p>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => !selectedEvent.is_sold_out && handleTicketAction(selectedEvent)} 
                      disabled={selectedEvent.is_sold_out}
                      className={`flex-1 font-black uppercase py-4 text-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all ${selectedEvent.is_sold_out ? 'bg-zinc-800 text-zinc-600' : 'bg-yellow-400 text-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none'}`}
                    >
                      {selectedEvent.is_sold_out ? 'AGOTADO' : (selectedEvent.ticket_type === 'whatsapp' ? 'WhatsApp' : 'Comprar Entradas')}
                    </button>
                    <button onClick={() => shareOnWhatsApp(selectedEvent)} className="bg-green-600 text-white p-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="border-t-4 border-zinc-800 pt-8 pb-16 text-center">
          <p className="text-zinc-500 font-bold uppercase text-[10px] max-w-2xl mx-auto tracking-tighter leading-relaxed italic">AVISO: HOY QUIEN TOCA NO VENDE ENTRADAS. SOMOS UNA PLATAFORMA INFORMATIVA. LA VENTA Y ORGANIZACIÓN ES RESPONSABILIDAD DE LOS ORGANIZADORES.</p>
        </footer>
      </main>
    </div>
  );
}
