'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `flyers/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('hqt-assets').upload(filePath, file);
    if (uploadError) {
      alert('Error subiendo imagen: ' + uploadError.message);
    } else {
      const { data } = supabase.storage.from('hqt-assets').getPublicUrl(filePath);
      setFlyerUrl(data.publicUrl);
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      band_name: formData.get('band_name'),
      description: formData.get('description'),
      date: formData.get('date'),
      time: formData.get('time'),
      venue: formData.get('venue'),
      department: formData.get('department'),
      city: formData.get('city'),
      zone: formData.get('zone'),
      genre: formData.get('genre'),
      price_type: formData.get('price_type'),
      price_min: formData.get('price_min') || null,
      price_max: formData.get('price_max') || null,
      ticket_type: formData.get('ticket_type'),
      ticket_contact: formData.get('ticket_contact'),
      age_rating: formData.get('age_rating'),
      flyer_url: flyerUrl,
      is_approved: false,
    };
    const { error } = await supabase.from('events').insert([data]);
    if (error) alert('Error al enviar el evento: ' + error.message);
    else setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full border-8 border-white p-12 bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(234,179,8,1)]">
          <h1 className="text-6xl font-black uppercase italic text-yellow-400 mb-4 tracking-tighter">¡Recibido!</h1>
          <p className="text-xl font-bold uppercase tracking-widest text-white">Tu fecha está en la cola de aprobación.</p>
          <div className="flex flex-col gap-4 mt-12">
            <button onClick={() => setSubmitted(false)} className="bg-white text-black font-black uppercase py-4 hover:bg-yellow-400 transition-colors">Enviar otra fecha</button>
            <Link href="/" className="text-zinc-500 font-black uppercase hover:text-white underline underline-offset-8">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 relative">
      <div className="max-w-2xl mx-auto border-8 border-white p-8 bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(234,179,8,1)] relative">
        <Link href="/" className="absolute -top-4 -right-4 bg-red-600 text-white w-12 h-12 flex items-center justify-center font-black text-2xl border-4 border-white hover:bg-black transition-colors z-30">X</Link>
        <h1 className="text-5xl font-black uppercase italic tracking-tighter text-yellow-400 mb-8 border-b-4 border-yellow-400 pb-4">Subir Fecha</h1>
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2 text-white font-black">
            <label className="block font-black uppercase tracking-widest text-sm text-white">Flyer del Show</label>
            <div className="border-4 border-dashed border-zinc-700 p-4 text-center relative group hover:border-yellow-400 transition-colors">
              {flyerUrl ? <img src={flyerUrl} alt="Preview" className="max-h-64 mx-auto mb-4 border-2 border-white" /> : <div className="py-8"><p className="text-zinc-500 font-black uppercase italic">{uploading ? 'Subiendo...' : 'Haz clic para subir imagen'}</p></div>}
              <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block font-black uppercase tracking-widest text-sm text-white">Nombre de la Banda / Artista</label>
            <input required name="band_name" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white uppercase" />
          </div>
          <div className="space-y-2">
            <label className="block font-black uppercase tracking-widest text-sm text-white">Reseña / Bio del Show</label>
            <textarea name="description" rows={4} className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm text-white">Fecha</label>
              <input required type="date" name="date" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white" />
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm text-white">Hora</label>
              <input required type="time" name="time" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm text-white">Clasificación</label>
              <select name="age_rating" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white">
                <option value="ATP">ATP (Todo público)</option>
                <option value="+5">+5 años</option><option value="+7">+7 años</option><option value="+10">+10 años</option>
                <option value="+12">+12 años</option><option value="+15">+15 años</option><option value="+18">+18 años</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm text-white">Tipo de Entrada</label>
              <select name="price_type" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white">
                <option value="range">PAGO (Rango)</option>
                <option value="free">ENTRADA LIBRE</option>
                <option value="gorra">A LA GORRA</option>
                <option value="sobre">SOBRE ARTÍSTICO</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block font-black uppercase tracking-widest text-sm text-white">Lugar / Local</label>
            <input required name="venue" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white uppercase" placeholder="Ej: Inmigrantes" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm text-white">Departamento</label>
              <select required name="department" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white">
                {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm text-white">Ciudad</label>
              <input required name="city" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white uppercase" />
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm text-white">Zona</label>
              <input name="zone" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white uppercase" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block font-black uppercase tracking-widest text-sm text-white">Género</label>
            <select required name="genre" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white">
              {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm text-white">Precio Mínimo ($)</label>
              <input type="number" name="price_min" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white" />
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm text-white">Precio Máximo ($)</label>
              <input type="number" name="price_max" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t-2 border-zinc-700 pt-6">
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm text-white">Venta vía:</label>
              <select name="ticket_type" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white">
                <option value="link">Link Web</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm text-white">Link o Celular</label>
              <input required name="ticket_contact" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold text-white" />
            </div>
          </div>
          <button type="submit" disabled={loading || uploading} className="w-full bg-yellow-400 text-black font-black uppercase text-2xl py-4 hover:bg-white transition-colors border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] disabled:opacity-50 tracking-tighter italic">{loading ? 'Enviando...' : 'Enviar para Aprobación'}</button>
        </form>
      </div>
    </div>
  );
}
