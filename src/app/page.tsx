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
  const [interviews, setInterviews] = useState<any[]>([]);
  const [currentBottomAdIndex, setCurrentBottomAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  
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
      const today = new Date().toISOString().split('T')[0];
      const [eventRes, sponsorRes, interviewRes] = await Promise.all([
        supabase.from('events')
          .select('*')
          .eq('is_approved', true)
          .gte('date', today)
          .order('date', { ascending: true })
          .order('time', { ascending: true }),
        supabase.from('sponsors').select('*').eq('is_active', true),
        supabase.from('interviews')
          .select('*')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('published_at', { ascending: false })
          .limit(2)
      ]);

      if (eventRes.data) {
        const normalized = eventRes.data.map(e => ({
          ...e,
          department: e.department?.trim().toUpperCase(),
          genre: e.genre?.trim().toUpperCase()
        }));
        setAllEvents(normalized);
        setFeaturedEvents(normalized.filter(e => e.is_featured === true));
        setEvents(normalized);
      }
      if (sponsorRes.data) setSponsors(sponsorRes.data);
      if (interviewRes.data) setInterviews(interviewRes.data);

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
  
  const priceMapping: Record<string, string> = { 'range': 'PAGO', 'free': 'LIBRE', 'gorra': 'GORRA', 'sobre': 'SOBRE' };
  const activePriceTypes = Array.from(new Set(allEvents.map(e => priceMapping[e.price_type] || e.price_type))).filter(Boolean).sort();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.substring(2)}`;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const shareOnWhatsApp = (event: any) => {
    const text = `¡Mirá esto que encontré en Hoy Quien Toca! ¿Vamos?\n\n${event.band_name} en ${event.venue}\nFecha: ${formatDate(event.date)}\nLink: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTicketAction = (event: any) => {
    if (event.ticket_type === 'whatsapp') {
      window.open(`https://wa.me/${event.ticket_contact}`, '_blank');
    } else {
      window.open(event.ticket_contact, '_blank');
    }
  };

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case 'PLANAZO': return 'bg-yellow-400 text-black border-black';
      case 'SALIDA SEGURA': return 'bg-green-600 text-white border-white';
      case 'NO FALLA': return 'bg-white text-black border-black';
      default: return 'bg-red-600 text-white border-white';
    }
  };

  const renderPriceLabel = (event: any) => {
    if (event.price_type === 'free') return 'LIBRE';
    if (event.price_type === 'gorra') return 'GORRA';
    if (event.price_type === 'sobre') return 'SOBRE';
    const min = event.price_min;
    const max = event.price_max;
    if (min && max && min !== max) return `$${min}-$${max}`;
    return `$${min || max || '0'}`;
  };

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden text-left bg-zinc-900 font-black">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center font-black">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowLogoModal(true)} className="hover:scale-110 transition-transform cursor-pointer focus:outline-none">
               <Image src="/logo-rojo.jpg" alt="Logo Rojo" width={70} height={70} className="border-2 border-white rounded-2xl md:w-[90px] md:h-[90px] shadow-lg shadow-red-600/30" />
            </button>
            <div>
              <h1 className="text-2xl md:text-5xl font-franklin tracking-tighter text-red-600 leading-none">Hoy Quien Toca</h1>
              <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest mt-1">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
            </div>
          </div>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center">
            <Link href="/" className="text-red-600 underline decoration-2 underline-offset-4 font-black">Fechas</Link>
            <Link href="/interviews" className="hover:text-red-600 transition-colors font-black">Entrevistas</Link>
            <Link href="/contact" className="hover:text-red-600 transition-colors font-black">Contacto</Link>
            <Link href="/submit" className="border-2 border-red-600 text-red-600 px-4 py-1 bg-black rounded-full animate-pulse hover:bg-red-600 hover:text-white transition-colors font-black">Subir Fecha</Link>
          </nav>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-red-600 focus:outline-none">
            <svg className="w-8 h-8 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8 md:hidden text-center font-black">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl font-black font-black font-black">X</button>
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl font-franklin text-red-600 italic">Fechas</Link>
          <Link href="/interviews" onClick={() => setIsMenuOpen(false)} className="text-4xl font-franklin text-white italic">Entrevistas</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-4xl font-franklin text-white italic">Contacto</Link>
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl font-franklin border-4 border-red-600 text-red-600 px-8 py-4 rounded-full animate-pulse font-black">Subir Fecha</Link>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 md:space-y-12 relative z-10 font-black">
        
        {topSponsor && (
          <div onClick={() => setSelectedAd(topSponsor)} className="cursor-pointer block w-full h-20 md:h-24 bg-zinc-950 border-4 border-white overflow-hidden shadow-lg group relative rounded-2xl md:rounded-3xl">
            <img src={topSponsor.image_url} alt="Sponsor" className="w-full h-full object-cover transition-all duration-500" />
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-black px-2 py-0.5 border border-red-600 uppercase tracking-widest rounded-lg">Publicidad</div>
          </div>
        )}

        {featuredEvents.length > 0 && (
          <section 
            onClick={() => setSelectedEvent(featuredEvents[currentHeroIndex])}
            className="relative h-[300px] md:h-[500px] border-4 md:border-8 border-white bg-zinc-800 flex items-end p-4 md:p-10 overflow-hidden shadow-[12px_12px_0px_0px_rgba(220,38,38,0.3)] group rounded-[24px] md:rounded-[40px] cursor-pointer"
          >
            <div className="absolute inset-0">
               {featuredEvents[currentHeroIndex].flyer_url && (
                 <img src={featuredEvents[currentHeroIndex].flyer_url} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Hero" />
               )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
            
            <button 
              onClick={(e) => { e.stopPropagation(); prevHero(); }} 
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border-2 border-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextHero(); }} 
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border-2 border-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>

            <div className="relative z-20 w-full text-left font-black">
              <div className="flex gap-2 items-center mb-2">
                <span className={`px-3 py-0.5 text-[10px] md:text-sm font-black uppercase italic tracking-widest shadow-md rounded-full border-2 ${getTagStyle(featuredEvents[currentHeroIndex].suggestion_tag)}`}>
                  {featuredEvents[currentHeroIndex].suggestion_tag || 'DESTACADO'}
                </span>
                <span className="bg-white text-black px-3 py-0.5 text-[10px] md:text-sm font-black uppercase rounded-full border-2 border-red-600 shadow-md">
                   {renderPriceLabel(featuredEvents[currentHeroIndex])}
                </span>
              </div>
              <h2 className="text-3xl md:text-8xl font-franklin tracking-tighter mt-2 md:mt-4 drop-shadow-2xl text-white uppercase leading-none font-black">
                {featuredEvents[currentHeroIndex].band_name}
              </h2>
              <p className="text-xs md:text-2xl font-bold text-white uppercase tracking-widest border-l-4 md:border-l-8 border-red-600 pl-4 mt-2 md:mt-4 font-black">
                {formatDate(featuredEvents[currentHeroIndex].date)} @ {featuredEvents[currentHeroIndex].venue} {featuredEvents[currentHeroIndex].address && `- ${featuredEvents[currentHeroIndex].address}`}
              </p>
            </div>
          </section>
        )}

        {interviews.length > 0 && (
          <section className="space-y-6">
            <div className="flex justify-between items-center border-l-8 border-red-600 pl-4">
              <h2 className="text-2xl md:text-4xl font-franklin uppercase leading-none">Entrevistas</h2>
              <Link href="/interviews" className="text-xs md:text-sm font-black uppercase underline hover:text-red-600 transition-colors">Ver Todas</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 font-black">
              {interviews.map(int => (
                <Link key={int.id} href={`/interviews/${int.id}`} className="flex gap-4 bg-zinc-950 border-4 border-white p-3 hover:border-red-600 transition-all rounded-[24px] shadow-lg group">
                  <div className="w-24 h-24 shrink-0 overflow-hidden rounded-xl border-2 border-zinc-800">
                    <img src={int.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={int.title} />
                  </div>
                  <div className="flex flex-col justify-center text-left font-black">
                    <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full w-fit mb-1 italic font-black">BANDA: {int.band_name}</span>
                    <h3 className="text-sm md:text-xl font-franklin leading-tight uppercase group-hover:text-red-600 font-black">{int.title}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1 font-bold italic line-clamp-1">{int.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          <div className="flex-1 space-y-8 md:space-y-12">
            <section className="bg-red-600 text-white p-3 md:p-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 items-center font-black uppercase italic shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-2xl md:rounded-3xl">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] md:text-[10px] opacity-80 uppercase font-black font-black">Dpto</span>
                <select value={department} onChange={(e) => { setDepartment(e.target.value); applyFilters(allEvents, e.target.value, genre, ageRating, priceType); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-[10px] md:text-xs uppercase rounded-xl font-black font-black">
                  <option value="">Todos</option>
                  {activeDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] md:text-[10px] opacity-80 uppercase font-black font-black">Género</span>
                <select value={genre} onChange={(e) => { setGenre(e.target.value); applyFilters(allEvents, department, e.target.value, ageRating, priceType); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-[10px] md:text-xs uppercase rounded-xl font-black font-black">
                  <option value="">Todos</option>
                  {activeGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] md:text-[10px] opacity-80 uppercase font-black font-black">Edad</span>
                <select value={ageRating} onChange={(e) => { setAgeRating(e.target.value); applyFilters(allEvents, department, genre, e.target.value, priceType); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-[10px] md:text-xs uppercase rounded-xl font-black font-black">
                  <option value="">Todas</option>
                  {activeAgeRatings.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] md:text-[10px] opacity-80 uppercase font-black font-black">Entrada</span>
                <select value={priceType} onChange={(e) => { setPriceType(e.target.value); applyFilters(allEvents, department, genre, ageRating, e.target.value); }} className="bg-black text-white p-2 border-2 border-white focus:outline-none font-bold text-[10px] md:text-xs uppercase rounded-xl font-black font-black">
                  <option value="">Todas</option>
                  {activePriceTypes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button onClick={() => {setDepartment(''); setGenre(''); setAgeRating(''); setPriceType(''); setEvents(allEvents);}} className="col-span-full text-[10px] underline hover:text-black font-black uppercase text-center font-black font-franklin">Limpiar Filtros</button>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 font-black">
              {loading ? (
                <p className="col-span-full text-center text-3xl font-franklin animate-pulse text-red-600 uppercase font-black">Cargando...</p>
              ) : events.length === 0 ? (
                <div className="col-span-full text-center py-20 border-4 border-dashed border-zinc-700 text-zinc-500 font-black uppercase rounded-3xl font-black">No hay resultados...</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} onClick={() => setSelectedEvent(event)} className="border-4 border-white p-2 md:p-4 hover:translate-x-1 hover:-translate-y-1 transition-all bg-zinc-950 shadow-[6px_6px_0px_0px_rgba(220,38,38,0.5)] flex flex-row md:flex-col items-center md:items-stretch gap-3 md:gap-4 group/card relative overflow-hidden cursor-pointer rounded-[24px] md:rounded-[32px] h-36 md:h-auto font-black">
                    
                    {event.suggestion_tag && (
                      <div className={`absolute top-2 -left-12 w-32 text-center py-0.5 font-black text-[7px] md:text-[10px] uppercase -rotate-45 z-30 border-y shadow-xl tracking-tighter font-black ${getTagStyle(event.suggestion_tag)}`}>
                        {event.suggestion_tag}
                      </div>
                    )}

                    <div className="w-24 h-24 md:w-full md:aspect-square bg-zinc-800 shrink-0 border-2 border-zinc-700 relative flex items-center justify-center overflow-hidden rounded-xl md:rounded-2xl shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] font-black">
                      {event.flyer_url ? <img src={event.flyer_url} alt="Flyer" className={`object-cover w-full h-full transition-all duration-500 ${(event.is_sold_out || event.is_suspended) ? 'grayscale blur-[1px]' : 'group-hover/card:scale-105'}`} /> : <div className="text-zinc-600 font-black italic uppercase text-center text-[10px] font-franklin font-black">FLYER</div>}
                      {event.is_sold_out && <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center text-white font-black uppercase text-[10px] rotate-12 font-black">AGOTADO</div>}
                      {event.is_suspended && <div className="absolute inset-0 bg-zinc-700/60 flex items-center justify-center text-white font-black uppercase text-[10px] rotate-12 font-black">SUSPENDIDO</div>}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center text-left space-y-0.5 md:space-y-2 font-black">
                      <div className="flex justify-between items-start font-black">
                        <h3 className="text-base md:text-2xl font-franklin leading-none truncate group-hover/card:text-red-600 transition-colors font-black">{event.band_name}</h3>
                      </div>
                      <p className="font-black text-red-600 tracking-tighter uppercase text-[10px] md:text-sm font-black">{formatDate(event.date)} - {formatTime(event.time)}hs</p>
                      <p className="text-[9px] md:text-[10px] uppercase tracking-tight text-zinc-400 font-bold leading-none md:leading-tight truncate font-black">{event.venue}, {event.city}</p>
                      
                      <div className="flex gap-2 mt-1 flex-wrap font-black">
                         <span className="text-[7px] md:text-[8px] bg-white text-black px-2 py-0.5 uppercase font-black rounded-full border border-red-600 font-black">{renderPriceLabel(event)}</span>
                         <span className="text-[7px] md:text-[8px] bg-red-600 text-white px-2 py-0.5 uppercase font-black rounded-full border border-white font-black">{event.genre || 'Show'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          <aside className="lg:w-72 space-y-8 relative z-10 text-left uppercase font-black">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:space-y-6 pt-4 font-black">
              {sidebarSponsors.map(ad => (
                <div key={ad.id} onClick={() => setSelectedAd(ad)} className="block border-4 border-white bg-zinc-950 p-2 shadow-[8px_8px_0px_0px_rgba(220,38,38,0.3)] hover:-translate-x-1 transition-transform group cursor-pointer rounded-2xl">
                  <div className="aspect-[4/5] overflow-hidden border-2 border-zinc-800 rounded-xl">
                    <img src={ad.image_url} alt="Sponsor" className="w-full h-full object-cover transition-all duration-500" />
                  </div>
                </div>
              ))}
              <Link href="/contact" className="block border-4 border-dashed border-zinc-700 p-8 text-center hover:border-red-600 hover:text-red-600 transition-colors group text-zinc-500 lg:col-span-1 col-span-full rounded-2xl font-black">
                <span className="text-xs font-black uppercase group-hover:text-red-600 text-center block tracking-widest italic font-franklin font-black">Publicá acá</span>
              </Link>
            </div>
          </aside>
        </div>

        {activeBottomAd && (
          <section className="pt-8 md:pt-12 font-black">
             <div onClick={() => setSelectedAd(activeBottomAd)} className="cursor-pointer block w-full h-32 md:h-64 bg-zinc-950 border-4 md:border-8 border-white overflow-hidden shadow-[12px_12px_0px_0px_rgba(220,38,38,0.5)] group relative rounded-[32px] md:rounded-[40px]">
                <img src={activeBottomAd.image_url} alt="Sponsor" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute top-4 left-4 bg-black/80 text-white text-[8px] md:text-[10px] font-black px-4 py-1 border-2 border-red-600 uppercase tracking-widest rounded-full font-black">Auspiciante Destacado</div>
             </div>
        </section>
        )}

        <footer className="border-t-4 border-zinc-800 pt-8 pb-16 text-center font-black">
          <p className="text-zinc-500 font-bold uppercase text-[10px] max-w-2xl mx-auto tracking-tighter leading-relaxed italic font-black">AVISO: HOY QUIEN TOCA NO VENDE ENTRADAS. SOMOS UNA PLATAFORMA INFORMATIVA. LA VENTA Y ORGANIZACIÓN ES RESPONSABILIDAD DE LOS ORGANIZADORES.</p>
        </footer>
      </main>

      {selectedEvent && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-black overflow-y-auto">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm font-black" onClick={() => setSelectedEvent(null)} />
            <div className="relative w-full max-w-4xl bg-zinc-900 border-4 md:border-8 border-white shadow-[20px_20px_0px_0px_rgba(220,38,38,0.5)] flex flex-col md:flex-row overflow-y-auto max-h-[90vh] rounded-[32px] md:rounded-[40px] font-black">
              <button onClick={() => setSelectedEvent(null)} className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-red-600 text-white w-10 h-10 font-black text-xl border-4 border-white z-[210] hover:bg-black transition-colors text-center flex items-center justify-center rounded-full shadow-lg font-black">X</button>
              <div className="md:w-1/2 bg-zinc-800 border-b-4 md:border-b-0 md:border-r-4 border-white flex items-center justify-center p-4 font-black">
                {selectedEvent.flyer_url ? <img src={selectedEvent.flyer_url} alt="Flyer" className="max-w-full h-auto shadow-2xl border-4 border-white rounded-2xl font-black" /> : <p className="font-black italic text-zinc-600 uppercase text-center font-franklin font-black">SIN FLYER</p>}
              </div>
              <div className="md:w-1/2 p-6 md:p-8 space-y-6 text-left font-black">
                <div>
                  <div className="flex gap-2 font-black font-black">
                    <span className="bg-red-600 text-white px-2 py-1 text-[10px] font-black uppercase italic rounded-md shadow-sm font-black font-black">{selectedEvent.genre}</span>
                    <span className="bg-white text-black px-2 py-1 text-[10px] font-black uppercase italic rounded-md shadow-sm border border-red-600 font-black font-black">{selectedEvent.age_rating || 'ATP'}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-franklin tracking-tighter mt-2 text-white leading-none uppercase font-black font-black">{selectedEvent.band_name}</h2>
                </div>
                <div className="space-y-1 text-white font-black font-black">
                  <p className="text-xl font-bold uppercase font-black">{formatDate(selectedEvent.date)} - {formatTime(selectedEvent.time)}hs</p>
                  <p className="text-sm font-black text-zinc-400 uppercase italic font-black">{selectedEvent.venue} - {selectedEvent.address} - {selectedEvent.city}, {selectedEvent.department}</p>
                </div>
                <div className="border-t-2 border-zinc-800 pt-6 font-black">
                  <h4 className="text-xs font-black uppercase text-zinc-500 mb-2 italic font-black">Reseña / Bio del Show</h4>
                  <div className="text-zinc-200 leading-relaxed font-bold space-y-4 max-h-48 overflow-y-auto pr-4 text-xs uppercase custom-scrollbar font-black">
                    {selectedEvent.description?.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>) || <p className="italic text-zinc-600 text-sm font-black">No hay reseña disponible.</p>}
                  </div>
                </div>
                <div className="pt-6 border-t-2 border-zinc-800 space-y-4 font-black">
                  <p className="text-2xl md:text-3xl font-franklin text-red-600 tracking-tighter uppercase font-black">
                    {selectedEvent.is_suspended ? 'SUSPENDIDO' : selectedEvent.is_sold_out ? 'AGOTADO' : (selectedEvent.price_type === 'free' ? 'ENTRADA LIBRE' : selectedEvent.price_type === 'gorra' ? 'A LA GORRA' : selectedEvent.price_type === 'sobre' ? 'SOBRE ARTÍSTICO' : (selectedEvent.price_min && selectedEvent.price_max && selectedEvent.price_min !== selectedEvent.price_max) ? `$${selectedEvent.price_min} - $${selectedEvent.price_max}` : `$${selectedEvent.price_min || selectedEvent.price_max || '0'}`)}
                  </p>
                  
                  {(!selectedEvent.is_sold_out && !selectedEvent.is_suspended) && (
                    <div className="flex gap-4 font-black font-black">
                      <button 
                        onClick={() => handleTicketAction(selectedEvent)} 
                        className="flex-1 font-black uppercase py-4 text-lg md:text-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all rounded-full font-black bg-red-600 text-white hover:bg-white hover:text-black font-black"
                      >
                        {selectedEvent.ticket_type === 'whatsapp' ? 'WhatsApp' : 'Entradas'}
                      </button>
                      <button onClick={() => shareOnWhatsApp(selectedEvent)} className="bg-green-600 text-white p-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:bg-black transition-colors flex items-center justify-center rounded-full shadow-lg font-black font-black">
                        <svg className="w-8 h-8 font-black" fill="currentColor" viewBox="0 0 24 24 font-black"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {selectedAd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pt-16 sm:pt-4 font-black overflow-y-auto">
          <div className="absolute inset-0 bg-black/95 backdrop-blur font-black" onClick={() => setSelectedAd(null)} />
          <div className="relative max-w-2xl w-full bg-zinc-900 border-4 sm:border-8 border-white p-4 pt-12 sm:pt-4 shadow-[20px_20px_0px_0px_rgba(220,38,38,0.3)] text-center rounded-3xl sm:rounded-[40px] font-black my-auto">
            <button
              type="button"
              onClick={() => setSelectedAd(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-red-600 text-white w-10 h-10 sm:w-12 sm:h-12 font-black text-xl sm:text-2xl border-4 border-white hover:bg-black transition-colors z-[210] flex items-center justify-center shadow-xl rounded-full font-black"
            >
              X
            </button>
            <img src={selectedAd.image_url} alt="Sponsor" className="w-full h-auto border-4 border-zinc-800 shadow-2xl rounded-3xl font-black" />
            <div className="p-4 sm:p-6 text-center space-y-4 font-black">
              {selectedAd.link && (
                <a href={selectedAd.link} target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-black px-8 sm:px-10 py-3 font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(220,38,38,0.5)] rounded-full border-2 border-black italic font-black">Visitar Web</a>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogoModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pt-16 sm:pt-4 font-black overflow-y-auto">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl font-black" onClick={() => setShowLogoModal(false)} />
          <div className="relative max-w-lg w-full bg-zinc-900 border-4 sm:border-8 border-white p-4 pt-12 sm:pt-4 shadow-[30px_30px_0px_0px_rgba(220,38,38,0.5)] text-center rounded-3xl sm:rounded-[50px] font-black my-auto">
            <button
              type="button"
              onClick={() => setShowLogoModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-red-600 text-white w-10 h-10 sm:w-14 sm:h-14 font-black text-xl sm:text-3xl border-4 border-white hover:bg-black transition-colors z-[210] flex items-center justify-center shadow-2xl rounded-full font-black"
            >
              X
            </button>
            <Image src="/logo-rojo.jpg" alt="Logo Grande" width={800} height={800} className="w-full h-auto rounded-3xl sm:rounded-[40px] border-4 border-zinc-800 shadow-2xl font-black" />
            <div className="p-4 sm:p-6 font-black">
              <h3 className="text-3xl sm:text-4xl font-franklin text-red-600 leading-none">Hoy Quien Toca</h3>
              <p className="text-xs font-black uppercase tracking-widest text-white/60 mt-2 italic">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; }
      `}</style>
    </div>
  );
}
