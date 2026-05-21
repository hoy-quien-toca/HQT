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
  const [uploading, setUploading] = useState(false);
  
  const [newInterview, setNewInterview] = useState({ title: '', band_name: '', content: '', image_url: '' });
  const [newAd, setNewAd] = useState({ client_name: '', image_url: '', link: '', position: 'sidebar' });

  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/admin');
      else fetchData();
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
    if (uploadError) { alert('Error: ' + uploadError.message); setUploading(false); return null; }
    const { data } = supabase.storage.from('hqt-assets').getPublicUrl(filePath);
    setUploading(false);
    return data.publicUrl;
  }

  async function updateEventTag(id: string, tag: string) {
    // Manual Highlight/Featured Logic
    await supabase.from('events').update({ 
      suggestion_tag: tag, 
      is_featured: tag !== '' // If it has a tag, it goes to the hero banner
    }).eq('id', id);
    fetchData();
  }

  async function toggleSoldOut(id: string, currentStatus: boolean) {
    await supabase.from('events').update({ is_sold_out: !currentStatus }).eq('id', id);
    fetchData();
  }

  async function handleCreateAd(e: React.FormEvent) {
    e.preventDefault();
    if (!newAd.image_url) return alert('Sube imagen');
    await supabase.from('ads').insert([newAd]);
    setNewAd({ client_name: '', image_url: '', link: '', position: 'sidebar' });
    fetchData();
  }

  async function toggleAdStatus(id: string, currentStatus: boolean) {
    await supabase.from('ads').update({ is_active: !currentStatus }).eq('id', id);
    fetchData();
  }

  async function deleteAd(id: string) {
    if (confirm('¿Borrar?')) { await supabase.from('ads').delete().eq('id', id); fetchData(); }
  }

  if (loading) return <div className="min-h-screen bg-black text-yellow-400 flex items-center justify-center font-black text-4xl">CARGANDO...</div>;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 font-sans">
      <header className="flex justify-between items-center mb-12 border-b-4 border-yellow-400 pb-6 bg-zinc-950 p-4 sticky top-0 z-50">
        <h1 className="text-4xl font-black uppercase italic text-yellow-400">ADMIN HQT</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="bg-white text-black px-4 py-1 font-black uppercase text-xs">Ver Web</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="bg-red-600 px-4 py-1 font-black uppercase text-xs">Salir</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Fechas y Destacados</h2>
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
            {events.map((event) => (
              <div key={event.id} className={`border-4 p-4 flex flex-col gap-4 ${event.is_approved ? 'border-zinc-700 bg-zinc-950/80' : 'border-white bg-zinc-900'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    {event.flyer_url && <img src={event.flyer_url} className="w-12 h-12 object-cover border-2 border-white" />}
                    <div>
                      <h3 className="text-lg font-black uppercase leading-none">{event.band_name}</h3>
                      <p className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">{event.date} @ {event.venue}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => supabase.from('events').update({ is_approved: !event.is_approved }).eq('id', event.id).then(() => fetchData())} className={`px-2 py-1 font-black uppercase text-[9px] ${event.is_approved ? 'bg-zinc-800' : 'bg-green-600'}`}>{event.is_approved ? 'Bajar' : 'Aprobar'}</button>
                    <button onClick={() => deleteAd(event.id)} className="bg-red-600 px-2 py-1 font-black uppercase text-[9px]">X</button>
                  </div>
                </div>

                {event.is_approved && (
                  <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
                    <button onClick={() => updateEventTag(event.id, 'PLANAZO')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'PLANAZO' ? 'bg-red-600 border-white' : 'border-red-600 text-red-600'}`}>PLANAZO</button>
                    <button onClick={() => updateEventTag(event.id, 'SALIDA SEGURA')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'SALIDA SEGURA' ? 'bg-yellow-400 border-black text-black' : 'border-yellow-400 text-yellow-400'}`}>SALIDA SEGURA</button>
                    <button onClick={() => updateEventTag(event.id, 'NO FALLA')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'NO FALLA' ? 'bg-white border-black text-black' : 'border-white text-white'}`}>NO FALLA</button>
                    <button onClick={() => updateEventTag(event.id, '')} className="px-2 py-1 text-[8px] font-black uppercase text-zinc-500 underline">Quitar</button>
                    <button onClick={() => toggleSoldOut(event.id, event.is_sold_out)} className={`ml-auto px-2 py-1 text-[8px] font-black border-2 ${event.is_sold_out ? 'bg-red-600 border-white' : 'border-red-600 text-red-600'}`}>{event.is_sold_out ? 'VENDER' : 'AGOTADO'}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-12">
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Publicidad</h2>
            <form onSubmit={handleCreateAd} className="bg-zinc-950 p-6 border-4 border-white space-y-4">
              <input placeholder="Cliente" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white" value={newAd.client_name} onChange={e => setNewAd({...newAd, client_name: e.target.value})} required />
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative">
                <p className="text-[10px] font-black uppercase text-zinc-500 flex-1">{uploading ? 'Subiendo...' : (newAd.image_url ? 'Imagen ✅' : 'Subir Imagen/GIF')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'ads'); if (url) setNewAd({...newAd, image_url: url}); }
                }} />
                {newAd.image_url && <img src={newAd.image_url} className="h-10 w-10 object-cover border" />}
              </div>
              <div className="flex gap-2">
                <input placeholder="Link" className="flex-1 bg-black border-2 border-white p-2 text-xs text-white" value={newAd.link} onChange={e => setNewAd({...newAd, link: e.target.value})} />
                <select className="bg-black border-2 border-white p-2 text-xs text-white uppercase font-black" value={newAd.position} onChange={e => setNewAd({...newAd, position: e.target.value})}>
                  <option value="sidebar">Lateral (4x5)</option>
                  <option value="bottom">Inferior (Banner)</option>
                </select>
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-yellow-400 text-black font-black uppercase py-2 text-sm">Guardar</button>
            </form>

            <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
              {ads.map(ad => (
                <div key={ad.id} className={`border-2 p-2 flex justify-between items-center ${ad.is_active ? 'border-yellow-400' : 'border-zinc-800 opacity-50'}`}>
                  <span className="text-[9px] font-black uppercase truncate max-w-[80px]">{ad.client_name} ({ad.position})</span>
                  <div className="flex gap-1">
                    <button onClick={() => toggleAdStatus(ad.id, ad.is_active)} className="px-1 py-0.5 bg-zinc-800 text-[7px] font-black uppercase">{ad.is_active ? 'Pausar' : 'Activar'}</button>
                    <button onClick={() => deleteAd(ad.id)} className="px-1 py-0.5 bg-red-600 text-[7px] font-black uppercase">X</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
