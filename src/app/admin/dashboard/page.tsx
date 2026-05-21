'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Forms State
  const [newInterview, setNewInterview] = useState({ title: '', band_name: '', content: '', image_url: '' });
  const [newAd, setNewAd] = useState({ client_name: '', image_url: '', link: '', position: 'sidebar' });

  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin');
      } else {
        setUser(user);
        fetchData();
      }
    }
    checkUser();
  }, [router]);

  async function fetchData() {
    setLoading(true);
    console.log('Fetching admin data...');
    
    const [eventRes, messageRes, interviewRes, adRes] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('interviews').select('*').order('published_at', { ascending: false }),
      supabase.from('ads').select('*').order('created_at', { ascending: false })
    ]);

    if (eventRes.error) console.error('Error fetching events:', eventRes.error);
    if (messageRes.error) console.error('Error fetching messages:', messageRes.error);
    if (interviewRes.error) console.error('Error fetching interviews:', interviewRes.error);
    if (adRes.error) console.error('Error fetching ads:', adRes.error);

    setEvents(eventRes.data || []);
    setMessages(messageRes.data || []);
    setInterviews(interviewRes.data || []);
    setAds(adRes.data || []);
    setLoading(false);
  }

  async function handleCreateAd(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('ads').insert([newAd]);
    if (!error) {
      setNewAd({ client_name: '', image_url: '', link: '', position: 'sidebar' });
      fetchData();
    } else {
      alert('Error creando publicidad: ' + error.message);
    }
  }

  async function toggleAdStatus(id: string, currentStatus: boolean) {
    await supabase.from('ads').update({ is_active: !currentStatus }).eq('id', id);
    fetchData();
  }

  async function deleteAd(id: string) {
    if (confirm('¿Borrar publicidad?')) {
      await supabase.from('ads').delete().eq('id', id);
      fetchData();
    }
  }

  async function handleCreateInterview(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('interviews').insert([newInterview]);
    if (!error) {
      setNewInterview({ title: '', band_name: '', content: '', image_url: '' });
      fetchData();
    } else {
      alert('Error creando entrevista: ' + error.message);
    }
  }

  async function deleteInterview(id: string) {
    if (confirm('¿Borrar entrevista?')) {
      await supabase.from('interviews').delete().eq('id', id);
      fetchData();
    }
  }

  async function toggleApproval(id: string, currentStatus: boolean) {
    const { error } = await supabase.from('events').update({ is_approved: !currentStatus }).eq('id', id);
    if (!error) fetchData();
  }

  async function deleteEvent(id: string) {
    if (confirm('¿Seguro que quieres borrar este evento?')) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (!error) fetchData();
    }
  }

  async function markAsRead(id: string) {
    const { error } = await supabase.from('contact_messages').update({ is_read: true }).eq('id', id);
    if (!error) fetchData();
  }

  if (loading) return <div className="min-h-screen bg-black text-yellow-400 flex items-center justify-center font-black text-4xl">CARGANDO...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <header className="flex justify-between items-center mb-12 border-b-4 border-yellow-400 pb-6">
        <h1 className="text-5xl font-black uppercase italic tracking-tighter">Panel de Control</h1>
        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))}
          className="bg-red-600 px-4 py-2 font-black uppercase text-sm hover:bg-white hover:text-black"
        >
          Cerrar Sesión
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Moderación de Eventos */}
        <section className="space-y-6">
          <h2 className="text-3xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4">Moderación de Fechas</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {events.length === 0 && <p className="text-zinc-500 font-bold uppercase">No hay eventos.</p>}
            {events.map((event) => (
              <div key={event.id} className={`border-4 p-4 flex justify-between items-center ${event.is_approved ? 'border-zinc-700 bg-zinc-900 opacity-60' : 'border-white bg-zinc-800'}`}>
                <div>
                  <h3 className="text-xl font-black uppercase leading-none mb-1">{event.band_name}</h3>
                  <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">{event.date} @ {event.venue}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleApproval(event.id, event.is_approved)}
                    className={`px-3 py-1 font-black uppercase text-[10px] ${event.is_approved ? 'bg-zinc-700' : 'bg-green-600 hover:bg-white hover:text-black'}`}
                  >
                    {event.is_approved ? 'Bajar' : 'Aprobar'}
                  </button>
                  <button 
                    onClick={() => deleteEvent(event.id)}
                    className="bg-red-600 px-3 py-1 font-black uppercase text-[10px] hover:bg-white hover:text-black"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mensajes de Contacto */}
        <section className="space-y-6">
          <h2 className="text-3xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4">Mensajes</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {messages.length === 0 && <p className="text-zinc-500 font-bold uppercase">No hay mensajes.</p>}
            {messages.map((msg) => (
              <div key={msg.id} className={`border-4 p-4 space-y-2 ${msg.is_read ? 'border-zinc-700 bg-zinc-900 opacity-60' : 'border-white bg-zinc-800'}`}>
                <div className="flex justify-between items-start">
                  <h3 className="font-black uppercase text-sm">{msg.name}</h3>
                  {!msg.is_read && <button onClick={() => markAsRead(msg.id)} className="text-[9px] bg-yellow-400 text-black px-2 py-0.5 font-black uppercase">Leído</button>}
                </div>
                <p className="text-xs text-zinc-400 leading-snug">{msg.message}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Publicidad */}
        <section className="space-y-6 border-t-4 border-zinc-800 pt-12 lg:col-span-2">
          <h2 className="text-3xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4">Gestión de Publicidad</h2>
          <form onSubmit={handleCreateAd} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900 p-6 border-4 border-white mb-8">
            <div className="space-y-4">
              <input 
                placeholder="Nombre del Cliente" 
                className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm outline-none focus:border-yellow-400"
                value={newAd.client_name}
                onChange={e => setNewAd({...newAd, client_name: e.target.value})}
                required
              />
              <input 
                placeholder="URL de la Imagen (Banner)" 
                className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm outline-none focus:border-yellow-400"
                value={newAd.image_url}
                onChange={e => setNewAd({...newAd, image_url: e.target.value})}
                required
              />
            </div>
            <div className="space-y-4">
              <input 
                placeholder="Link de Destino" 
                className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm outline-none focus:border-yellow-400"
                value={newAd.link}
                onChange={e => setNewAd({...newAd, link: e.target.value})}
              />
              <select 
                className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm outline-none focus:border-yellow-400 text-white"
                value={newAd.position}
                onChange={e => setNewAd({...newAd, position: e.target.value})}
              >
                <option value="sidebar">Barra Lateral</option>
                <option value="top">Banner Superior</option>
              </select>
              <button type="submit" className="w-full bg-yellow-400 text-black font-black uppercase py-3 hover:bg-white transition-colors">Guardar Publicidad</button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ads.map(ad => (
              <div key={ad.id} className={`border-4 p-4 flex justify-between items-center ${ad.is_active ? 'border-yellow-400' : 'border-zinc-700 opacity-60'}`}>
                <div>
                  <h3 className="font-black uppercase">{ad.client_name}</h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Posición: {ad.position}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleAdStatus(ad.id, ad.is_active)}
                    className={`px-3 py-1 font-black uppercase text-[10px] ${ad.is_active ? 'bg-zinc-700' : 'bg-green-600 hover:bg-white hover:text-black'}`}
                  >
                    {ad.is_active ? 'Pausar' : 'Activar'}
                  </button>
                  <button 
                    onClick={() => deleteAd(ad.id)}
                    className="bg-red-600 px-3 py-1 font-black uppercase text-[10px] hover:bg-white hover:text-black"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Crear Entrevista */}
        <section className="space-y-6 border-t-4 border-zinc-800 pt-12 lg:col-span-2">
          <h2 className="text-3xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4">Publicar Entrevista</h2>
          <form onSubmit={handleCreateInterview} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900 p-6 border-4 border-white">
            <div className="space-y-4">
              <input 
                placeholder="Título de la Entrevista" 
                className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm outline-none focus:border-yellow-400"
                value={newInterview.title}
                onChange={e => setNewInterview({...newInterview, title: e.target.value})}
                required
              />
              <input 
                placeholder="Nombre de la Banda" 
                className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm outline-none focus:border-yellow-400"
                value={newInterview.band_name}
                onChange={e => setNewInterview({...newInterview, band_name: e.target.value})}
                required
              />
              <input 
                placeholder="URL de la Imagen" 
                className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm outline-none focus:border-yellow-400"
                value={newInterview.image_url}
                onChange={e => setNewInterview({...newInterview, image_url: e.target.value})}
              />
            </div>
            <div className="space-y-4">
              <textarea 
                placeholder="Contenido de la entrevista..." 
                className="w-full h-40 bg-black border-2 border-white p-3 font-bold text-sm outline-none focus:border-yellow-400"
                value={newInterview.content}
                onChange={e => setNewInterview({...newInterview, content: e.target.value})}
                required
              />
              <button type="submit" className="w-full bg-yellow-400 text-black font-black uppercase py-3 hover:bg-white transition-colors">Publicar Ahora</button>
            </div>
          </form>
        </section>

        {/* Listado de Entrevistas */}
        <section className="space-y-6 lg:col-span-2 pb-20">
          <h2 className="text-3xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4">Gestionar Entrevistas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {interviews.map(interview => (
              <div key={interview.id} className="border-4 border-zinc-700 p-4 bg-zinc-900 relative">
                <h3 className="font-black uppercase text-sm truncate pr-10">{interview.title}</h3>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">{interview.band_name}</p>
                <button 
                  onClick={() => deleteInterview(interview.id)}
                  className="absolute top-2 right-2 text-red-600 font-black hover:text-white"
                >
                  [X]
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

