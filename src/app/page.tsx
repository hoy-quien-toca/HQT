'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [sponsors, setSponsors] = useState<any[]>([]); 
  const [currentBottomAdIndex, setCurrentBottomAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [department, setDepartment] = useState('');
  const [genre, setGenre] = useState('');
  const [ageRating, setAgeRating] = useState('');
  const [priceType, setPriceType] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (featuredEvents.length > 1) {
      const timer = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % featuredEvents.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [featuredEvents]);

  useEffect(() => {
    const bottomSponsors = sponsors.filter(a => a.position === 'bottom');
    if (bottomSponsors.length > 1) {
      const timer = setInterval(() => {
        setCurrentBottomAdIndex((prev) => (prev + 1) % bottomSponsors.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [sponsors]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: eventData } = await supabase.from('events').select('*').eq('is_approved', true).order('date', { ascending: true });
      const { data: sponsorData } = await supabase.from('sponsors').select('*').eq('is_active', true);

      if (eventData) {
        setAllEvents(eventData);
        applyFilters(eventData, department, genre, ageRating, priceType);
        setFeaturedEvents(eventData.filter(e => e.is_featured));
      }
      if (sponsorData) setSponsors(sponsorData);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    setLoading(false);
  }

  function applyFilters(data: any[], dep: string, gen: string, age: string, price: string) {
    let filtered = [...data];
    if (dep) filtered = filtered.filter(e => e.department === dep);
    if (gen) filtered = filtered.filter(e => e.genre === gen);
    if (age) filtered = filtered.filter(e => e.age_rating === age);
    if (price) {
      if (price === 'PAGO') filtered = filtered.filter(e => e.price_type === 'range');
      else if (price === 'LIBRE') filtered = filtered.filter(e => e.price_type === 'free');
      else if (price === 'GORRA') filtered = filtered.filter(e => e.price_type === 'gorra');
      else if (price === 'SOBRE') filtered = filtered.filter(e => e.price_type === 'sobre');
    }
    setEvents(filtered);
  }

  const topSponsor = sponsors.find(a => a.position === 'top');
  const bottomSponsors = sponsors.filter(a => a.position === 'bottom');
  const activeBottomAd = bottomSponsors[currentBottomAdIndex];
  const sidebarSponsors = sponsors.filter(a => a.position === 'sidebar');
  
  const activeDepartments = Array.from(new Set(allEvents.map(e => e.department))).sort();
  const activeGenres = Array.from(new Set(allEvents.map(e => e.genre))).sort();
  const activeAgeRatings = Array.from(new Set(allEvents.map(e => e.age_rating || 'ATP'))).sort();

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

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
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden text-left">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
        <Image src="/logo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" />
      </div>

      <header className="border-b-4 border-yellow-400 p-4 md:p-6 flex justify-between items-center bg-zinc-950 sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <Image src="/logo.jpg" alt="Logo" width={50} height={50} className="border-2 border-white md:w-[60px] md:h-[60px]" />
          <h1 className="text-2xl md:text-5xl font-black tracking-tighter uppercase italic text-yellow-400">Hoy Quien Toca</h1>
        </div>
        
        <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center">
          <Link href="/" className="hover:text-yellow-400 underline decoration-2 underline-offset-4">Fechas</Link>
          <Link href="/interviews" className="hover:text-yellow-400">Entrevistas</Link>
          <Link href="/submit" className="border-2 border-yellow-400 text-yellow-400 px-4 py-1 bg-black animate-[pulse_2s_infinite] hover:bg-yellow-400 hover:text-black transition-colors">Subir Fecha</Link>
        </nav>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-yellow-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
        </button>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8 md:hidden">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl font-black">X</button>
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl font-black uppercase text-yellow-400 italic">Fechas</Link>
          <Link href="/interviews" onClick={() => setIsMenuOpen(false)} className="text-4xl font-black uppercase text-white italic">Entrevistas</Link>
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl font-black uppercase border-4 border-yellow-400 text-yellow-400 px-8 py-4 animate-pulse">Subir Fecha</Link>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-12 relative z-10">
        
        {/* Top Sponsor Banner */}
        {topSponsor && (
          <div onClick={() => setSelectedAd(topSponsor)} className="cursor-pointer block w-full h-24 bg-zinc-950 border-4 border-white overflow-hidden shadow-lg group relative">
            <img src={topSponsor.image_url} alt="Sponsor" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-black px-2 py-0.5 border border-yellow-400 uppercase tracking-widest">Publicidad</div>
          </div>
        )}

        {/* Hero Banner */}
        {featuredEvents.length > 0 && (
          <section className="relative h-[400px] md:h-[500px] border-4 md:border-8 border-white bg-zinc-800 flex items-end p-6 md:p-10 overflow-hidden shadow-[12px_12px_0px_0px_rgba(234,179,8,1)] group">
            <div className="absolute inset-0">
               {featuredEvents[currentHeroIndex].flyer_url && (
                 <img src={featuredEvents[currentHeroIndex].flyer_url} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px]" />
               )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
            <div className="relative z-20 w-full">
              <span className="bg-red-600 text-white px-4 py-1 text-xs md:text-sm font-black uppercase italic tracking-widest shadow-md">
                {featuredEvents[currentHeroIndex].suggestion_tag || 'DESTACADO'}
              </span>
              <h2 className="text-4xl md:text-8xl font-black uppercase italic leading-[0.8] tracking-tighter mt-4 drop-shadow-2xl text-yellow-400">
                {featuredEvents[currentHeroIndex].band_name}
              </h2>
              <p className="text-lg md:text-2xl font-bold text-white uppercase tracking-widest border-l-4 md:border-l-8 border-red-600 pl-4 mt-4">
                {featuredEvents[currentHeroIndex].date} @ {featuredEvents[currentHeroIndex].venue}
              </p>
              <button onClick={() => setSelectedEvent(featuredEvents[currentHeroIndex])} className="mt-8 bg-white text-black font-black uppercase px-6 py-2 md:px-8 md:py-3 hover:bg-yellow-400 transition-all text-sm md:text-base">Ver Detalles</button>
            </div>
            <div className="absolute top-6 right-8 z-30 flex gap-1 md:gap-2">
              {featuredEvents.map((_, i) => (
                <div key={i} className={`h-1.5 md:h-2 w-6 md:w-8 border border-white transition-all ${i === currentHeroIndex ? 'bg-yellow-400 w-10 md:w-12' : 'bg-transparent opacity-50'}`} />
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          <div className="flex-1 space-y-12">
            {/* Filters */}
            <section className="bg-yellow-400 text-black p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center font-black uppercase italic shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
              <select value={department} onChange={(e) => { setDepartment(e.target.value); applyFilters(allEvents, e.target.value, genre, ageRating, priceType); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-xs uppercase">
                <option value="">Depto</option>
                {activeDepartments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={genre} onChange={(e) => { setGenre(e.target.value); applyFilters(allEvents, department, e.target.value, ageRating, priceType); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-xs uppercase">
                <option value="">Género</option>
                {activeGenres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={ageRating} onChange={(e) => { setAgeRating(e.target.value); applyFilters(allEvents, department, genre, e.target.value, priceType); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-xs">
                <option value="">Edad</option>
                {activeAgeRatings.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={priceType} onChange={(e) => { setPriceType(e.target.value); applyFilters(allEvents, department, genre, ageRating, e.target.value); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-xs uppercase">
                <option value="">Entrada</option>
                <option value="PAGO">Pago</option><option value="LIBRE">Libre</option><option value="GORRA">A la Gorra</option><option value="SOBRE">Sobre Artístico</option>
              </select>
              <button onClick={() => {setDepartment(''); setGenre(''); setAgeRating(''); setPriceType(''); setEvents(allEvents);}} className="sm:col-span-full text-[10px] underline hover:text-red-600 font-bold uppercase tracking-widest text-center">Limpiar Filtros</button>
            </section>

            {/* Event Feed */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {loading ? (
                <p className="col-span-full text-center text-4xl font-black animate-pulse text-yellow-400 uppercase italic">Cargando...</p>
              ) : events.length === 0 ? (
                <div className="col-span-full text-center py-20 border-4 border-dashed border-zinc-700 text-zinc-500 font-black uppercase italic">No hay resultados...</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} onClick={() => setSelectedEvent(event)} className="border-4 border-white p-4 hover:translate-x-1 hover:-translate-y-1 transition-all bg-zinc-950 shadow-[6px_6px_0px_0px_rgba(234,179,8,1)] flex flex-col group/card relative overflow-hidden cursor-pointer">
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
                      {event.suggestion_tag && <div className="bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 shadow-md uppercase">{event.suggestion_tag}</div>}
                      <div className="bg-white text-black text-[8px] font-black px-2 py-0.5 shadow-md uppercase">{event.age_rating || 'ATP'}</div>
                    </div>
                    {event.is_sold_out && <div className="absolute top-8 -right-12 bg-red-600 text-white font-black py-2 px-12 rotate-45 uppercase text-sm border-y-2 border-white z-30 shadow-xl tracking-tighter italic">¡AGOTADO!</div>}
                    <div className="aspect-square bg-zinc-800 mb-4 border-2 border-zinc-700 relative flex items-center justify-center overflow-hidden">
                      {event.flyer_url ? <img src={event.flyer_url} alt="Flyer" className={`object-cover w-full h-full transition-all duration-500 ${event.is_sold_out ? 'grayscale blur-[1px]' : 'group-hover/card:scale-105'}`} /> : <div className="text-zinc-600 font-black italic uppercase text-center">FLYER DEL SHOW</div>}
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl md:text-2xl font-black uppercase leading-[0.9] break-words max-w-[70%] group-hover/card:text-yellow-400 transition-colors">{event.band_name}</h3>
                        <span className="text-[10px] bg-red-600 text-white px-2 py-1 uppercase font-black italic">{event.genre || 'Show'}</span>
                      </div>
                      <p className="font-bold text-yellow-400 tracking-tighter uppercase text-sm">{event.date} - {formatTime(event.time)}hs</p>
                      <p className="text-[10px] uppercase tracking-tight text-zinc-400 font-bold leading-tight">{event.venue}, {event.city}</p>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          <aside className="lg:w-72 space-y-8 relative z-10">
            <h3 className="text-xl font-black uppercase italic text-yellow-400 border-b-4 border-yellow-400 pb-2 tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] inline-block px-2 bg-zinc-950">Auspician</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:space-y-6">
              {sidebarSponsors.map(ad => (
                <div key={ad.id} onClick={() => setSelectedAd(ad)} className="block border-4 border-white bg-zinc-950 p-2 shadow-[8px_8px_0px_0px_rgba(234,179,8,1)] hover:-translate-x-1 transition-transform group cursor-pointer">
                  <div className="aspect-[4/5] overflow-hidden border-2 border-zinc-800">
                    <img src={ad.image_url} alt="Sponsor" className="w-full h-full object-cover transition-all duration-500" />
                  </div>
                </div>
              ))}
              <Link href="/contact" className="block border-4 border-dashed border-zinc-700 p-8 text-center hover:border-white hover:text-white transition-colors group text-zinc-500 lg:col-span-1 col-span-full">
                <span className="text-xs font-black uppercase group-hover:text-white text-center block">Publicá acá</span>
              </Link>
            </div>
          </aside>
        </div>

        {activeBottomAd && (
          <section className="pt-12">
             <div onClick={() => setSelectedAd(activeBottomAd)} className="cursor-pointer block w-full h-48 md:h-64 bg-zinc-950 border-4 md:border-8 border-white overflow-hidden shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] group relative">
                <img src={activeBottomAd.image_url} alt="Sponsor" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute top-4 left-4 bg-black/80 text-white text-[10px] font-black px-4 py-1 border-2 border-yellow-400 uppercase tracking-widest">Publicidad Destacada</div>
             </div>
        </section>
        )}

        {/* Modal Event */}
        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
            <div className="relative w-full max-w-4xl bg-zinc-900 border-4 md:border-8 border-white shadow-[20px_20px_0px_0px_rgba(234,179,8,1)] flex flex-col md:flex-row overflow-y-auto max-h-[90vh]">
              <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 bg-red-600 text-white w-10 h-10 font-black text-xl border-4 border-white z-50 hover:bg-black transition-colors text-center">X</button>
              <div className="md:w-1/2 bg-zinc-800 border-b-4 md:border-b-0 md:border-r-4 border-white flex items-center justify-center p-4">
                {selectedEvent.flyer_url ? <img src={selectedEvent.flyer_url} alt="Flyer" className="max-w-full h-auto shadow-2xl border-4 border-white" /> : <p className="font-black italic text-zinc-600 uppercase">SIN FLYER</p>}
              </div>
              <div className="md:w-1/2 p-6 md:p-8 space-y-6">
                <div>
                  <div className="flex gap-2">
                    <span className="bg-red-600 text-white px-2 py-1 text-[10px] font-black uppercase italic">{selectedEvent.genre}</span>
                    <span className="bg-white text-black px-2 py-1 text-[10px] font-black uppercase italic">{selectedEvent.age_rating || 'ATP'}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mt-2 text-yellow-400 leading-none">{selectedEvent.band_name}</h2>
                </div>
                <div className="space-y-1 text-white">
                  <p className="text-xl font-bold uppercase">{selectedEvent.date} - {formatTime(selectedEvent.time)}hs</p>
                  <p className="text-sm font-black text-zinc-400 uppercase italic">{selectedEvent.venue} - {selectedEvent.city}, {selectedEvent.department}</p>
                </div>
                <div className="border-t-2 border-zinc-800 pt-6">
                  <h4 className="text-xs font-black uppercase text-zinc-500 mb-2 italic">Reseña / Bio del Show</h4>
                  <div className="text-zinc-200 leading-relaxed font-medium space-y-4 max-h-48 overflow-y-auto pr-4 text-sm uppercase custom-scrollbar">
                    {selectedEvent.description?.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>) || <p className="italic text-zinc-600">No hay reseña disponible.</p>}
                  </div>
                </div>
                <div className="pt-6 border-t-2 border-zinc-800 space-y-4">
                  <p className="text-2xl md:text-3xl font-black italic text-yellow-400 tracking-tighter uppercase">
                    {selectedEvent.price_type === 'free' ? 'ENTRADA LIBRE' : selectedEvent.price_type === 'gorra' ? 'A LA GORRA' : selectedEvent.price_type === 'sobre' ? 'SOBRE ARTÍSTICO' : `$${selectedEvent.price_min}${selectedEvent.price_max ? ` - $${selectedEvent.price_max}` : ''}`}
                  </p>
                  <div className="flex gap-4">
                    <button onClick={() => !selectedEvent.is_sold_out && handleTicketAction(selectedEvent)} disabled={selectedEvent.is_sold_out} className={`flex-1 font-black uppercase py-4 text-lg md:text-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all ${selectedEvent.is_sold_out ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none' : 'bg-yellow-400 text-black hover:bg-white'}`}>{selectedEvent.is_sold_out ? 'AGOTADO' : (selectedEvent.ticket_type === 'whatsapp' ? 'WhatsApp' : 'Comprar Entradas')}</button>
                    <button onClick={() => shareOnWhatsApp(selectedEvent)} className="bg-green-600 text-white p-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:bg-black transition-colors flex items-center justify-center">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedAd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur" onClick={() => setSelectedAd(null)} />
            <div className="relative max-w-2xl w-full bg-zinc-900 border-8 border-white p-4 shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)] text-center">
              <button onClick={() => setSelectedAd(null)} className="absolute -top-4 -right-4 bg-red-600 text-white w-12 h-12 font-black text-2xl border-4 border-white hover:bg-black transition-colors z-[110]">X</button>
              <img src={selectedAd.image_url} alt="Sponsor" className="w-full h-auto border-4 border-zinc-800" />
              <div className="p-6 text-center space-y-4">
                <h3 className="text-4xl font-black uppercase italic text-yellow-400 tracking-tighter">{selectedAd.client_name}</h3>
                {selectedAd.link && (
                  <a href={selectedAd.link} target="_blank" className="inline-block bg-white text-black px-10 py-3 font-black uppercase hover:bg-yellow-400 transition-all shadow-[6px_6px_0px_0px_rgba(234,179,8,1)] uppercase">Visitar Web</a>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="border-t-4 border-zinc-800 pt-8 pb-16 text-center">
          <p className="text-zinc-500 font-bold uppercase text-[10px] max-w-2xl mx-auto tracking-tighter leading-relaxed italic">AVISO: HOY QUIEN TOCA NO VENDE ENTRADAS. SOMOS UNA PLATAFORMA INFORMATIVA. LA VENTA Y ORGANIZACIÓN ES RESPONSABILIDAD DE LOS ORGANIZADORES.</p>
        </footer>
      </main>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #facc15; }
        @keyframes pulse {
          0%, 100% { opacity: 1; border-color: #facc15; box-shadow: 0 0 10px #facc15; }
          50% { opacity: 0.7; border-color: white; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
