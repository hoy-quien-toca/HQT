'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const { error } = await supabase.from('contact_messages').insert([{
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message')
    }]);
    if (error) alert('Error: ' + error.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden bg-zinc-900">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4">
            <Image src="/logo-rojo.jpg" alt="Logo Rojo" width={50} height={50} className="border-2 border-white rounded-2xl" />
            <div>
              <h1 className="text-2xl md:text-5xl font-brusher tracking-tighter uppercase text-red-600 leading-none">Hoy Quien Toca</h1>
              <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest mt-1">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center">
            <Link href="/" className="hover:text-red-600">Fechas</Link>
            <Link href="/interviews" className="hover:text-red-600">Entrevistas</Link>
            <Link href="/contact" className="text-red-600 underline decoration-2 underline-offset-4 font-black">Contacto</Link>
            <Link href="/submit" className="border-2 border-red-600 text-red-600 px-4 py-1 bg-black rounded-full animate-pulse hover:bg-red-600 hover:text-white transition-colors font-black">Subir Fecha</Link>
          </nav>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-red-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8 md:hidden text-center font-black">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl font-black">X</button>
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic">Fechas</Link>
          <Link href="/interviews" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-white italic">Entrevistas</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-4xl uppercase text-red-600 italic">Contacto</Link>
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl uppercase border-4 border-red-600 text-red-600 px-8 py-4 rounded-full animate-pulse">Subir Fecha</Link>
        </div>
      )}

      <main className="max-w-2xl mx-auto p-4 md:p-12 relative z-10">
        {sent ? (
          <div className="border-8 border-white p-12 bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(220,38,38,0.5)] rounded-[40px] text-center space-y-6">
            <h2 className="text-6xl font-brusher uppercase text-red-600 leading-none">¡Mensaje Enviado!</h2>
            <p className="text-xl font-bold uppercase tracking-widest italic">Te responderemos a la brevedad.</p>
            <Link href="/" className="inline-block bg-white text-black px-12 py-4 rounded-full font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-lg">Volver al Inicio</Link>
          </div>
        ) : (
          <div className="border-8 border-white p-8 md:p-12 bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(220,38,38,0.5)] rounded-[40px] relative">
            <Link href="/" className="absolute -top-4 -right-4 bg-red-600 text-white w-12 h-12 flex items-center justify-center font-black text-2xl border-4 border-white hover:bg-black transition-colors rounded-full shadow-xl">X</Link>
            <h2 className="text-5xl md:text-7xl font-brusher uppercase text-red-600 mb-2 leading-none">Contacto</h2>
            <p className="text-sm font-bold text-white/60 uppercase tracking-widest mb-10 italic">¿Querés publicitar o hacernos una sugerencia?</p>
            
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="block font-black uppercase text-xs tracking-widest text-red-600">Tu Nombre</label>
                <input required name="name" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none text-white font-bold uppercase shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="block font-black uppercase text-xs tracking-widest text-red-600">Tu Email</label>
                <input required type="email" name="email" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none text-white font-bold shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="block font-black uppercase text-xs tracking-widest text-red-600">Mensaje</label>
                <textarea required name="message" rows={5} className="w-full bg-zinc-900 border-4 border-white p-4 rounded-[32px] focus:border-red-600 outline-none text-white font-bold uppercase shadow-inner" />
              </div>
              <button disabled={loading} className="w-full bg-red-600 text-white font-black uppercase text-2xl py-5 rounded-full hover:bg-white hover:text-black transition-all border-4 border-white shadow-xl italic tracking-tighter disabled:opacity-50">
                {loading ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
