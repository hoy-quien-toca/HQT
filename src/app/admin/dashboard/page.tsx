'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Forms State
  const [newSponsor, setNewSponsor] = useState({ id: null, client_name: '', image_url: '', link: '', position: 'sidebar' });
  const [newInterview, setNewInterview] = useState({ id: null, title: '', band_name: '', content: '', image_url: '', is_active: true });
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

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
    const [eventRes, messageRes, interviewRes, sponsorRes] = await Promise.all([
      supabase.from('events').select('*').order('date', { ascending: true }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('interviews').select('*').order('published_at', { ascending: false }),
      supabase.from('sponsors').select('*').order('created_at', { ascending: false })
    ]);
    setEvents(eventRes.data || []);
    setMessages(messageRes.data || []);
    setInterviews(interviewRes.data || []);
    setSponsors(sponsorRes.data || []);
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

  // --- EVENTS ---
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

  // --- SPONSORS ---
  async function handleSaveSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!newSponsor.image_url) return alert('Sube imagen');
    if (newSponsor.id) {
      await supabase.from('sponsors').update(newSponsor).eq('id', newSponsor.id);
    } else {
      await supabase.from('sponsors').insert([newSponsor]);
    }
    setNewSponsor({ id: null, client_name: '', image_url: '', link: '', position: 'sidebar' });
    fetchData();
  }

  // --- INTERVIEWS ---
  async function handleSaveInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!newInterview.image_url) return alert('Sube foto');
    if (newInterview.id) {
      await supabase.from('interviews').update(newInterview).eq('id', newInterview.id);
    } else {
      await supabase.from('interviews').insert([newInterview]);
    }
    setNewInterview({ id: null, title: '', band_name: '', content: '', image_url: '', is_active: true });
    fetchData();
  }

  if (loading) return <div className="min-h-screen bg-black text-yellow-400 flex items-center justify-center font-black text-4xl uppercase">Cargando Admin...</div>;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 font-sans relative">
      <header className="flex justify-between items-center mb-12 border-b-4 border-yellow-400 pb-6 bg-zinc-950 p-4 sticky top-0 z-50">
        <h1 className="text-4xl font-black uppercase italic text-yellow-400">ADMINISTRADOR HQT</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="bg-white text-black px-4 py-1 font-black uppercase text-xs">Web</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="bg-red-600 px-4 py-1 font-black uppercase text-xs">Salir</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* FECHAS */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Fechas</h2>
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {events.map((event) => (
              <div key={event.id} className={`border-4 p-4 flex flex-col gap-4 ${event.is_approved ? 'border-zinc-700 bg-zinc-950/80' : 'border-red-600 bg-zinc-900'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 items-center text-left">
                    {event.flyer_url && <img src={event.flyer_url} className="w-12 h-12 object-cover border-2 border-white" />}
                    <div>
                      <h3 className="text-lg font-black uppercase leading-none">{event.band_name}</h3>
                      <p className="text-[9px] font-bold text-yellow-400 uppercase">{event.date} @ {event.venue}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => supabase.from('events').update({ is_approved: !event.is_approved }).eq('id', event.id).then(() => fetchData())} className={`px-2 py-1 font-black uppercase text-[9px] ${event.is_approved ? 'bg-zinc-800' : 'bg-green-600'}`}>{event.is_approved ? 'Bajar' : 'Aprobar'}</button>
                    <button onClick={() => confirm('¿Borrar?') && supabase.from('events').delete().eq('id', event.id).then(() => fetchData())} className="bg-red-600 px-2 py-1 font-black uppercase text-[9px]">X</button>
                  </div>
                </div>

                {event.is_approved && (
                  <div className="space-y-3 border-t border-zinc-800 pt-3">
                    <button onClick={() => toggleFeatured(event.id, event.is_featured)} className={`w-full py-1 font-black uppercase text-[8px] border-2 transition-all ${event.is_featured ? 'bg-yellow-400 text-black border-white' : 'bg-black text-yellow-400 border-yellow-400'}`}>★ BANNER PRINCIPAL</button>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => updateEventTag(event.id, 'PLANAZO')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'PLANAZO' ? 'bg-red-600 border-white' : 'border-red-600 text-red-600'}`}>PLANAZO</button>
                      <button onClick={() => updateEventTag(event.id, 'SALIDA SEGURA')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'SALIDA SEGURA' ? 'bg-yellow-400 border-black text-black' : 'border-yellow-400 text-yellow-400'}`}>SALIDA SEGURA</button>
                      <button onClick={() => updateEventTag(event.id, 'NO FALLA')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'NO FALLA' ? 'bg-white border-black text-black' : 'border-white text-white'}`}>NO FALLA</button>
                      <button onClick={() => updateEventTag(event.id, '')} className="px-2 py-1 text-[8px] font-black uppercase bg-zinc-800 text-zinc-400 border border-zinc-600">QUITAR ETIQUETA</button>
                    </div>
                    <button onClick={() => toggleSoldOut(event.id, event.is_sold_out)} className={`w-full py-1 text-[9px] font-black border-2 ${event.is_sold_out ? 'bg-red-600 border-white text-white shadow-lg animate-pulse' : 'border-zinc-700 text-zinc-500'}`}>{event.is_sold_out ? 'VENDER' : 'AGOTADO'}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SPONSORS & MORE */}
        <section className="space-y-12">
          {/* Publicidad */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2 text-left">Publicidad</h2>
            <form onSubmit={handleSaveSponsor} className="bg-zinc-950 p-6 border-4 border-white space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-zinc-500">{newSponsor.id ? 'EDITANDO ANUNCIO' : 'NUEVO ANUNCIO'}</span>
                {newSponsor.id && <button type="button" onClick={() => setNewSponsor({ id: null, client_name: '', image_url: '', link: '', position: 'sidebar' })} className="text-[8px] text-red-500 underline">Cancelar Edición</button>}
              </div>
              <input placeholder="Cliente" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white" value={newSponsor.client_name} onChange={e => setNewSponsor({...newSponsor, client_name: e.target.value})} required />
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative">
                <p className="text-[10px] font-black uppercase text-zinc-500 flex-1">{uploading ? 'Subiendo...' : (newSponsor.image_url ? 'Imagen OK ✅' : 'Subir Imagen/GIF')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'sponsors'); if (url) setNewSponsor({...newSponsor, image_url: url}); }
                }} />
                {newSponsor.image_url && <img src={newSponsor.image_url} className="h-10 w-10 object-cover border" />}
              </div>
              <div className="flex gap-2">
                <input placeholder="Link" className="flex-1 bg-black border-2 border-white p-2 text-xs text-white" value={newSponsor.link} onChange={e => setNewSponsor({...newSponsor, link: e.target.value})} />
                <select className="bg-black border-2 border-white p-2 text-xs text-white font-black" value={newSponsor.position} onChange={e => setNewSponsor({...newSponsor, position: e.target.value})}>
                  <option value="sidebar">Lateral</option>
                  <option value="bottom">Inferior</option>
                </select>
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-yellow-400 text-black font-black uppercase py-2 text-sm">{newSponsor.id ? 'Actualizar' : 'Guardar'}</button>
            </form>
            <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {sponsors.map(sp => (
                <div key={sp.id} className={`border-2 p-2 flex flex-col gap-2 ${sp.is_active ? 'border-yellow-400 bg-zinc-950' : 'border-zinc-800 opacity-50 bg-zinc-900'}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase truncate text-white text-left">{sp.client_name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setNewSponsor(sp)} className="px-1 py-0.5 bg-blue-600 text-[7px] font-black">EDITAR</button>
                      <button onClick={() => supabase.from('sponsors').update({ is_active: !sp.is_active }).eq('id', sp.id).then(() => fetchData())} className="px-1 py-0.5 bg-zinc-800 text-[7px] font-black uppercase">{sp.is_active ? 'PAUSA' : 'ACTIVO'}</button>
                      <button onClick={() => confirm('¿Borrar?') && supabase.from('sponsors').delete().eq('id', sp.id).then(() => fetchData())} className="px-1 py-0.5 bg-red-600 text-[7px] font-black">X</button>
                    </div>
                  </div>
                  <img src={sp.image_url} className="w-full h-12 object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Entrevistas */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-8 text-left">
            <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Entrevistas</h2>
            <form onSubmit={handleSaveInterview} className="bg-zinc-950 p-6 border-4 border-white space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-zinc-500">{newInterview.id ? 'EDITANDO ENTREVISTA' : 'NUEVA ENTREVISTA'}</span>
                {newInterview.id && <button type="button" onClick={() => setNewInterview({ id: null, title: '', band_name: '', content: '', image_url: '', is_active: true })} className="text-[8px] text-red-500 underline">Cancelar</button>}
              </div>
              <input placeholder="Título" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white" value={newInterview.title} onChange={e => setNewInterview({...newInterview, title: e.target.value})} required />
              <input placeholder="Banda" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white" value={newInterview.band_name} onChange={e => setNewInterview({...newInterview, band_name: e.target.value})} required />
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative">
                <p className="text-[10px] font-black uppercase text-zinc-500 flex-1">{uploading ? 'Subiendo...' : (newInterview.image_url ? 'Imagen OK ✅' : 'Subir Foto')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'interviews'); if (url) setNewInterview({...newInterview, image_url: url}); }
                }} />
              </div>
              <textarea placeholder="Contenido..." className="w-full bg-black border-2 border-white p-2 text-xs text-white h-24" value={newInterview.content} onChange={e => setNewInterview({...newInterview, content: e.target.value})} required />
              <button type="submit" disabled={uploading} className="w-full bg-yellow-400 text-black font-black uppercase py-2 text-sm">{newInterview.id ? 'Actualizar' : 'Publicar'}</button>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {interviews.map(int => (
                <div key={int.id} className={`border p-2 bg-zinc-900 flex justify-between items-center group ${int.is_active ? 'border-zinc-700' : 'border-red-600 opacity-50'}`}>
                  <span className="text-[8px] font-black uppercase text-zinc-400 truncate text-left">{int.title}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setNewInterview(int)} className="text-blue-500 text-[8px] font-black uppercase">Editar</button>
                    <button onClick={() => supabase.from('interviews').update({ is_active: !int.is_active }).eq('id', int.id).then(() => fetchData())} className="text-zinc-500 text-[8px] font-black uppercase">{int.is_active ? 'Pausa' : 'Activo'}</button>
                    <button onClick={() => confirm('¿Borrar?') && supabase.from('interviews').delete().eq('id', int.id).then(() => fetchData())} className="text-red-600 text-[8px] font-black">X</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mensajes */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-8 text-left">
            <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Mensajes</h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} onClick={() => setSelectedMessage(msg)} className={`border-2 p-3 cursor-pointer hover:bg-zinc-800 transition-colors ${msg.is_read ? 'border-zinc-800 bg-zinc-950/50 opacity-60' : 'border-white bg-zinc-900'}`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-black uppercase text-[10px] text-yellow-400">{msg.name}</h3>
                    {!msg.is_read && <button onClick={(e) => { e.stopPropagation(); supabase.from('contact_messages').update({ is_read: true }).eq('id', msg.id).then(() => fetchData()) }} className="text-[7px] bg-white text-black px-1 font-black uppercase">Marcar Leído</button>}
                  </div>
                  <p className="text-[9px] text-zinc-300 truncate italic">"{msg.message}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedMessage(null)} />
          <div className="relative w-full max-w-xl bg-zinc-900 border-8 border-white p-8 shadow-[20px_20px_0px_0px_rgba(234,179,8,1)] text-left">
            <button onClick={() => setSelectedMessage(null)} className="absolute -top-4 -right-4 bg-red-600 text-white w-10 h-10 font-black text-xl border-4 border-white">X</button>
            <h3 className="text-2xl font-black uppercase italic text-yellow-400 mb-2 border-b-2 border-yellow-400 pb-2">{selectedMessage.name}</h3>
            <p className="text-xs font-bold text-zinc-500 uppercase mb-6">{selectedMessage.email} - {new Date(selectedMessage.created_at).toLocaleString()}</p>
            <p className="text-lg text-white leading-relaxed whitespace-pre-wrap italic">"{selectedMessage.message}"</p>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #facc15; }
      `}</style>
    </div>
  );
}
