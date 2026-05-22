'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

const DEPARTAMENTOS = [
  "MONTEVIDEO", "CANELONES", "MALDONADO", "COLONIA", "SAN JOSE", 
  "FLORIDA", "LAVALLEJA", "ROCHA", "TREINTA Y TRES", "CERRO LARGO", 
  "RIVERA", "TACUAREMBÓ", "DURAZNO", "SORIANO", "RIO NEGRO", 
  "PAYSANDU", "SALTO", "ARTIGAS"
];

const GENEROS = [
  "ROCK", "CUMBIA", "PLENA", "ELECTRONICA", "TECHNO", "HOUSE", "INDIE", 
  "POP", "TRAP", "REGGAETON", "HIP-HOP/RAP", "PUNK ROCK", "METAL", 
  "FOLKLORE", "TANGO", "JAZZ", "BLUES", "FUNK", "REGGUE", "SKA", 
  "ALTERNATIVO", "CARNAVAL", "MURGA", "TROPICAL", "LATINA", 
  "ACUSTICO", "COVERS", "FIESTA", "DJ-SET", "UNDER"
];

export default function SubmitEvent() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [flyerUrl, setFlyerUrl] = useState('');
  const [ticketType, setTicketType] = useState('link');
  const [priceType, setPriceType] = useState('range');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `flyers/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('hqt-assets').upload(filePath, file);
    if (uploadError) alert('Error: ' + uploadError.message);
    else {
      const { data } = supabase.storage.from('hqt-assets').getPublicUrl(filePath);
      setFlyerUrl(data.publicUrl);
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    let ticketContact = formData.get('ticket_contact') as string;
    if (ticketType === 'whatsapp' && ticketContact && !ticketContact.startsWith('+')) {
      ticketContact = '+598' + ticketContact.replace(/\s/g, '');
    }
    const data = {
      band_name: formData.get('band_name'),
      description: formData.get('description'),
      date: formData.get('date'),
      time: formData.get('time'),
      venue: formData.get('venue'),
      address: formData.get('address'),
      department: formData.get('department'),
      city: formData.get('city'),
      genre: formData.get('genre'),
      age_rating: formData.get('age_rating'),
      price_type: formData.get('price_type'),
      price_min: formData.get('price_min') ? parseInt(formData.get('price_min') as string) : null,
      price_max: formData.get('price_max') ? parseInt(formData.get('price_max') as string) : null,
      ticket_type: ticketType,
      ticket_contact: ticketContact,
      flyer_url: flyerUrl,
      is_approved: false,
    };
    const { error } = await supabase.from('events').insert([data]);
    if (error) alert('Error al enviar el evento: ' + error.message);
    else setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden bg-zinc-900">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center font-black">
          <Link href="/" className="flex items-center gap-6">
            <Image src="/logo-rojo.jpg" alt="Logo Rojo" width={50} height={50} className="border border-white rounded-xl md:w-[65px] md:h-[65px]" />
            <div>
              <h1 className="text-2xl md:text-5xl font-brusher tracking-tighter uppercase text-red-600 leading-none">Hoy Quien Toca</h1>
              <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest mt-1">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
            </div>
          </Link>
          <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center">
            <Link href="/" className="hover:text-red-600 font-black">Fechas</Link>
            <Link href="/interviews" className="hover:text-red-600 font-black">Entrevistas</Link>
            <Link href="/contact" className="hover:text-red-600 font-black">Contacto</Link>
            <Link href="/submit" className="border-2 border-red-600 text-red-600 px-4 py-1 bg-black rounded-full animate-pulse hover:bg-red-600 hover:text-white transition-colors font-black">Subir Fecha</Link>
          </nav>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-red-600">
            <svg className="w-8 h-8 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8 md:hidden text-center font-black">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl font-black font-black">X</button>
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic font-black font-brusher">Fechas</Link>
          <Link href="/interviews" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic font-black font-brusher">Entrevistas</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic font-black font-brusher">Contacto</Link>
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl uppercase border-4 border-red-600 text-red-600 px-8 py-4 rounded-full animate-pulse font-black font-brusher">Subir Fecha</Link>
        </div>
      )}

      <main className="max-w-3xl mx-auto p-4 md:p-12 relative z-10 font-black">
        {submitted ? (
          <div className="border-8 border-white p-12 bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(220,38,38,0.5)] rounded-[40px] text-center space-y-6 font-black">
            <h2 className="text-6xl font-brusher uppercase text-red-600 leading-none font-black">¡Recibido!</h2>
            <p className="text-xl font-bold uppercase tracking-widest italic font-black font-black">Tu fecha está en la cola de aprobación.</p>
            <Link href="/" className="inline-block bg-white text-black px-12 py-4 rounded-full font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-lg font-black font-black">Volver al Inicio</Link>
          </div>
        ) : (
          <div className="border-8 border-white p-6 md:p-12 bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(220,38,38,0.5)] rounded-[40px] relative font-black font-black">
            <Link href="/" className="absolute -top-4 -right-4 bg-red-600 text-white w-12 h-12 flex items-center justify-center font-black text-2xl border-4 border-white hover:bg-black transition-colors rounded-full shadow-xl font-black font-black">X</Link>
            <h2 className="text-5xl md:text-7xl font-brusher uppercase text-red-600 mb-2 leading-none font-black font-black">Subir Fecha</h2>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-10 italic font-black font-black font-black">Unite a la cartelera musical más grande de Uruguay</p>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left font-black uppercase">
              <div className="md:col-span-2 space-y-2 font-black font-black">
                <label className="text-xs text-red-600 font-black">Flyer del Show</label>
                <div className="border-4 border-dashed border-zinc-700 p-4 text-center relative rounded-3xl hover:border-red-600 transition-colors bg-zinc-900 shadow-inner font-black font-black">
                  {flyerUrl ? <img src={flyerUrl} className="max-h-64 mx-auto rounded-2xl" /> : <p className="py-8 text-zinc-500 italic font-black font-black">{uploading ? 'Subiendo...' : 'Click para subir'}</p>}
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer font-black font-black" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2 font-black">
                <label className="text-xs text-red-600 font-black">Nombre Banda/Artista</label>
                <input required name="band_name" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none shadow-inner font-black uppercase" />
              </div>

              <div className="space-y-2 font-black font-black">
                <label className="text-xs text-red-600 font-black">Fecha</label>
                <input required type="date" name="date" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none font-black" />
              </div>
              <div className="space-y-2 font-black font-black">
                <label className="text-xs text-red-600 font-black">Hora</label>
                <input required type="time" name="time" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none font-black" />
              </div>

              <div className="md:col-span-2 space-y-2 font-black">
                <label className="text-xs text-red-600 font-black">Reseña</label>
                <textarea name="description" rows={3} className="w-full bg-zinc-900 border-4 border-white p-4 rounded-[32px] focus:border-red-600 outline-none font-black uppercase" />
              </div>

              <div className="space-y-2 font-black">
                <label className="text-xs text-red-600 font-black">Lugar / Local</label>
                <input required name="venue" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none shadow-inner font-black uppercase" placeholder="Ej: Inmigrantes" />
              </div>
              <div className="space-y-2 font-black">
                <label className="text-xs text-red-600 font-black">Dirección del evento</label>
                <input required name="address" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none shadow-inner font-black uppercase" placeholder="Ej: Paullier 1234" />
              </div>

              <div className="space-y-2 font-black">
                <label className="text-xs text-red-600 font-black font-black">Departamento</label>
                <select name="department" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none uppercase font-black font-black">
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-2 font-black font-black font-black">
                <label className="text-xs text-red-600 font-black font-black">Ciudad</label>
                <input required name="city" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none shadow-inner font-black uppercase" />
              </div>

              <div className="space-y-2 font-black font-black">
                <label className="text-xs text-red-600 font-black">Género</label>
                <select required name="genre" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none uppercase font-black">
                  {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-2 font-black font-black font-black">
                <label className="text-xs text-red-600 font-black font-black">Clasificación</label>
                <select name="age_rating" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none uppercase font-black">
                   <option value="ATP">ATP</option>
                   <option value="+5">+5</option><option value="+7">+7</option><option value="+10">+10</option>
                   <option value="+12">+12</option><option value="+15">+15</option><option value="+18">+18</option>
                </select>
              </div>

              <div className="md:col-span-2 border-t-2 border-zinc-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 font-black font-black">
                  <label className="text-xs text-red-600 font-black">Tipo de Entrada</label>
                  <select 
                    name="price_type" 
                    value={priceType} 
                    onChange={(e) => setPriceType(e.target.value)}
                    className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none font-black font-black"
                  >
                    <option value="range">PAGO (Entradas)</option>
                    <option value="free">ENTRADA LIBRE</option>
                    <option value="gorra">A LA GORRA</option>
                    <option value="sobre">SOBRE ARTÍSTICO</option>
                  </select>
                </div>
                {priceType === 'range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 font-black font-black">
                      <label className="text-[10px] text-red-600 font-black">Precio Mín ($)</label>
                      <input type="number" name="price_min" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none font-black font-black" />
                    </div>
                    <div className="space-y-2 font-black font-black">
                      <label className="text-[10px] text-red-600 font-black">Precio Máx ($)</label>
                      <input type="number" name="price_max" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none font-black font-black" />
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 font-black font-black">
                  <label className="text-xs text-red-600 font-black">¿Dónde comprar?</label>
                  <select value={ticketType} onChange={(e) => setTicketType(e.target.value)} className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none font-black font-black">
                    <option value="link">Página Web / Link</option>
                    <option value="whatsapp">Venta por WhatsApp</option>
                  </select>
                </div>
                <div className="space-y-2 font-black font-black">
                  <label className="text-xs text-red-600 font-black font-black font-black">{ticketType === 'whatsapp' ? 'Celular de contacto' : 'Link de compra'}</label>
                  <input required name="ticket_contact" placeholder={ticketType === 'whatsapp' ? '099 123 456' : 'https://...'} className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none font-black" />
                </div>
              </div>

              <button disabled={loading || uploading} className="md:col-span-2 w-full bg-red-600 text-white font-black uppercase text-2xl py-6 rounded-full hover:bg-white hover:text-black transition-all border-4 border-white shadow-xl italic tracking-tighter disabled:opacity-50 font-black font-black">
                {loading ? 'Enviando...' : 'Subir Evento Ahora'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
