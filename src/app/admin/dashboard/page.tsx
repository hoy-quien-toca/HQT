'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]); // Renamed from ads
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [newInterview, setNewInterview] = useState({ title: '', band_name: '', content: '', image_url: '' });
  const [newSponsor, setNewSponsor] = useState({ client_name: '', image_url: '', link: '', position: 'sidebar' });

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
    // Note: We use 'sponsors' instead of 'ads' to avoid AdBlocker issues
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
    if (uploadError) {
      alert('Error: ' + uploadError.message);
      setUploading(false);
      return null;
    }

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

  async function handleCreateSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!newSponsor.image_url) return alert('Sube una imagen primero');
    const { error } = await supabase.from('sponsors').insert([newSponsor]);
    if (!error) {
      setNewSponsor({ client_name: '', image_url: '', link: '', position: 'sidebar' });
      fetchData();
    } else {
      alert('Error: ' + error.message);
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

  async function handleCreateInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!newInterview.image_url) return alert('Sube una foto primero');
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
    if (confirm('¿Borrar evento?')) {
      await supabase.from('events').delete().eq('id', id);
      fetchData();
    }
  }

  async function markAsRead(id: string) {
    await supabase.from('contact_messages').update({ is_read: true }).eq('id', id);
    fetchData();
  }

  if (loading) return <div className="min-h-screen bg-black text-yellow-400 flex items-center justify-center font-black text-4xl uppercase">Cargando Admin...</div>;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 font-sans relative">
      <header className="flex justify-between items-center mb-12 border-b-4 border-yellow-400 pb-6 bg-zinc-950 p-4 sticky top-0 z-50">
        <h1 className="text-4xl font-black uppercase italic text-yellow-400">ADMIN HQT</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="bg-white text-black px-4 py-1 font-black uppercase text-xs">Ver Web</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="bg-red-600 px-4 py-1 font-black uppercase text-xs">Salir</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gestión de Fechas */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Fechas</h2>
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {events.map((event) => (
              <div key={event.id} className={`border-4 p-4 flex flex-col gap-4 ${event.is_approved ? 'border-zinc-700 bg-zinc-950/80' : 'border-red-600 bg-zinc-900'}`}>
                <div className="flex justify-between items-center w-full">
                  <div className="flex gap-4 items-center">
                    {event.flyer_url && <img src={event.flyer_url} className="w-16 h-16 object-cover border-2 border-white shadow-md" />}
                    <div>
                      <h3 className="text-lg font-black uppercase leading-none">{event.band_name}</h3>
                      <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">{event.date} @ {event.venue}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleApproval(event.id, event.is_approved)} className={`px-2 py-1 font-black uppercase text-[10px] ${event.is_approved ? 'bg-zinc-800' : 'bg-green-600'}`}>{event.is_approved ? 'BAJAR' : 'APROBAR'}</button>
                    <button onClick={() => deleteEvent(event.id)} className="bg-red-600 px-2 py-1 font-black uppercase text-[10px]">X</button>
                  </div>
                </div>

                {event.is_approved && (
                  <div className="space-y-3 border-t border-zinc-800 pt-3">
                    <button onClick={() => toggleFeatured(event.id, event.is_featured)} className={`w-full py-1 font-black uppercase text-[10px] border-2 transition-all ${event.is_featured ? 'bg-yellow-400 text-black border-white' : 'bg-black text-yellow-400 border-yellow-400'}`}>
                      {event.is_featured ? '★ EN BANNER' : 'PONER EN BANNER'}
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => updateEventTag(event.id, 'PLANAZO')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'PLANAZO' ? 'bg-red-600 border-white text-white' : 'border-red-600 text-red-600'}`}>PLANAZO</button>
                      <button onClick={() => updateEventTag(event.id, 'SALIDA SEGURA')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'SALIDA SEGURA' ? 'bg-yellow-400 border-black text-black' : 'border-yellow-400 text-yellow-400'}`}>SALIDA SEGURA</button>
                      <button onClick={() => updateEventTag(event.id, 'NO FALLA')} className={`px-2 py-1 text-[8px] font-black border-2 ${event.suggestion_tag === 'NO FALLA' ? 'bg-white border-black text-black' : 'border-white text-white'}`}>NO FALLA</button>
                      <button onClick={() => updateEventTag(event.id, '')} className="text-[7px] text-zinc-500 underline">Borrar Tag</button>
                    </div>
                    <button onClick={() => toggleSoldOut(event.id, event.is_sold_out)} className={`w-full py-1 text-[9px] font-black border-2 ${event.is_sold_out ? 'bg-red-600 border-white text-white' : 'border-zinc-700 text-zinc-500'}`}>{event.is_sold_out ? 'VENDER' : 'AGOTADO'}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Publicidad, Entrevistas y Mensajes */}
        <section className="space-y-12">
          {/* Publicidad (Ahora Sponsors) */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Publicidad</h2>
            <form onSubmit={handleCreateSponsor} className="bg-zinc-950 p-6 border-4 border-white space-y-4">
              <input placeholder="Cliente" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white focus:border-yellow-400 outline-none" value={newSponsor.client_name} onChange={e => setNewSponsor({...newSponsor, client_name: e.target.value})} required />
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
                  <option value="sidebar">LATERAL</option>
                  <option value="bottom">INFERIOR</option>
                </select>
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-yellow-400 text-black font-black uppercase py-2 text-sm hover:bg-white">Guardar</button>
            </form>

            <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {sponsors.map(sp => (
                <div key={sp.id} className={`border-2 p-2 flex flex-col gap-2 ${sp.is_active ? 'border-yellow-400 bg-zinc-950' : 'border-zinc-800 opacity-50 bg-zinc-900'}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase truncate text-white">{sp.client_name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => toggleSponsorStatus(sp.id, sp.is_active)} className="px-1 py-0.5 bg-zinc-800 text-[7px] font-black uppercase">O</button>
                      <button onClick={() => deleteSponsor(sp.id)} className="px-1 py-0.5 bg-red-600 text-[7px] font-black uppercase">X</button>
                    </div>
                  </div>
                  <img src={sp.image_url} className="w-full h-12 object-cover border border-zinc-800" />
                </div>
              ))}
            </div>
          </div>

          {/* Entrevistas (Restaurado) */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-8">
            <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Entrevistas</h2>
            <form onSubmit={handleCreateInterview} className="bg-zinc-950 p-6 border-4 border-white space-y-4">
              <input placeholder="Título" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white" value={newInterview.title} onChange={e => setNewInterview({...newInterview, title: e.target.value})} required />
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative">
                <p className="text-[10px] font-black uppercase text-zinc-500 flex-1">{uploading ? 'Subiendo...' : (newInterview.image_url ? 'Foto OK ✅' : 'Foto Banda')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'interviews'); if (url) setNewInterview({...newInterview, image_url: url}); }
                }} />
              </div>
              <textarea placeholder="Contenido..." className="w-full bg-black border-2 border-white p-2 text-xs text-white h-24" value={newInterview.content} onChange={e => setNewInterview({...newInterview, content: e.target.value})} required />
              <button type="submit" disabled={uploading} className="w-full bg-yellow-400 text-black font-black uppercase py-2 text-sm hover:bg-white">Publicar</button>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {interviews.map(int => (
                <div key={int.id} className="border border-zinc-700 p-2 bg-zinc-900 flex justify-between items-center group">
                  <span className="text-[8px] font-black uppercase text-zinc-400 truncate">{int.title}</span>
                  <button onClick={() => deleteInterview(int.id)} className="text-red-600 font-black px-1 opacity-0 group-hover:opacity-100 transition-opacity">X</button>
                </div>
              ))}
            </div>
          </div>

          {/* Mensajes */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-8">
            <h2 className="text-2xl font-black uppercase italic text-yellow-400 border-l-8 border-yellow-400 pl-4 bg-zinc-950 py-2">Mensajes</h2>
            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`border-2 p-3 ${msg.is_read ? 'border-zinc-800 opacity-60' : 'border-white bg-zinc-900'}`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-black uppercase text-[10px] text-yellow-400">{msg.name}</h3>
                    {!msg.is_read && <button onClick={() => markAsRead(msg.id)} className="text-[7px] bg-white text-black px-1 font-black uppercase">Leído</button>}
                  </div>
                  <p className="text-[9px] text-zinc-300 leading-tight mt-1">"{msg.message}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #facc15; }
      `}</style>
    </div>
  );
}
/ /   f o r c e   u p d a t e  
 