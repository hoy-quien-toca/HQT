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
    if (!newSponsor.image_url) return alert('Sube imagen primero');
    
    const { id, ...data } = newSponsor;
    let error;
    if (id) {
      const res = await supabase.from('sponsors').update(data).eq('id', id);
      error = res.error;
    } else {
      const res = await supabase.from('sponsors').insert([data]);
      error = res.error;
    }
    
    if (error) {
      alert('Error al guardar patrocinador: ' + error.message);
    } else {
      setNewSponsor({ id: null, client_name: '', image_url: '', link: '', position: 'sidebar' });
      fetchData();
    }
  }

  async function toggleSponsorStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase.from('sponsors').update({ is_active: !currentStatus }).eq('id', id);
    if (error) alert('Error: ' + error.message);
    else fetchData();
  }

  async function deleteSponsor(id: string) {
    if (confirm('¿Borrar auspicio?')) {
      const { error } = await supabase.from('sponsors').delete().eq('id', id);
      if (error) alert('Error: ' + error.message);
      else fetchData();
    }
  }

  // --- INTERVIEWS ---
  async function handleSaveInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!newInterview.image_url) return alert('Sube foto primero');
    
    const { id, ...data } = newInterview;
    let error;
    if (id) {
      const res = await supabase.from('interviews').update(data).eq('id', id);
      error = res.error;
    } else {
      const res = await supabase.from('interviews').insert([data]);
      error = res.error;
    }

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setNewInterview({ id: null, title: '', band_name: '', content: '', image_url: '', is_active: true });
      fetchData();
    }
  }

  async function deleteInterview(id: string) {
    if (confirm('¿Borrar?')) {
      await supabase.from('interviews').delete().eq('id', id);
      fetchData();
    }
  }

  async function toggleInterviewStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase.from('interviews').update({ is_active: !currentStatus }).eq('id', id);
    if (error) alert('Error: ' + error.message);
    else fetchData();
  }

  // --- MESSAGES ---
  async function deleteMessage(id: string) {
    if (confirm('¿Borrar mensaje?')) {
      await supabase.from('contact_messages').delete().eq('id', id);
      fetchData();
      setSelectedMessage(null);
    }
  }

  if (loading) return <div className="min-h-screen bg-black text-yellow-400 flex items-center justify-center font-black text-4xl uppercase italic">Cargando Admin...</div>;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 font-sans relative text-left">
      <header className="flex justify-between items-center mb-12 border-b-4 border-yellow-400 pb-6 bg-zinc-950 p-4 sticky top-0 z-50 shadow-xl">
        <h1 className="text-4xl font-black uppercase italic text-yellow-400">ADMINISTRADOR HQT</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="bg-white text-black px-4 py-1 font-black uppercase text-xs hover:bg-yellow-400 transition-colors">Web</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="bg-red-600 px-4 py-1 font-black uppercase text-xs hover:bg-white hover:text-black transition-colors">Salir</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* FECHAS */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Fechas</h2>
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {events.map((event) => (
              <div key={event.id} className={`border-4 p-4 flex flex-col gap-4 ${event.is_approved ? 'border-zinc-700 bg-zinc-950/80' : 'border-white bg-zinc-900'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    {event.flyer_url && <img src={event.flyer_url} className="w-12 h-12 object-cover border-2 border-white shadow-md" />}
                    <div>
                      <h3 className="text-lg font-black uppercase leading-none">{event.band_name}</h3>
                      <p className="text-[9px] font-bold text-yellow-400 uppercase">{event.date} @ {event.venue}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => supabase.from('events').update({ is_approved: !event.is_approved }).eq('id', event.id).then(() => fetchData())} className={`px-2 py-1 font-black uppercase text-[9px] border-2 border-white ${event.is_approved ? 'bg-zinc-800 text-zinc-400' : 'bg-green-600 text-white'}`}>{event.is_approved ? 'BAJAR' : 'APROBAR'}</button>
                    <button onClick={() => confirm('¿Borrar?') && supabase.from('events').delete().eq('id', event.id).then(() => fetchData())} className="bg-red-600 text-white px-2 py-1 font-black uppercase text-[9px] border-2 border-white">ELIMINAR</button>
                  </div>
                </div>

                {event.is_approved && (
                  <div className="space-y-3 border-t border-zinc-800 pt-3">
                    <button onClick={() => toggleFeatured(event.id, event.is_featured)} className={`w-full py-1 font-black uppercase text-[8px] border-2 transition-all ${event.is_featured ? 'bg-yellow-400 text-black border-white shadow-md' : 'bg-black text-yellow-400 border-yellow-400'}`}>★ BANNER PRINCIPAL</button>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => updateEventTag(event.id, 'PLANAZO')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'PLANAZO' ? 'bg-red-600 border-white text-white' : 'border-red-600 text-red-600'}`}>PLANAZO</button>
                      <button onClick={() => updateEventTag(event.id, 'SALIDA SEGURA')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'SALIDA SEGURA' ? 'bg-yellow-400 border-black text-black' : 'border-yellow-400 text-yellow-400'}`}>SALIDA SEGURA</button>
                      <button onClick={() => updateEventTag(event.id, 'NO FALLA')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'NO FALLA' ? 'bg-white border-black text-black' : 'border-white text-white'}`}>NO FALLA</button>
                      <button onClick={() => updateEventTag(event.id, '')} className="text-[7px] font-black uppercase text-zinc-500 underline ml-auto">Quitar Tag</button>
                    </div>
                    <button onClick={() => toggleSoldOut(event.id, event.is_sold_out)} className={`w-full py-1 text-[9px] font-black border-2 ${event.is_sold_out ? 'bg-red-600 border-white text-white' : 'border-zinc-700 text-zinc-500'}`}>{event.is_sold_out ? 'VENDER' : 'AGOTADO'}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SPONSORS, ENTREVISTAS, MENSAJES */}
        <section className="space-y-12">
          {/* Publicidad */}
          <div className="space-y-6 text-left">
            <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Publicidad</h2>
            <form onSubmit={handleSaveSponsor} className="bg-zinc-950 p-6 border-4 border-white space-y-4">
              <span className="text-[10px] font-black uppercase text-zinc-500">{newSponsor.id ? 'EDITANDO' : 'NUEVO'}</span>
              <input placeholder="Cliente" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white outline-none focus:border-yellow-400" value={newSponsor.client_name} onChange={e => setNewSponsor({...newSponsor, client_name: e.target.value})} required />
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative">
                <p className="text-[10px] font-black uppercase text-zinc-500 flex-1">{uploading ? 'Cargando...' : (newSponsor.image_url ? 'OK ✅' : 'Imagen/GIF')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'sponsors'); if (url) setNewSponsor({...newSponsor, image_url: url}); }
                }} />
                {newSponsor.image_url && <img src={newSponsor.image_url} className="h-10 w-10 object-cover border" />}
              </div>
              <div className="flex gap-2 text-white font-black">
                <input placeholder="Link" className="flex-1 bg-black border-2 border-white p-2 text-xs" value={newSponsor.link} onChange={e => setNewSponsor({...newSponsor, link: e.target.value})} />
                <select className="bg-black border-2 border-white p-2 text-xs uppercase" value={newSponsor.position} onChange={e => setNewSponsor({...newSponsor, position: e.target.value})}>
                  <option value="sidebar">LATERAL</option>
                  <option value="bottom">INFERIOR</option>
                </select>
              </div>
              <button type="submit" disabled={uploading} className={`w-full font-black uppercase py-2 text-sm ${newSponsor.id ? 'bg-blue-600 text-white border-2 border-white' : 'bg-yellow-400 text-black'}`}>{newSponsor.id ? 'ACTUALIZAR' : 'GUARDAR'}</button>
              {newSponsor.id && <button onClick={() => setNewSponsor({id:null, client_name:'', image_url:'', link:'', position:'sidebar'})} className="w-full text-[8px] font-black text-red-500 uppercase underline">Cancelar Edición</button>}
            </form>

            <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {sponsors.map(sp => (
                <div key={sp.id} className={`border-2 p-3 flex flex-col gap-2 ${sp.is_active ? 'border-yellow-400 bg-zinc-950' : 'border-zinc-800 opacity-50 bg-zinc-900'}`}>
                  <img src={sp.image_url} className="w-full h-12 object-cover border border-zinc-800" />
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setNewSponsor(sp)} className="px-2 py-0.5 bg-blue-600 text-white text-[7px] font-black border border-white">EDITAR</button>
                    <button onClick={() => toggleSponsorStatus(sp.id, sp.is_active)} className={`px-2 py-0.5 text-white text-[7px] font-black border border-white ${sp.is_active ? 'bg-green-600' : 'bg-zinc-700'}`}>{sp.is_active ? 'PAUSAR' : 'ACTIVAR'}</button>
                    <button onClick={() => deleteSponsor(sp.id)} className="px-2 py-0.5 bg-red-600 text-white text-[7px] font-black border border-white">ELIMINAR</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Entrevistas */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-8 text-left">
            <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Entrevistas</h2>
            <form onSubmit={handleSaveInterview} className="bg-zinc-950 p-6 border-4 border-white space-y-4 shadow-xl text-left">
              <input placeholder="Título" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white" value={newInterview.title} onChange={e => setNewInterview({...newInterview, title: e.target.value})} required />
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative">
                <p className="text-[10px] font-black uppercase text-zinc-500 flex-1">{uploading ? 'Cargando...' : (newInterview.image_url ? 'OK ✅' : 'Subir Foto')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'interviews'); if (url) setNewInterview({...newInterview, image_url: url}); }
                }} />
                {newInterview.image_url && <img src={newInterview.image_url} className="h-10 w-10 object-cover border" />}
              </div>
              <textarea placeholder="Contenido..." className="w-full bg-black border-2 border-white p-2 text-xs text-white h-24" value={newInterview.content} onChange={e => setNewInterview({...newInterview, content: e.target.value})} required />
              <button type="submit" disabled={uploading} className={`w-full font-black uppercase py-2 text-sm ${newInterview.id ? 'bg-blue-600 text-white border-2 border-white' : 'bg-yellow-400 text-black'}`}>{newInterview.id ? 'ACTUALIZAR' : 'PUBLICAR'}</button>
            </form>
            <div className="grid grid-cols-1 gap-2">
              {interviews.map(int => (
                <div key={int.id} className={`border-2 p-3 flex justify-between items-center ${int.is_active ? 'border-zinc-700 bg-zinc-900 shadow-md' : 'border-red-600 bg-zinc-950 opacity-40 grayscale italic'}`}>
                  <div className="truncate pr-4">
                    <span className="text-[10px] font-black uppercase text-yellow-400">{int.title}</span>
                    <p className="text-[8px] text-zinc-500 uppercase font-bold">{int.band_name} {int.is_active ? '' : '(PAUSADA)'}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setNewInterview(int)} className="px-2 py-0.5 bg-blue-600 text-white text-[7px] font-black border border-white">EDITAR</button>
                    <button onClick={() => toggleInterviewStatus(int.id, int.is_active)} className={`px-2 py-0.5 text-white text-[7px] font-black border border-white ${int.is_active ? 'bg-green-600' : 'bg-zinc-700'}`}>{int.is_active ? 'PAUSAR' : 'ACTIVAR'}</button>
                    <button onClick={() => deleteInterview(int.id)} className="px-2 py-0.5 bg-red-600 text-white text-[7px] font-black border border-white">ELIMINAR</button>
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
                <div key={msg.id} className={`border-2 p-3 flex flex-col gap-2 ${msg.is_read ? 'border-zinc-800 bg-zinc-950/50 opacity-60' : 'border-white bg-zinc-900'}`}>
                  <div className="flex justify-between items-start">
                    <div onClick={() => setSelectedMessage(msg)} className="cursor-pointer">
                      <h3 className="font-black uppercase text-[10px] text-yellow-400">{msg.name}</h3>
                      <p className="text-[9px] text-zinc-300 truncate max-w-[150px]">"{msg.message}"</p>
                    </div>
                    <div className="flex gap-1">
                      {!msg.is_read && <button onClick={() => supabase.from('contact_messages').update({ is_read: true }).eq('id', msg.id).then(() => fetchData())} className="text-[7px] bg-green-600 text-white px-2 py-0.5 font-black uppercase border border-white">LEER</button>}
                      <button onClick={() => deleteMessage(msg.id)} className="text-[7px] bg-red-600 text-white px-2 py-0.5 font-black uppercase border border-white">ELIMINAR</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedMessage(null)} />
          <div className="relative w-full max-w-xl bg-zinc-900 border-8 border-white p-8 shadow-[20px_20px_0px_0px_rgba(234,179,8,1)] text-left">
            <button onClick={() => setSelectedMessage(null)} className="absolute -top-4 -right-4 bg-red-600 text-white w-10 h-10 font-black text-xl border-4 border-white">X</button>
            <h3 className="text-2xl font-black uppercase italic text-yellow-400 mb-2 border-b-2 border-yellow-400 pb-2">{selectedMessage.name}</h3>
            <p className="text-xs font-bold text-zinc-500 uppercase mb-6">{selectedMessage.email}</p>
            <p className="text-lg text-white leading-relaxed whitespace-pre-wrap italic">"{selectedMessage.message}"</p>
            <button onClick={() => deleteMessage(selectedMessage.id)} className="mt-8 bg-red-600 text-white px-6 py-2 font-black uppercase text-xs border-2 border-white hover:bg-black transition-colors">Eliminar Mensaje</button>
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
