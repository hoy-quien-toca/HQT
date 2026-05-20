'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function SubmitEvent() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      is_approved: false, // Default to pending
    };

    const { error } = await supabase.from('events').insert([data]);

    if (error) {
      alert('Error al enviar el evento: ' + error.message);
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-6xl font-black uppercase italic text-yellow-400 mb-4">¡Recibido!</h1>
        <p className="text-xl font-bold uppercase tracking-widest">Tu fecha está en la cola de aprobación.</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="mt-8 bg-white text-black font-black uppercase px-8 py-3 hover:bg-yellow-400 transition-colors"
        >
          Enviar otra fecha
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6">
      <div className="max-w-2xl mx-auto border-8 border-white p-8 bg-zinc-900 shadow-[12px_12px_0px_0px_rgba(234,179,8,1)]">
        <h1 className="text-5xl font-black uppercase italic tracking-tighter text-yellow-400 mb-8 border-b-4 border-yellow-400 pb-4">
          Subir Fecha
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-black uppercase tracking-widest text-sm">Nombre de la Banda / Artista</label>
            <input required name="band_name" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
          </div>

          <div className="space-y-2">
            <label className="block font-black uppercase tracking-widest text-sm">Reseña / Bio del Show</label>
            <textarea name="description" rows={4} className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm">Fecha</label>
              <input required type="date" name="date" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm">Hora</label>
              <input required type="time" name="time" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-black uppercase tracking-widest text-sm">Lugar / Local</label>
            <input required name="venue" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" placeholder="Ej: Inmigrantes" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm">Departamento</label>
              <input required name="department" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm">Ciudad</label>
              <input required name="city" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm">Zona</label>
              <input name="zone" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm">Género</label>
              <input name="genre" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" placeholder="Ej: Punk Rock" />
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm">Tipo de Entrada</label>
              <select name="price_type" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold">
                <option value="range">Rango de Precio</option>
                <option value="free">Entrada Libre</option>
                <option value="gorra">A la Gorra</option>
                <option value="sobre">Sobre Artístico</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm">Precio Mínimo ($)</label>
              <input type="number" name="price_min" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm">Precio Máximo ($)</label>
              <input type="number" name="price_max" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t-2 border-zinc-700 pt-6">
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm">Venta vía:</label>
              <select name="ticket_type" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold">
                <option value="link">Link Web (Redtickets, etc)</option>
                <option value="whatsapp">WhatsApp de Contacto</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-widest text-sm">Link o Celular</label>
              <input required name="ticket_contact" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-400 text-black font-black uppercase text-2xl py-4 hover:bg-white transition-colors border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar para Aprobación'}
          </button>
        </form>

        <p className="mt-8 text-xs text-zinc-500 font-bold uppercase text-center leading-relaxed">
          Al enviar este formulario, aceptas que Hoy Quien Toca es una plataforma informativa y no se responsabiliza por la organización del evento ni la venta de entradas.
        </p>
      </div>
    </div>
  );
}
