'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    const { error } = await supabase.from('contact_messages').insert([data]);

    if (error) {
      alert('Error al enviar el mensaje: ' + error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full border-8 border-white p-12 bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(234,179,8,1)]">
          <h1 className="text-6xl font-black uppercase italic text-yellow-400 mb-4">¡Enviado!</h1>
          <p className="text-xl font-bold uppercase tracking-widest text-white">Te responderemos pronto.</p>
          <div className="flex flex-col gap-4 mt-12">
            <button onClick={() => setSent(false)} className="bg-white text-black font-black uppercase py-4 hover:bg-yellow-400 transition-colors">Enviar otro mensaje</button>
            <Link href="/" className="text-zinc-500 font-black uppercase hover:text-white underline underline-offset-8">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 relative">
      <div className="max-w-2xl mx-auto border-8 border-white p-8 bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(234,179,8,1)] relative">
        {/* Boton Cerrar (X) */}
        <Link href="/" className="absolute -top-4 -right-4 bg-red-600 text-white w-12 h-12 flex items-center justify-center font-black text-2xl border-4 border-white hover:bg-black transition-colors z-30">
          X
        </Link>

        <h1 className="text-5xl font-black uppercase italic tracking-tighter text-yellow-400 mb-8 border-b-4 border-yellow-400 pb-4">
          Contacto
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 text-white">
          <div className="space-y-2">
            <label className="block font-black uppercase tracking-widest text-sm">Tu Nombre</label>
            <input required name="name" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
          </div>

          <div className="space-y-2">
            <label className="block font-black uppercase tracking-widest text-sm">Tu Email</label>
            <input required type="email" name="email" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
          </div>

          <div className="space-y-2">
            <label className="block font-black uppercase tracking-widest text-sm">Asunto</label>
            <input name="subject" className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
          </div>

          <div className="space-y-2">
            <label className="block font-black uppercase tracking-widest text-sm">Mensaje</label>
            <textarea required name="message" rows={5} className="w-full bg-black border-2 border-white p-3 focus:border-yellow-400 outline-none font-bold" />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-400 text-black font-black uppercase text-2xl py-4 hover:bg-white transition-colors border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar Mensaje'}
          </button>
        </form>
      </div>
    </div>
  );
}
