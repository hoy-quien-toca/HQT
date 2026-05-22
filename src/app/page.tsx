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
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('is_approved', true)
        .order('date', { ascending: true });

      const { data: sponsorData } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true);

      if (eventData) {
        const normalized = eventData.map(e => ({
          ...e,
          department: e.department?.trim().toUpperCase(),
          genre: e.genre?.trim().toUpperCase()
        }));
        setAllEvents(normalized);
        setFeaturedEvents(normalized.filter(e => e.is_featured === true));
        setEvents(normalized);
      }
      if (sponsorData) setSponsors(sponsorData);
    } catch (err) {
      console.error("Fetch error:", err);
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

  const nextHero = () => setCurrentHeroIndex((prev) => (prev + 1) % featuredEvents.length);
  const prevHero = () => setCurrentHeroIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);

  const topSponsor = sponsors.find(a => a.position === 'top');
  const bottomSponsors = sponsors.filter(a => a.position === 'bottom');
  const activeBottomAd = bottomSponsors[currentBottomAdIndex];
  const sidebarSponsors = sponsors.filter(a => a.position === 'sidebar');
  
  const activeDepartments = Array.from(new Set(allEvents.map(e => e.department))).filter(Boolean).sort();
  const activeGenres = Array.from(new Set(allEvents.map(e => e.genre))).filter(Boolean).sort();
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
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden text-left bg-zinc-900">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/logo-rojo.jpg" alt="Logo Rojo" width={50} height={50} className="border-2 border-white rounded-2xl md:w-[60px] md:h-[60px]" />
            <div>
              <h1 className="text-2xl md:text-5xl font-brusher tracking-tighter uppercase text-red-600 leading-none">Hoy Quien Toca</h1>
              <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest mt-1">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
            </div>
          </div>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center">
            <Link href="/" className="text-red-600 underline decoration-2 underline-offset-4 font-black">Fechas</Link>
            <Link href="/interviews" className="hover:text-red-600">Entrevistas</Link>
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
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-red-600 italic">Fechas</Link>
          <Link href="/interviews" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic">Entrevistas</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic font-black">Contacto</Link>
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl uppercase border-4 border-red-600 text-red-600 px-8 py-4 rounded-full animate-pulse">Subir Fecha</Link>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-12 relative z-10">
        
        {topSponsor && (
          <div onClick={() => setSelectedAd(topSponsor)} className="cursor-pointer block w-full h-24 bg-zinc-950 border-4 border-white overflow-hidden shadow-lg group relative rounded-3xl">
            <img src={topSponsor.image_url} alt="Sponsor" className="w-full h-full object-cover transition-all duration-500" />
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-black px-2 py-0.5 border border-red-600 uppercase tracking-widest rounded-lg">Publicidad</div>
          </div>
        )}

        {featuredEvents.length > 0 && (
          <section className="relative h-[400px] md:h-[500px] border-4 md:border-8 border-white bg-zinc-800 flex items-end p-6 md:p-10 overflow-hidden shadow-[12px_12px_0px_0px_rgba(220,38,38,0.3)] group rounded-[40px]">
            <div className="absolute inset-0">
               {featuredEvents[currentHeroIndex].flyer_url && (
                 <img src={featuredEvents[currentHeroIndex].flyer_url} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Hero" />
               )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
            
            <button onClick={prevHero} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white w-12 h-12 flex items-center justify-center rounded-full border-2 border-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button onClick={nextHero} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white w-12 h-12 flex items-center justify-center rounded-full border-2 border-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>

            <div className="relative z-20 w-full text-left">
              <span className="bg-red-600 text-white px-4 py-1 text-xs md:text-sm font-black uppercase italic tracking-widest shadow-md rounded-full">
                {featuredEvents[currentHeroIndex].suggestion_tag || 'DESTACADO'}
              </span>
              <h2 className="text-4xl md:text-8xl font-brusher tracking-tighter mt-4 drop-shadow-2xl text-white uppercase leading-none">
                {featuredEvents[currentHeroIndex].band_name}
              </h2>
              <p className="text-lg md:text-2xl font-bold text-white uppercase tracking-widest border-l-4 md:border-l-8 border-red-600 pl-4 mt-4">
                {featuredEvents[currentHeroIndex].date} @ {featuredEvents[currentHeroIndex].venue}
              </p>
              <button onClick={() => setSelectedEvent(featuredEvents[currentHeroIndex])} className="mt-8 bg-white text-black font-black uppercase px-6 py-2 md:px-8 md:py-3 hover:bg-red-600 hover:text-white transition-all text-sm md:text-base rounded-full shadow-lg">Ver Detalles</button>
            </div>
            <div className="absolute top-6 right-8 z-30 flex gap-1 md:gap-2">
              {featuredEvents.map((_, i) => (
                <div key={i} className={`h-1.5 md:h-2 w-6 md:w-8 border border-white transition-all rounded-full ${i === currentHeroIndex ? 'bg-red-600 w-10 md:w-12' : 'bg-transparent opacity-50'}`} />
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          <div className="flex-1 space-y-12">
            <section className="bg-red-600 text-white p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center font-black uppercase italic shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-3xl">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] opacity-80 uppercase">Departamento</span>
                <select value={department} onChange={(e) => { setDepartment(e.target.value); applyFilters(allEvents, e.target.value, genre, ageRating, priceType); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-xs uppercase rounded-xl">
                  <option value="">Cualquier Depto</option>
                  {activeDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] opacity-80 uppercase">Género</span>
                <select value={genre} onChange={(e) => { setGenre(e.target.value); applyFilters(allEvents, department, e.target.value, ageRating, priceType); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-xs uppercase rounded-xl">
                  <option value="">Cualquier Género</option>
                  {activeGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] opacity-80 uppercase">Edad</span>
                <select value={ageRating} onChange={(e) => { setAgeRating(e.target.value); applyFilters(allEvents, department, genre, e.target.value, priceType); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-xs uppercase rounded-xl">
                  <option value="">Cualquier Edad</option>
                  {activeAgeRatings.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] opacity-80 uppercase">Tipo Entrada</span>
                <select value={priceType} onChange={(e) => { setPriceType(e.target.value); applyFilters(allEvents, department, genre, ageRating, e.target.value); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-xs uppercase rounded-xl">
                  <option value="">Cualquier Tipo</option>
                  <option value="PAGO">PAGO</option><option value="LIBRE">LIBRE</option><option value="GORRA">A LA GORRA</option><option value="SOBRE">SOBRE ARTÍSTICO</option>
                </select>
              </div>
              <button onClick={() => {setDepartment(''); setGenre(''); setAgeRating(''); setPriceType(''); setEvents(allEvents);}} className="sm:col-span-full text-[10px] underline hover:text-black font-bold uppercase tracking-widest text-center mt-2">Limpiar Filtros</button>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 text-left">
              {loading ? (
                <p className="col-span-full text-center text-4xl font-brusher animate-pulse text-red-600 uppercase">Cargando...</p>
              ) : events.length === 0 ? (
                <div className="col-span-full text-center py-20 border-4 border-dashed border-zinc-700 text-zinc-500 font-black uppercase italic rounded-3xl">No hay resultados...</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} onClick={() => setSelectedEvent(event)} className="border-4 border-white p-4 hover:translate-x-1 hover:-translate-y-1 transition-all bg-zinc-950 shadow-[8px_8px_0px_0px_rgba(220,38,38,0.5)] flex flex-col group/card relative overflow-hidden cursor-pointer rounded-[32px]">
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
                      {event.suggestion_tag && <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 shadow-md uppercase rounded-sm">{event.suggestion_tag}</div>}
                      <div className="bg-white text-black text-[8px] font-black px-2 py-0.5 shadow-md uppercase rounded-sm">{event.age_rating || 'ATP'}</div>
                    </div>
                    {event.is_sold_out && <div className="absolute top-8 -right-12 bg-red-600 text-white font-black py-2 px-12 rotate-45 uppercase text-sm border-y-2 border-white z-30 shadow-xl tracking-tighter italic">¡AGOTADO!</div>}
                    {event.is_suspended && <div className="absolute top-8 -right-12 bg-zinc-700 text-white font-black py-2 px-12 rotate-45 uppercase text-sm border-y-2 border-white z-30 shadow-xl tracking-tighter italic">SUSPENDIDO</div>}
                    <div className="aspect-square bg-zinc-800 mb-4 border-2 border-zinc-700 relative flex items-center justify-center overflow-hidden rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                      {event.flyer_url ? <img src={event.flyer_url} alt="Flyer" className={`object-cover w-full h-full transition-all duration-500 ${(event.is_sold_out || event.is_suspended) ? 'grayscale blur-[1px]' : 'group-hover/card:scale-105'}`} /> : <div className="text-zinc-600 font-black italic uppercase text-center">FLYER DEL SHOW</div>}
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between items-start text-left">
                        <h3 className="text-xl md:text-2xl font-black uppercase leading-[0.9] break-words max-w-[70%] group-hover/card:text-red-600 transition-colors uppercase font-black">{event.band_name}</h3>
                        <span className="text-[10px] bg-red-600 text-white px-2 py-1 uppercase font-black italic rounded-md shadow-sm">{event.genre || 'Show'}</span>
                      </div>
                      <p className="font-bold text-red-600 tracking-tighter uppercase text-sm">{event.date} - {formatTime(event.time)}hs</p>
                      <p className="text-[10px] uppercase tracking-tight text-zinc-400 font-bold leading-tight text-left">{event.venue}, {event.city}</p>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          <aside className="lg:w-72 space-y-8 relative z-10 text-left uppercase">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:space-y-6 pt-4 font-black">
              {sidebarSponsors.map(ad => (
                <div key={ad.id} onClick={() => setSelectedAd(ad)} className="block border-4 border-white bg-zinc-950 p-2 shadow-[8px_8px_0px_0px_rgba(220,38,38,0.3)] hover:-translate-x-1 transition-transform group cursor-pointer rounded-2xl">
                  <div className="aspect-[4/5] overflow-hidden border-2 border-zinc-800 rounded-xl">
                    <img src={ad.image_url} alt="Sponsor" className="w-full h-full object-cover transition-all duration-500" />
                  </div>
                </div>
              ))}
              <Link href="/contact" className="block border-4 border-dashed border-zinc-700 p-8 text-center hover:border-red-600 hover:text-red-600 transition-colors group text-zinc-500 lg:col-span-1 col-span-full rounded-2xl">
                <span className="text-xs font-black uppercase group-hover:text-red-600 text-center block uppercase tracking-widest italic">Publicá acá</span>
              </Link>
            </div>
          </aside>
        </div>

        {activeBottomAd && (
          <section className="pt-12">
             <div onClick={() => setSelectedAd(activeBottomAd)} className="cursor-pointer block w-full h-48 md:h-64 bg-zinc-950 border-4 md:border-8 border-white overflow-hidden shadow-[12px_12px_0px_0px_rgba(220,38,38,0.5)] group relative rounded-[40px]">
                <img src={activeBottomAd.image_url} alt="Sponsor" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute top-4 left-4 bg-black/80 text-white text-[10px] font-black px-4 py-1 border-2 border-red-600 uppercase tracking-widest rounded-full italic">Auspiciante Destacado</div>
             </div>
        </section>
        )}

        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
            <div className="relative w-full max-w-4xl bg-zinc-900 border-4 md:border-8 border-white shadow-[20px_20px_0px_0px_rgba(220,38,38,0.5)] flex flex-col md:flex-row overflow-y-auto max-h-[90vh] rounded-[40px]">
              <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 bg-red-600 text-white w-10 h-10 font-black text-xl border-4 border-white z-50 hover:bg-black transition-colors text-center flex items-center justify-center rounded-full shadow-lg">X</button>
              <div className="md:w-1/2 bg-zinc-800 border-b-4 md:border-b-0 md:border-r-4 border-white flex items-center justify-center p-4">
                {selectedEvent.flyer_url ? <img src={selectedEvent.flyer_url} alt="Flyer" className="max-w-full h-auto shadow-2xl border-4 border-white rounded-2xl" /> : <p className="font-black italic text-zinc-600 uppercase text-center">SIN FLYER</p>}
              </div>
              <div className="md:w-1/2 p-6 md:p-8 space-y-6 text-left">
                <div>
                  <div className="flex gap-2">
                    <span className="bg-red-600 text-white px-2 py-1 text-[10px] font-black uppercase italic rounded-md shadow-sm">{selectedEvent.genre}</span>
                    <span className="bg-white text-black px-2 py-1 text-[10px] font-black uppercase italic rounded-md shadow-sm">{selectedEvent.age_rating || 'ATP'}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-brusher tracking-tighter mt-2 text-white leading-none uppercase font-black">{selectedEvent.band_name}</h2>
                </div>
                <div className="space-y-1 text-white font-black">
                  <p className="text-xl font-bold uppercase">{selectedEvent.date} - {formatTime(selectedEvent.time)}hs</p>
                  <p className="text-sm font-black text-zinc-400 uppercase italic">{selectedEvent.venue} - {selectedEvent.city}, {selectedEvent.department}</p>
                </div>
                <div className="border-t-2 border-zinc-800 pt-6">
                  <h4 className="text-xs font-black uppercase text-zinc-500 mb-2 italic">Reseña / Bio del Show</h4>
                  <div className="text-zinc-200 leading-relaxed font-medium space-y-4 max-h-48 overflow-y-auto pr-4 text-xs uppercase custom-scrollbar">
                    {selectedEvent.description?.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>) || <p className="italic text-zinc-600 text-sm">No hay reseña disponible.</p>}
                  </div>
                </div>
                <div className="pt-6 border-t-2 border-zinc-800 space-y-4">
                  <p className="text-2xl md:text-3xl font-black italic text-red-600 tracking-tighter uppercase">
                    {selectedEvent.price_type === 'free' ? 'ENTRADA LIBRE' : selectedEvent.price_type === 'gorra' ? 'A LA GORRA' : selectedEvent.price_type === 'sobre' ? 'SOBRE ARTÍSTICO' : `$${selectedEvent.price_min}${selectedEvent.price_max ? ` - $${selectedEvent.price_max}` : ''}`}
                  </p>
                  <div className="flex gap-4 font-black">
                    <button 
                      onClick={() => (!selectedEvent.is_sold_out && !selectedEvent.is_suspended) && handleTicketAction(selectedEvent)} 
                      disabled={selectedEvent.is_sold_out || selectedEvent.is_suspended} 
                      className={`flex-1 font-black uppercase py-4 text-lg md:text-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all rounded-full ${selectedEvent.is_sold_out || selectedEvent.is_suspended ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none border-zinc-700' : 'bg-red-600 text-white hover:bg-white hover:text-black'}`}
                    >
                      {selectedEvent.is_suspended ? 'SUSPENDIDO' : selectedEvent.is_sold_out ? 'AGOTADO' : (selectedEvent.ticket_type === 'whatsapp' ? 'WhatsApp' : 'Entradas')}
                    </button>
                    <button onClick={() => shareOnWhatsApp(selectedEvent)} className="bg-green-600 text-white p-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:bg-black transition-colors flex items-center justify-center rounded-full">
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
            <div className="relative max-w-2xl w-full bg-zinc-900 border-8 border-white p-4 shadow-[20px_20px_0px_0px_rgba(220,38,38,0.3)] text-center rounded-[40px]">
              <button onClick={() => setSelectedAd(null)} className="absolute -top-4 -right-4 bg-red-600 text-white w-12 h-12 font-black text-2xl border-4 border-white hover:bg-black transition-colors z-[110] text-center flex items-center justify-center shadow-xl rounded-full">X</button>
              <img src={selectedAd.image_url} alt="Sponsor" className="w-full h-auto border-4 border-zinc-800 shadow-2xl rounded-3xl" />
              <div className="p-6 text-center space-y-4">
                {selectedAd.link && (
                  <a href={selectedAd.link} target="_blank" className="inline-block bg-white text-black px-10 py-3 font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(220,38,38,0.5)] uppercase rounded-full">Visitar Web</a>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="border-t-4 border-zinc-800 pt-8 pb-16 text-center">
          <p className="text-zinc-500 font-bold uppercase text-[10px] max-w-2xl mx-auto tracking-tighter leading-relaxed italic uppercase">AVISO: HOY QUIEN TOCA NO VENDE ENTRADAS. SOMOS UNA PLATAFORMA INFORMATIVA. LA VENTA Y ORGANIZACIÓN ES RESPONSABILIDAD DE LOS ORGANIZADORES.</p>
        </footer>
      </main>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; }
      `}</style>
    </div>
  );
}
