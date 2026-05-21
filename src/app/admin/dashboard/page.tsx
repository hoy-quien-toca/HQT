'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
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
    const [eventRes, messageRes, adRes] = await Promise.all([
      supabase.from('events').select('*').order('date', { ascending: true }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('ads').select('*').order('created_at', { ascending: false })
    ]);
    setEvents(eventRes.data || []);
    setMessages(messageRes.data || []);
    setAds(adRes.data || []);
    setLoading(false);
  }

  async function handleFileUpload(file: File, folder: string) {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('hqt-assets').upload(filePath, file);
    if (uploadError) { alert('Error subiendo: ' + uploadError.message); setUploading(false); return null; }
    const { data } = supabase.storage.from('hqt-assets').getPublicUrl(filePath);
    setUploading(false);
    return data.publicUrl;
  }

  async function updateEventTag(id: string, tag: string) {
    await supabase.from('events').update({ suggestion_tag: tag }).eq('id', id);
    fetchData();
  }

  async function toggleFeatured(id: string, currentStatus: boolean) {
    await supabase.from('events').update({ is_featured: !currentStatus }).eq('id', id);
    fetchData();
  }

  async function toggleSoldOut(id: string, currentStatus: boolean) {
    await supabase.from('events').update({ is_sold_out: !currentStatus }).eq('id', id);
    fetchData();
  }

  async function handleCreateAd(e: React.FormEvent) {
    e.preventDefault();
    if (!newAd.image_url) return alert('Sube una imagen primero');
    const { error } = await supabase.from('ads').insert([newAd]);
    if (!error) {
      setNewAd({ client_name: '', image_url: '', link: '', position: 'sidebar' });
      fetchData();
    }
  }

  async function toggleAdStatus(id: string, currentStatus: boolean) {
    await supabase.from('ads').update({ is_active: !currentStatus }).eq('id', id);
    fetchData();
  }

  async function deleteAd(id: string) {
    if (confirm('¿Borrar publicidad?')) { await supabase.from('ads').delete().eq('id', id); fetchData(); }
  }

  async function toggleApproval(id: string, currentStatus: boolean) {
    await supabase.from('events').update({ is_approved: !currentStatus }).eq('id', id);
    fetchData();
  }

  async function deleteEvent(id: string) {
    if (confirm('¿Borrar evento?')) { await supabase.from('events').delete().eq('id', id); fetchData(); }
  }

  if (loading) return <div className="min-h-screen bg-black text-yellow-400 flex items-center justify-center font-black text-4xl">CARGANDO...</div>;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 font-sans relative">
      <header className="flex justify-between items-center mb-12 border-b-4 border-yellow-400 pb-6 bg-zinc-950 p-4 sticky top-0 z-50">
        <h1 className="text-4xl font-black uppercase italic text-yellow-400">ADMINISTRADOR HQT</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="bg-white text-black px-4 py-1 font-black uppercase text-xs hover:bg-yellow-400 transition-colors">Ir a la Web</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="bg-red-600 px-4 py-1 font-black uppercase text-xs hover:bg-white hover:text-black transition-colors">Salir</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gestion de Fechas */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Gestión de Fechas</h2>
          <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {events.map((event) => (
              <div key={event.id} className={`border-4 p-4 flex flex-col gap-4 ${event.is_approved ? 'border-zinc-700 bg-zinc-950/90' : 'border-red-600 bg-zinc-900'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    {event.flyer_url ? (
                      <img src={event.flyer_url} className="w-16 h-16 object-cover border-2 border-white shadow-md" />
                    ) : (
                      <div className="w-16 h-16 bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-[8px] font-black text-zinc-500">SIN FLYER</div>
                    )}
                    <div>
                      <h3 className="text-xl font-black uppercase leading-none text-white">{event.band_name}</h3>
                      <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">{event.date} @ {event.venue}</p>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase">{event.city}, {event.department}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleApproval(event.id, event.is_approved)} className={`px-3 py-1 font-black uppercase text-[10px] shadow-md ${event.is_approved ? 'bg-zinc-800 border border-zinc-600 text-zinc-400' : 'bg-green-600 text-white border-2 border-white'}`}>
                      {event.is_approved ? 'BAJAR' : 'APROBAR'}
                    </button>
                    <button onClick={() => deleteEvent(event.id)} className="bg-red-600 px-3 py-1 font-black uppercase text-[10px] border-2 border-white">X</button>
                  </div>
                </div>

                {event.is_approved && (
                  <div className="space-y-4 border-t border-zinc-800 pt-4">
                    {/* Boton para el Banner Principal */}
                    <button 
                      onClick={() => toggleFeatured(event.id, event.is_featured)} 
                      className={`w-full py-2 font-black uppercase text-xs border-4 transition-all ${event.is_featured ? 'bg-yellow-400 text-black border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]' : 'bg-black text-yellow-400 border-yellow-400 hover:bg-zinc-800'}`}
                    >
                      {event.is_featured ? '★ EN BANNER PRINCIPAL' : 'PONER EN BANNER PRINCIPAL'}
                    </button>

                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[9px] font-black text-zinc-500 uppercase mr-2">Sugerencia:</span>
                      <button onClick={() => updateEventTag(event.id, 'PLANAZO')} className={`px-2 py-1 text-[9px] font-black uppercase border-2 ${event.suggestion_tag === 'PLANAZO' ? 'bg-red-600 border-white text-white' : 'border-red-600 text-red-600'}`}>PLANAZO</button>
                      <button onClick={() => updateEventTag(event.id, 'SALIDA SEGURA')} className={`px-2 py-1 text-[9px] font-black uppercase border-2 ${event.suggestion_tag === 'SALIDA SEGURA' ? 'bg-yellow-400 border-black text-black' : 'border-yellow-400 text-yellow-400'}`}>SALIDA SEGURA</button>
                      <button onClick={() => updateEventTag(event.id, 'NO FALLA')} className={`px-2 py-1 text-[9px] font-black uppercase border-2 ${event.suggestion_tag === 'NO FALLA' ? 'bg-white border-black text-black' : 'border-white text-white'}`}>NO FALLA</button>
                      <button onClick={() => updateEventTag(event.id, '')} className="text-[8px] font-black text-zinc-500 hover:text-white underline ml-2">BORRAR ETIQUETA</button>
                    </div>

                    <button onClick={() => toggleSoldOut(event.id, event.is_sold_out)} className={`w-full py-2 font-black uppercase text-xs border-2 transition-all ${event.is_sold_out ? 'bg-red-600 border-white text-white' : 'border-zinc-700 text-zinc-500 hover:border-red-600 hover:text-red-600'}`}>
                      {event.is_sold_out ? '¡AGOTADO! (Click para vender de nuevo)' : 'MARCAR COMO AGOTADO'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Publicidad y Mensajes */}
        <section className="space-y-12">
          {/* Publicidad */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Gestión de Publicidad</h2>
            <form onSubmit={handleCreateAd} className="bg-zinc-950 p-6 border-4 border-white space-y-4 shadow-xl">
              <input placeholder="Nombre del Cliente" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white focus:border-yellow-400 outline-none" value={newAd.client_name} onChange={e => setNewAd({...newAd, client_name: e.target.value})} required />
              
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-4 text-center relative hover:border-yellow-400 transition-colors">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-zinc-500">{uploading ? 'Subiendo archivo...' : (newAd.image_url ? '¡Imagen Cargada! ✅' : 'Subir Imagen / GIF / Video')}</p>
                  <p className="text-[8px] text-zinc-600 mt-1 uppercase italic">(Lateral: 400x500px | Inferior: 1200x400px)</p>
                </div>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'ads'); if (url) setNewAd({...newAd, image_url: url}); }
                }} />
                {newAd.image_url && <img src={newAd.image_url} className="h-16 w-16 object-cover border-2 border-white" />}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Link (Opcional)" className="bg-black border-2 border-white p-2 text-xs text-white focus:border-yellow-400 outline-none" value={newAd.link} onChange={e => setNewAd({...newAd, link: e.target.value})} />
                <select className="bg-black border-2 border-white p-2 text-xs text-white uppercase font-black focus:border-yellow-400 outline-none" value={newAd.position} onChange={e => setNewAd({...newAd, position: e.target.value})}>
                  <option value="sidebar">LATERAL (Costado)</option>
                  <option value="bottom">INFERIOR (Banner Grande)</option>
                </select>
              </div>
              
              <button type="submit" disabled={uploading || !newAd.image_url} className="w-full bg-yellow-400 text-black font-black uppercase py-3 text-sm hover:bg-white transition-colors disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">Guardar Anuncio</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {ads.map(ad => (
                <div key={ad.id} className={`border-2 p-3 flex flex-col gap-2 ${ad.is_active ? 'border-yellow-400 bg-zinc-950' : 'border-zinc-800 opacity-50 bg-zinc-900'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[10px] font-black uppercase text-white truncate max-w-[120px]">{ad.client_name}</h3>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">{ad.position === 'sidebar' ? 'LATERAL' : 'BANNER INFERIOR'}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleAdStatus(ad.id, ad.is_active)} className={`px-2 py-1 text-[7px] font-black uppercase border ${ad.is_active ? 'bg-zinc-800 border-zinc-600 text-zinc-400' : 'bg-green-600 border-white text-white'}`}>{ad.is_active ? 'PAUSAR' : 'ACTIVAR'}</button>
                      <button onClick={() => deleteAd(ad.id)} className="px-2 py-1 bg-red-600 border border-white text-[7px] font-black uppercase text-white">X</button>
                    </div>
                  </div>
                  <img src={ad.image_url} className="w-full h-16 object-cover border border-zinc-800" />
                </div>
              ))}
            </div>
          </div>

          {/* Mensajes */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-8">
            <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Mensajes de Contacto</h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {messages.length === 0 ? <p className="text-zinc-600 font-bold uppercase text-[10px] italic">No hay mensajes nuevos.</p> : messages.map((msg) => (
                <div key={msg.id} className={`border-2 p-3 space-y-2 ${msg.is_read ? 'border-zinc-800 bg-zinc-950/50 opacity-60' : 'border-white bg-zinc-900'}`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-black uppercase text-[10px] text-yellow-400">{msg.name} <span className="text-zinc-600 lowercase font-normal">({msg.email})</span></h3>
                    {!msg.is_read && <button onClick={() => supabase.from('contact_messages').update({ is_read: true }).eq('id', msg.id).then(() => fetchData())} className="text-[7px] bg-white text-black px-2 py-0.5 font-black uppercase hover:bg-yellow-400">Leído</button>}
                  </div>
                  <p className="text-[10px] text-zinc-300 leading-tight italic">"{msg.message}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #facc15; border-radius: 10px; }
      `}</style>
    </div>
  );
}
