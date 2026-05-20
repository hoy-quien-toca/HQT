'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [department, setDepartment] = useState('');
  const [genre, setGenre] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    let eventQuery = supabase.from('events').select('*').eq('is_approved', true).order('date', { ascending: true });
    if (department) eventQuery = eventQuery.eq('department', department);
    if (genre) eventQuery = eventQuery.ilike('genre', `%${genre}%`);
    if (date) eventQuery = eventQuery.eq('date', date);

    const { data: eventData } = await eventQuery;
    const { data: adData } = await supabase.from('ads').select('*').eq('is_active', true);

    if (eventData) {
      setEvents(eventData);
      setFeaturedEvent(eventData.find(e => e.is_featured) || eventData[0]);
    }
    if (adData) setAds(adData);
    setLoading(false);
  }

  const topAd = ads.find(a => a.position === 'top');
  const sidebarAds = ads.filter(a => a.position === 'sidebar');

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
    <div className="min-h-screen bg-black text-white font-sans">
      <header className="border-b-4 border-yellow-400 p-6 flex justify-between items-center bg-zinc-900 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Image src="/logo.jpg" alt="Logo" width={60} height={60} className="border-2 border-white" />
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-yellow-400">Hoy Quien Toca</h1>
        </div>
        <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm">
          <Link href="/" className="hover:text-yellow-400 underline decoration-2">Fechas</Link>
          <Link href="/interviews" className="hover:text-yellow-400">Entrevistas</Link>
          <Link href="/submit" className="hover:text-yellow-400">Subir Fecha</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-12">
        {topAd && (
          <a href={topAd.link} target="_blank" className="block w-full h-24 bg-zinc-900 border-4 border-white overflow-hidden">
            <img src={topAd.image_url} alt="Ad" className="w-full h-full object-cover" />
          </a>
        )}

        {featuredEvent && (
          <section className="relative h-[400px] border-8 border-white bg-zinc-800 flex items-end p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80 z-10" />
            <div className="relative z-20">
              <span className="bg-red-600 text-white px-3 py-1 text-sm font-black uppercase italic">{featuredEvent.suggestion_tag || 'Planazo'}</span>
              <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter">{featuredEvent.band_name}</h2>
              <p className="text-xl font-bold text-yellow-400 uppercase">{featuredEvent.date} @ {featuredEvent.venue}</p>
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-12">
            <section className="bg-yellow-400 text-black p-4 flex flex-wrap gap-4 items-center font-black uppercase italic shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
              <span className="text-xl">Filtrar:</span>
              <select onChange={(e) => setDepartment(e.target.value)} className="bg-black text-white p-2 border-2 border-white">
                <option value="">Departamento</option>
                <option value="Montevideo">Montevideo</option>
                <option value="Canelones">Canelones</option>
              </select>
              <input type="text" placeholder="Género..." onChange={(e) => setGenre(e.target.value)} className="bg-black text-white p-2 border-2 border-white w-32" />
              <button onClick={fetchData} className="bg-red-600 text-white px-6 py-2">Buscar</button>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {loading ? (
                <p className="col-span-full text-center text-4xl font-black text-yellow-400">CARGANDO...</p>
              ) : events.length === 0 ? (
                <div className="col-span-full text-center py-20 border-4 border-dashed border-zinc-700 text-zinc-500 font-black uppercase italic">No hay fechas próximamente...</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="border-4 border-white p-4 bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(234,179,8,1)] flex flex-col">
                    <div className="aspect-square bg-zinc-800 mb-4 border-2 border-zinc-700 flex items-center justify-center overflow-hidden">
                      {event.flyer_url ? <img src={event.flyer_url} alt="Flyer" className="object-cover w-full h-full grayscale" /> : "Flyer"}
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="text-2xl font-black uppercase leading-none">{event.band_name}</h3>
                      <p className="font-bold text-yellow-400">{event.date} - {event.time}hs</p>
                      <p className="text-xs text-zinc-400 uppercase font-bold">{event.venue}, {event.city}</p>
                      <p className="text-lg font-black italic text-white pt-2">
                        {event.price_type === 'free' ? 'ENTRADA LIBRE' : `$${event.price_min}${event.price_max ? ` - $${event.price_max}` : ''}`}
                      </p>
                    </div>
                    <div className="pt-6 flex gap-2">
                      <button onClick={() => handleTicketAction(event)} className="flex-1 bg-white text-black font-black uppercase py-2 text-sm">Entradas</button>
                      <button onClick={() => shareOnWhatsApp(event)} className="bg-green-600 text-white p-2">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          <aside className="lg:w-72 space-y-8">
            <h3 className="text-xl font-black uppercase italic text-yellow-400 border-b-4 border-yellow-400 pb-2">Auspician</h3>
            <div className="space-y-6">
              {sidebarAds.length === 0 ? <p className="text-zinc-600 font-bold uppercase text-xs italic">Espacio disponible...</p> : sidebarAds.map(ad => (
                <a key={ad.id} href={ad.link} target="_blank" className="block border-4 border-white bg-zinc-900 p-2">
                  <img src={ad.image_url} alt={ad.client_name} className="w-full h-auto grayscale" />
                </a>
              ))}
              <Link href="/contact" className="block border-4 border-dashed border-zinc-700 p-4 text-center text-xs font-black text-zinc-500 uppercase">Publicá acá</Link>
            </div>
          </aside>
        </div>

        <footer className="border-t-4 border-zinc-800 pt-8 pb-16 text-center">
          <p className="text-zinc-500 font-bold uppercase text-[10px] max-w-2xl mx-auto">
            AVISO: HOY QUIEN TOCA NO VENDE ENTRADAS. SOMOS UNA PLATAFORMA INFORMATIVA. LA VENTA Y ORGANIZACIÓN ES RESPONSABILIDAD DE LOS ORGANIZADORES.
          </p>
        </footer>
      </main>
    </div>
  );
}
