'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Simple Math Captcha
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, total: 0 });
  const [userAnswer, setUserAnswer] = useState('');

  useEffect(() => {
    generateCaptcha();
  }, []);

  function generateCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ a, b, total: a + b });
    setUserAnswer('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (parseInt(userAnswer) !== captcha.total) {
      alert("Captcha incorrecto. Por favor resuelve la suma.");
      generateCaptcha();
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const { error } = await supabase.from('contact_messages').insert([{
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'), // Nuevo campo celular
      message: formData.get('message')
    }]);
    
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden bg-zinc-900 font-black">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo-rojo.jpg" alt="Watermark" width={1000} height={1000} className="grayscale" priority />
      </div>

      <header className="border-b-4 border-red-600 p-4 md:p-6 bg-zinc-950 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4">
            <Image src="/logo-rojo.jpg" alt="Logo Rojo" width={50} height={50} className="border-2 border-white rounded-2xl" />
            <div>
              <h1 className="text-xl md:text-4xl font-franklin tracking-tighter text-red-600 leading-none">Hoy Quien Toca</h1>
              <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest mt-1">Descubri recitales en tu Ciudad</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-sm items-center">
            <Link href="/" className="hover:text-red-600 font-black transition-colors">Fechas</Link>
            <Link href="/interviews" className="hover:text-red-600 font-black transition-colors">Entrevistas</Link>
            <Link href="/contact" className="text-red-600 underline decoration-2 underline-offset-4 font-black">Contacto</Link>
            <Link href="/submit" className="border-2 border-red-600 text-red-600 px-4 py-1 bg-black rounded-full animate-pulse hover:bg-red-600 hover:text-white transition-colors font-black">Subir Fecha</Link>
          </nav>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-red-600 focus:outline-none">
            <svg className="w-8 h-8 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8 md:hidden text-center font-black">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl font-black">X</button>
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl font-franklin text-white italic">Fechas</Link>
          <Link href="/interviews" onClick={() => setIsMenuOpen(false)} className="text-4xl font-franklin text-white italic">Entrevistas</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-4xl font-franklin text-red-600 italic">Contacto</Link>
          <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="text-3xl font-franklin border-4 border-red-600 text-red-600 px-8 py-4 rounded-full animate-pulse font-black">Subir Fecha</Link>
        </div>
      )}

      <main className="max-w-2xl mx-auto p-4 md:p-12 relative z-10 font-black">
        {sent ? (
          <div className="border-8 border-white p-12 bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(220,38,38,0.5)] rounded-[40px] text-center space-y-6 font-black">
            <h2 className="text-5xl md:text-7xl font-franklin uppercase text-red-600 leading-none">¡Enviado!</h2>
            <p className="text-xl font-bold uppercase tracking-widest italic font-black">Te responderemos pronto.</p>
            <Link href="/" className="inline-block bg-white text-black px-12 py-4 rounded-full font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-lg font-black">Volver</Link>
          </div>
        ) : (
          <div className="border-8 border-white p-8 md:p-12 bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(220,38,38,0.5)] rounded-[40px] relative font-black">
            <Link href="/" className="absolute -top-4 -right-4 bg-red-600 text-white w-12 h-12 flex items-center justify-center font-black text-2xl border-4 border-white hover:bg-black transition-colors rounded-full shadow-xl">X</Link>
            <h2 className="text-5xl md:text-7xl font-franklin uppercase text-red-600 mb-2 leading-none">Contacto</h2>
            <p className="text-sm font-bold text-white/60 uppercase tracking-widest mb-10 italic">Dejanos tus datos y te contactaremos a la brevedad.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6 text-left font-black">
              <div className="space-y-2">
                <label className="block font-black uppercase text-xs tracking-widest text-red-600">Tu Nombre</label>
                <input required name="name" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none text-white font-bold uppercase shadow-inner" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-black uppercase text-xs tracking-widest text-red-600">Email</label>
                  <input required type="email" name="email" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none text-white font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="block font-black uppercase text-xs tracking-widest text-red-600">Celular / WhatsApp</label>
                  <input required type="tel" name="phone" placeholder="09X XXX XXX" className="w-full bg-zinc-900 border-4 border-white p-4 rounded-3xl focus:border-red-600 outline-none text-white font-bold shadow-inner" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-black uppercase text-xs tracking-widest text-red-600">Mensaje</label>
                <textarea required name="message" rows={5} className="w-full bg-zinc-900 border-4 border-white p-4 rounded-[32px] focus:border-red-600 outline-none text-white font-bold uppercase shadow-inner" />
              </div>

              {/* SIMPLE MATH CAPTCHA */}
              <div className="space-y-2 p-4 bg-black/40 rounded-3xl border-2 border-zinc-800 font-black">
                <label className="block font-black uppercase text-[10px] tracking-widest text-zinc-500 mb-2">Seguridad: ¿Cuánto es {captcha.a} + {captcha.b}?</label>
                <input 
                  required 
                  type="number" 
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="Resultado..."
                  className="w-full bg-zinc-900 border-2 border-white p-3 rounded-2xl outline-none text-red-600 font-black text-center text-xl shadow-inner" 
                />
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
