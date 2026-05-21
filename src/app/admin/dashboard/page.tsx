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
  const [uploading, setUploading] = useState(false);
  
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
    const [eventRes, messageRes, interviewRes, adRes] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('interviews').select('*').order('published_at', { ascending: false }),
      supabase.from('ads').select('*').order('created_at', { ascending: false })
    ]);

    setEvents(eventRes.data || []);
    setMessages(messageRes.data || []);
    setInterviews(interviewRes.data || []);
    setAds(adRes.data || []);
    setLoading(false);
  }

  async function handleFileUpload(file: File, folder: string) {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('hqt-assets').upload(filePath, file);
    if (uploadError) {
      alert('Error subiendo: ' + uploadError.message);
      setUploading(false);
      return null;
    }

    const { data } = supabase.storage.from('hqt-assets').getPublicUrl(filePath);
    setUploading(false);
    return data.publicUrl;
  }

  async function updateEventTag(id: string, tag: string) {
    await supabase.from('events').update({ suggestion_tag: tag, is_featured: tag !== '' }).eq('id', id);
    fetchData();
  }

  async function handleCreateAd(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('ads').insert([newAd]);
    if (!error) {
      setNewAd({ client_name: '', image_url: '', link: '', position: 'sidebar' });
      fetchData();
    }
  }

  async function toggleSoldOut(id: string, currentStatus: boolean) {
    await supabase.from('events').update({ is_sold_out: !currentStatus }).eq('id', id);
    fetchData();
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
    }
  }

  async function deleteInterview(id: string) {
    if (confirm('¿Borrar entrevista?')) {
      await supabase.from('interviews').delete().eq('id', id);
      fetchData();
    }
  }

  async function toggleApproval(id: string, currentStatus: boolean) {
    await supabase.from('events').update({ is_approved: !currentStatus }).eq('id', id);
    fetchData();
  }

  async function deleteEvent(id: string) {
    if (confirm('¿Seguro que quieres borrar este evento?')) {
      await supabase.from('events').delete().eq('id', id);
      fetchData();
    }
  }

  async function markAsRead(id: string) {
    await supabase.from('contact_messages').update({ is_read: true }).eq('id', id);
    fetchData();
  }

  if (loading) return <div className="min-h-screen bg-black text-yellow-400 flex items-center justify-center font-black text-4xl uppercase italic">Cargando Panel...</div>;

  return (
    <div className="min-h-screen p-6 font-sans relative">
      <header className="flex justify-between items-center mb-12 border-b-4 border-yellow-400 pb-6 bg-zinc-950/80 backdrop-blur p-4 sticky top-0 z-50">
        <h1 className="text-5xl font-black uppercase italic tracking-tighter text-yellow-400">Panel Admin</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="bg-white text-black px-4 py-2 font-black uppercase text-sm">Ver Web</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="bg-red-600 px-4 py-2 font-black uppercase text-sm">Cerrar</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Moderación de Eventos */}
        <section className="space-y-6">
          <h2 className="text-3xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Fechas y Recomendados</h2>
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
            {events.map((event) => (
              <div key={event.id} className={`border-4 p-4 flex flex-col gap-4 ${event.is_approved ? 'border-zinc-700 bg-zinc-950/60' : 'border-white bg-zinc-900'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    {event.flyer_url && <img src={event.flyer_url} className="w-16 h-16 object-cover border-2 border-white" />}
                    <div>
                      <h3 className="text-xl font-black uppercase leading-none mb-1">{event.band_name}</h3>
                      <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">{event.date} @ {event.venue}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleApproval(event.id, event.is_approved)} className={`px-3 py-1 font-black uppercase text-[10px] ${event.is_approved ? 'bg-zinc-700' : 'bg-green-600 hover:bg-white hover:text-black'}`}>
                      {event.is_approved ? 'Bajar' : 'Aprobar'}
                    </button>
                    <button onClick={() => deleteEvent(event.id)} className="bg-red-600 px-3 py-1 font-black uppercase text-[10px]">X</button>
                  </div>
                </div>

                {event.is_approved && (
                  <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
                    <button onClick={() => updateEventTag(event.id, 'PLANAZO')} className={`px-2 py-1 text-[9px] font-black uppercase border-2 ${event.suggestion_tag === 'PLANAZO' ? 'bg-red-600 border-white' : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'}`}>PLANAZO</button>
                    <button onClick={() => updateEventTag(event.id, 'SALIDA SEGURA')} className={`px-2 py-1 text-[9px] font-black uppercase border-2 ${event.suggestion_tag === 'SALIDA SEGURA' ? 'bg-yellow-400 border-black text-black' : 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'}`}>SALIDA SEGURA</button>
                    <button onClick={() => updateEventTag(event.id, 'NO FALLA')} className={`px-2 py-1 text-[9px] font-black uppercase border-2 ${event.suggestion_tag === 'NO FALLA' ? 'bg-white border-black text-black' : 'border-white text-white hover:bg-white hover:text-black'}`}>NO FALLA</button>
                    <button onClick={() => updateEventTag(event.id, '')} className="px-2 py-1 text-[9px] font-black uppercase text-zinc-500 hover:text-white underline">Quitar Destacado</button>
                    <button onClick={() => toggleSoldOut(event.id, event.is_sold_out)} className={`ml-auto px-4 py-1 text-[9px] font-black uppercase border-2 ${event.is_sold_out ? 'bg-red-600 border-white' : 'border-white text-white'}`}>
                      {event.is_sold_out ? 'VENDER DE NUEVO' : 'MARCAR AGOTADO'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Mensajes */}
        <section className="space-y-6">
          <h2 className="text-3xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Mensajes</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`border-4 p-4 space-y-2 ${msg.is_read ? 'border-zinc-700 bg-zinc-950 opacity-60' : 'border-white bg-zinc-900'}`}>
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
          <h2 className="text-3xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Gestión de Publicidad</h2>
          <form onSubmit={handleCreateAd} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950 p-6 border-4 border-white mb-8">
            <div className="space-y-4">
              <input placeholder="Nombre del Cliente" className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm text-white focus:border-yellow-400 outline-none" value={newAd.client_name} onChange={e => setNewAd({...newAd, client_name: e.target.value})} required />
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-zinc-500">Imagen / Banner / GIF</label>
                <input type="file" accept="image/*,video/mp4" className="w-full text-xs text-zinc-400" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await handleFileUpload(file, 'ads');
                    if (url) setNewAd({...newAd, image_url: url});
                  }
                }} />
                {newAd.image_url && <img src={newAd.image_url} className="h-24 border-2 border-white shadow-xl" />}
              </div>
            </div>
            <div className="space-y-4">
              <input placeholder="Link de Destino" className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm text-white focus:border-yellow-400 outline-none" value={newAd.link} onChange={e => setNewAd({...newAd, link: e.target.value})} />
              <select className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm text-white focus:border-yellow-400 outline-none" value={newAd.position} onChange={e => setNewAd({...newAd, position: e.target.value})}>
                <option value="sidebar">Barra Lateral</option>
                <option value="top">Banner Superior</option>
              </select>
              <button type="submit" disabled={uploading || !newAd.image_url} className="w-full bg-yellow-400 text-black font-black uppercase py-3 hover:bg-white disabled:opacity-50">{uploading ? 'Subiendo...' : 'Guardar Publicidad'}</button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ads.map(ad => (
              <div key={ad.id} className={`border-4 p-4 flex flex-col gap-4 ${ad.is_active ? 'border-yellow-400 bg-zinc-950' : 'border-zinc-800 opacity-60 bg-zinc-900'}`}>
                <img src={ad.image_url} className="w-full h-32 object-cover border-2 border-zinc-800" />
                <div className="flex justify-between items-center">
                  <h3 className="font-black uppercase text-[10px]">{ad.client_name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAdStatus(ad.id, ad.is_active)} className="px-2 py-1 bg-zinc-800 text-[8px] font-black uppercase">{ad.is_active ? 'Pausar' : 'Activar'}</button>
                    <button onClick={() => deleteAd(ad.id)} className="px-2 py-1 bg-red-600 text-[8px] font-black uppercase">Borrar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Entrevistas */}
        <section className="space-y-6 border-t-4 border-zinc-800 pt-12 lg:col-span-2 pb-20">
          <h2 className="text-3xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Publicar Entrevista</h2>
          <form onSubmit={handleCreateInterview} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950 p-6 border-4 border-white mb-8">
            <div className="space-y-4">
              <input placeholder="Título" className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm text-white focus:border-yellow-400 outline-none" value={newInterview.title} onChange={e => setNewInterview({...newInterview, title: e.target.value})} required />
              <input placeholder="Banda" className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-sm text-white focus:border-yellow-400 outline-none" value={newInterview.band_name} onChange={e => setNewInterview({...newInterview, band_name: e.target.value})} required />
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-zinc-500">Foto de la Banda</label>
                <input type="file" className="w-full text-xs text-zinc-400" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await handleFileUpload(file, 'interviews');
                    if (url) setNewInterview({...newInterview, image_url: url});
                  }
                }} />
                {newInterview.image_url && <img src={newInterview.image_url} className="h-20 border-2 border-white" />}
              </div>
            </div>
            <div className="space-y-4 flex flex-col">
              <textarea placeholder="Contenido..." className="w-full flex-1 bg-black border-2 border-white p-3 font-bold text-sm text-white focus:border-yellow-400 outline-none min-h-[200px]" value={newInterview.content} onChange={e => setNewInterview({...newInterview, content: e.target.value})} required />
              <button type="submit" disabled={uploading || !newInterview.image_url} className="mt-4 w-full bg-yellow-400 text-black font-black uppercase py-3 hover:bg-white disabled:opacity-50">{uploading ? 'Subiendo...' : 'Publicar Ahora'}</button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {interviews.map(interview => (
              <div key={interview.id} className="border-2 border-zinc-700 p-2 bg-zinc-950 relative group">
                <h3 className="font-black uppercase text-[10px] truncate pr-8 text-yellow-400">{interview.title}</h3>
                <p className="text-[8px] text-zinc-500 uppercase">{interview.band_name}</p>
                <button onClick={() => deleteInterview(interview.id)} className="absolute top-2 right-2 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">[X]</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
