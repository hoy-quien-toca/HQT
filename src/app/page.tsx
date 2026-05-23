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
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('is_approved', true)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      const { data: sponsorData } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true);

      const { data: interviewData } = await supabase
        .from('interviews')
        .select('*')
        .eq('is_active', true)
        .limit(2)
        .order('published_at', { ascending: false });

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
      if (interviewData) setInterviews(interviewData);

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
    return `$${event.price_min}${event.price_max ? `-$${event.price_max}` : ''}`;
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
            <Link href="/" className="text-red-600 underline decoration-2 underline-offset-4 font-black font-black">Fechas</Link>
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
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl font-franklin border-4 border-red-600 text-red-600 px-8 py-4 rounded-full animate-pulse">Subir Fecha</Link>
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
          <section className="relative h-[300px] md:h-[500px] border-4 md:border-8 border-white bg-zinc-800 flex items-end p-4 md:p-10 overflow-hidden shadow-[12px_12px_0px_0px_rgba(220,38,38,0.3)] group rounded-[24px] md:rounded-[40px]">
            <div className="absolute inset-0">
               {featuredEvents[currentHeroIndex].flyer_url && (
                 <img src={featuredEvents[currentHeroIndex].flyer_url} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Hero" />
               )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
            
            <button onClick={prevHero} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border-2 border-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button onClick={nextHero} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border-2 border-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
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
              <button onClick={() => setSelectedEvent(featuredEvents[currentHeroIndex])} className="mt-4 md:mt-8 bg-white text-black font-black uppercase px-4 py-1.5 md:px-8 md:py-3 hover:bg-red-600 hover:text-white transition-all text-[10px] md:text-base rounded-full shadow-lg">Ver Detalles</button>
            </div>
          </section>
        )}

        {/* AGREGADO: Sección de Entrevistas en la Home */}
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
                    <img src={int.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                  <div className="flex flex-col justify-center text-left font-black">
                    <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full w-fit mb-1 italic">BANDA: {int.band_name}</span>
                    <h3 className="text-sm md:text-xl font-franklin leading-tight uppercase group-hover:text-red-600">{int.title}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1 font-bold italic line-clamp-1">{int.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          <div className="flex-1 space-y-8 md:space-y-12">
...
      </main>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; }
      `}</style>
    </div>
  );
}
