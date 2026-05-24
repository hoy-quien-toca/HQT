'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const DEPARTAMENTOS = ["MONTEVIDEO", "CANELONES", "MALDONADO", "COLONIA", "SAN JOSE", "FLORIDA", "LAVALLEJA", "ROCHA", "TREINTA Y TRES", "CERRO LARGO", "RIVERA", "TACUAREMBÓ", "DURAZNO", "SORIANO", "RIO NEGRO", "PAYSANDU", "SALTO", "ARTIGAS"];
const GENEROS = ["ROCK", "CUMBIA", "PLENA", "ELECTRONICA", "TECHNO", "HOUSE", "INDIE", "POP", "TRAP", "REGGAETON", "HIP-HOP/RAP", "PUNK ROCK", "METAL", "FOLKLORE", "TANGO", "JAZZ", "BLUES", "FUNK", "REGGUE", "SKA", "ALTERNATIVO", "CARNAVAL", "MURGA", "TROPICAL", "LATINA", "ACUSTICO", "COVERS", "FIESTA", "DJ-SET", "UNDER"];

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newSponsor, setNewSponsor] = useState({ id: null, client_name: '', image_url: '', link: '', position: 'sidebar', display_order: 0 });
  const [newInterview, setNewInterview] = useState<any>({ id: null, title: '', subtitle: '', band_name: '', content: '', image_url: '', is_active: true, author: '', photo_credit: '' });
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);

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
      supabase.from('sponsors').select('*').order('position', { ascending: true }).order('display_order', { ascending: true })
    ]);
    const sortedEvents = (eventRes.data || []).sort((a: any, b: any) => {
      if (!a.is_approved && b.is_approved) return -1;
      if (a.is_approved && !b.is_approved) return 1;
      if (a.is_featured && !b.is_featured) return -1;
      return 0;
    });
    setEvents(sortedEvents); setMessages(messageRes.data || []); setInterviews(interviewRes.data || []); setSponsors(sponsorRes.data || []); setLoading(false);
  }

  async function handleFileUpload(file: File, folder: string) {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${folder}/${Math.random()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('hqt-assets').upload(filePath, file);
    if (uploadError) { alert('Error: ' + uploadError.message); setUploading(false); return null; }
    const { data } = supabase.storage.from('hqt-assets').getPublicUrl(filePath);
    setUploading(false); return data.publicUrl;
  }

  async function toggleSoldOut(id: string, current: boolean) { await supabase.from('events').update({ is_sold_out: !current }).eq('id', id); fetchData(); }
  async function toggleSuspended(id: string, current: boolean) { await supabase.from('events').update({ is_suspended: !current }).eq('id', id); fetchData(); }
  async function toggleFeatured(id: string, current: boolean) { await supabase.from('events').update({ is_featured: !current }).eq('id', id); fetchData(); }
  async function updateEventTag(id: string, tag: string, current?: string | null) {
    const next = current === tag ? null : tag;
    await supabase.from('events').update({ suggestion_tag: next }).eq('id', id);
    fetchData();
  }
  async function deleteEvent(id: string) {
    if (!confirm('¿Borrar esta fecha? No se puede deshacer.')) return;
    await supabase.from('events').delete().eq('id', id);
    if (editingEvent?.id === id) setEditingEvent(null);
    fetchData();
  }
  async function deleteSponsor(id: string) {
    if (!confirm('¿Borrar esta publicidad? No se puede deshacer.')) return;
    await supabase.from('sponsors').delete().eq('id', id);
    if (newSponsor.id === id) setNewSponsor({ id: null, client_name: '', image_url: '', link: '', position: 'sidebar', display_order: 0 });
    fetchData();
  }

  function sponsorPositionLabel(position: string) {
    if (position === 'top') return 'Banner superior';
    if (position === 'sidebar') return 'Lateral';
    if (position === 'bottom') return 'Inferior';
    return position;
  }

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault(); if (!editingEvent) return;
    const { id, created_at, ...data } = editingEvent;
    const res = id === 'new' ? await supabase.from('events').insert([data]) : await supabase.from('events').update(data).eq('id', id);
    if (res.error) alert('Error: ' + res.error.message); else { setEditingEvent(null); fetchData(); }
  }

  async function handleSaveSponsor(e: React.FormEvent) {
    e.preventDefault(); if (!newSponsor.image_url) return alert('Sube imagen');
    const { id, ...data } = newSponsor;
    const res = id ? await supabase.from('sponsors').update(data).eq('id', id) : await supabase.from('sponsors').insert([data]);
    if (res.error) alert('Error: ' + res.error.message); else { setNewSponsor({ id: null, client_name: '', image_url: '', link: '', position: 'sidebar', display_order: 0 }); fetchData(); }
  }

  async function handleSaveInterview(e: React.FormEvent) {
    e.preventDefault(); if (!newInterview.image_url) return alert('Sube foto');
    const { id, created_at, published_at, ...data } = newInterview;
    const finalData = { title: data.title, subtitle: data.subtitle, band_name: data.band_name, content: data.content, image_url: data.image_url, is_active: data.is_active, author: data.author, photo_credit: data.photo_credit };
    const res = id ? await supabase.from('interviews').update(finalData).eq('id', id) : await supabase.from('interviews').insert([finalData]);
    if (res.error) alert('Error: ' + res.error.message); else { alert('¡Guardado!'); setNewInterview({ id: null, title: '', subtitle: '', band_name: '', content: '', image_url: '', is_active: true, author: '', photo_credit: '' }); fetchData(); }
  }

  async function deleteMessage(id: string) { if (confirm('¿Borrar?')) { await supabase.from('contact_messages').delete().eq('id', id); fetchData(); setSelectedMessage(null); } }
  async function deleteInterview(id: string) { if (confirm('¿Borrar?')) { await supabase.from('interviews').delete().eq('id', id); fetchData(); } }
  async function toggleInterviewStatus(id: string, current: boolean) { await supabase.from('interviews').update({ is_active: !current }).eq('id', id); fetchData(); }
  async function toggleSponsorStatus(id: string, current: boolean) { await supabase.from('sponsors').update({ is_active: !current }).eq('id', id); fetchData(); }

  if (loading) return <div className="min-h-screen bg-black text-red-600 flex items-center justify-center font-black text-2xl uppercase italic">Cargando Admin...</div>;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 md:p-6 font-sans relative text-left overflow-x-hidden font-black">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-4 border-red-600 pb-6 bg-zinc-950 p-4 sticky top-0 z-50 gap-4">
        <div><h1 className="text-3xl md:text-4xl font-black uppercase italic text-red-600 leading-none">ADMINISTRADOR HQT</h1></div>
        <div className="flex gap-4"><button onClick={() => router.push('/')} className="bg-white text-black px-4 py-1 font-black uppercase text-xs rounded-full">Web</button><button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="bg-red-600 px-4 py-1 font-black uppercase text-xs rounded-full">Salir</button></div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        {/* IZQUIERDA: FECHAS */}
        <section className="space-y-6">
          <div className="flex justify-between items-center bg-zinc-950 p-4 border-l-8 border-red-600 rounded-r-2xl font-black">
             <h2 className="text-2xl uppercase italic text-red-600 font-franklin">Fechas</h2>
             <button onClick={() => setEditingEvent({ id: 'new', band_name: '', venue: '', address: '', city: '', department: 'MONTEVIDEO', date: '', time: '21:00', age_rating: 'ATP', description: '', is_approved: false, price_type: 'range', genre: 'ROCK', flyer_url: '', price_min: '', price_max: '', ticket_type: 'link', ticket_contact: '' })} className="bg-red-600 text-white px-6 py-2 text-[10px] font-black uppercase rounded-full border-2 border-white">+ NUEVA FECHA</button>
          </div>
          
          {editingEvent && (
            <div className="border-4 border-blue-600 p-4 bg-zinc-950 space-y-4 rounded-3xl font-black">
              <form onSubmit={handleSaveEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white">
                <input required value={editingEvent.band_name} onChange={e => setEditingEvent({...editingEvent, band_name: e.target.value})} className="sm:col-span-2 bg-black border-2 border-white p-2 uppercase font-bold rounded-lg" placeholder="Banda" />
                <input required value={editingEvent.venue || ''} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} className="bg-black border-2 border-white p-2 uppercase rounded-lg" placeholder="Lugar" />
                <input required value={editingEvent.address || ''} onChange={e => setEditingEvent({...editingEvent, address: e.target.value})} className="bg-black border-2 border-white p-2 uppercase rounded-lg" placeholder="Dirección" />
                <input required value={editingEvent.city || ''} onChange={e => setEditingEvent({...editingEvent, city: e.target.value})} className="bg-black border-2 border-white p-2 uppercase rounded-lg" placeholder="Ciudad" />
                <select value={editingEvent.department} onChange={e => setEditingEvent({...editingEvent, department: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg">{DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                <select value={editingEvent.genre} onChange={e => setEditingEvent({...editingEvent, genre: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg">{GENEROS.map(g => <option key={g} value={g}>{g}</option>)}</select>
                <input required type="date" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg" />
                <input required type="time" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg" />
                <select value={editingEvent.age_rating} onChange={e => setEditingEvent({...editingEvent, age_rating: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg uppercase"><option value="ATP">ATP</option><option value="+12">+12</option><option value="+18">+18</option></select>
                <select value={editingEvent.price_type} onChange={e => setEditingEvent({...editingEvent, price_type: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg uppercase"><option value="range">PAGO</option><option value="free">LIBRE</option></select>
                <div className="grid grid-cols-2 gap-2 col-span-2"><input type="number" placeholder="Mín $" value={editingEvent.price_min || ''} onChange={e => setEditingEvent({...editingEvent, price_min: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg" /><input type="number" placeholder="Máx $" value={editingEvent.price_max || ''} onChange={e => setEditingEvent({...editingEvent, price_max: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg" /></div>
                <div className="col-span-2 flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative rounded-xl font-black"><p className="text-[10px] uppercase text-zinc-500 flex-1">{uploading ? '...' : (editingEvent.flyer_url ? 'Foto OK ✅' : 'Subir Flyer')}</p><input type="file" className="absolute inset-0 opacity-0" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await handleFileUpload(f, 'flyers'); if (u) setEditingEvent({...editingEvent, flyer_url: u}); } }} /></div>
                <textarea value={editingEvent.description || ''} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} className="sm:col-span-2 bg-black border-2 border-white p-2 uppercase rounded-lg h-20" placeholder="Reseña" />
                <div className="sm:col-span-2 flex gap-2"><button type="submit" className="flex-1 bg-blue-600 py-3 font-black border-2 border-white rounded-full uppercase shadow-lg">GUARDAR</button><button type="button" onClick={() => setEditingEvent(null)} className="bg-zinc-700 px-6 font-black border-2 border-white rounded-full">X</button></div>
              </form>
            </div>
          )}

          <div className="space-y-3 max-h-[min(36rem,60vh)] overflow-y-auto pr-2 custom-scrollbar">
            {events.map((ev) => (
              <div key={ev.id} className={`border-4 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center rounded-3xl ${!ev.is_approved ? 'border-red-600 bg-zinc-900 animate-pulse' : 'border-zinc-700 bg-zinc-950/80'}`}>
                <img src={ev.flyer_url || '/logo-rojo.jpg'} alt={ev.band_name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover border-2 border-white rounded-xl flex-shrink-0" />
                <div className="min-w-0 flex-1 w-full">
                  <h3 className="text-base sm:text-lg font-black uppercase leading-tight truncate">{ev.band_name}</h3>
                  <p className="text-xs font-bold text-red-600 uppercase mt-1">{ev.date} — {ev.time?.substring(0, 5)} hs · {ev.venue}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" onClick={() => setEditingEvent(ev)} className="bg-blue-600 text-[11px] sm:text-xs px-3 py-1 rounded-full border border-white font-black">EDITAR</button>
                    <button type="button" onClick={() => supabase.from('events').update({ is_approved: !ev.is_approved }).eq('id', ev.id).then(() => fetchData())} className={`text-[11px] sm:text-xs px-3 py-1 rounded-full border border-white font-black ${ev.is_approved ? 'bg-zinc-800' : 'bg-green-600'}`}>{ev.is_approved ? 'BAJAR' : 'APROBAR'}</button>
                    <button type="button" onClick={() => deleteEvent(ev.id)} className="text-[11px] sm:text-xs bg-red-600 px-3 py-1 rounded-full border border-white font-black">BORRAR</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button type="button" onClick={() => toggleFeatured(ev.id, ev.is_featured)} className={`text-[11px] sm:text-xs px-3 py-1 rounded-full border font-black ${ev.is_featured ? 'bg-red-600 border-white text-white' : 'border-red-600 text-red-600'}`} title="Carrusel destacado arriba en la home">BANNER</button>
                    <button type="button" onClick={() => updateEventTag(ev.id, 'PLANAZO', ev.suggestion_tag)} className={`text-[11px] sm:text-xs px-3 py-1 rounded-full border font-black ${ev.suggestion_tag === 'PLANAZO' ? 'bg-yellow-400 text-black border-black' : 'border-yellow-400 text-yellow-400'}`}>PLANAZO</button>
                    <button type="button" onClick={() => updateEventTag(ev.id, 'NO FALLA', ev.suggestion_tag)} className={`text-[11px] sm:text-xs px-3 py-1 rounded-full border font-black ${ev.suggestion_tag === 'NO FALLA' ? 'bg-white text-black border-black' : 'border-white text-white'}`}>NO FALLA</button>
                    <button type="button" onClick={() => updateEventTag(ev.id, 'SALIDA SEGURA', ev.suggestion_tag)} className={`text-[11px] sm:text-xs px-3 py-1 rounded-full border font-black ${ev.suggestion_tag === 'SALIDA SEGURA' ? 'bg-green-600 border-white text-white' : 'border-green-600 text-green-600'}`}>SALIDA SEGURA</button>
                    <button type="button" onClick={() => toggleSoldOut(ev.id, ev.is_sold_out)} className={`text-[11px] sm:text-xs px-3 py-1 rounded-full border font-black ${ev.is_sold_out ? 'bg-red-600 border-white text-white' : 'border-red-600 text-red-600'}`}>AGOTADO</button>
                    <button type="button" onClick={() => toggleSuspended(ev.id, ev.is_suspended)} className={`text-[11px] sm:text-xs px-3 py-1 rounded-full border font-black ${ev.is_suspended ? 'bg-white text-black border-black' : 'border-zinc-500 text-zinc-500'}`}>SUSPENDIDO</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DERECHA: MENSAJES -> PUBLICIDAD -> ENTREVISTAS */}
        <section className="space-y-12">
          {/* MENSAJES */}
          <div className="space-y-6">
            <h2 className="text-2xl uppercase italic text-red-600 border-l-8 border-red-600 pl-4 bg-zinc-950 py-2 font-franklin">Mensajes</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar font-black">
              {messages.map((m) => (
                <div key={m.id} className="border-2 p-3 flex justify-between items-center border-white bg-zinc-900 rounded-2xl">
                  <div onClick={() => setSelectedMessage(m)} className="cursor-pointer flex-1 truncate pr-4"><h3 className="uppercase text-[10px] text-red-600">{m.name}</h3><p className="text-[9px] text-zinc-300 truncate">"{m.message}"</p></div>
                  <div className="flex gap-2"><button onClick={() => setSelectedMessage(m)} className="text-[7px] bg-blue-600 px-2 py-0.5 rounded-full border border-white">VER</button><button onClick={() => deleteMessage(m.id)} className="text-[7px] bg-red-600 px-2 py-0.5 rounded-full border border-white">BORRAR</button></div>
                </div>
              ))}
            </div>
          </div>

          {/* PUBLICIDAD */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-8">
            <h2 className="text-2xl uppercase italic text-red-600 border-l-8 border-red-600 pl-4 bg-zinc-950 py-2 font-franklin">Publicidad</h2>
            <form onSubmit={handleSaveSponsor} className="bg-zinc-950 p-4 border-4 border-white space-y-4 rounded-[32px] font-black">
              <input placeholder="Nombre Cliente" className="w-full bg-black border-2 border-white p-2 uppercase text-xs rounded-xl" value={newSponsor.client_name} onChange={e => setNewSponsor({...newSponsor, client_name: e.target.value})} required />
              <input placeholder="Link Web" className="w-full bg-black border-2 border-white p-2 text-xs rounded-xl" value={newSponsor.link} onChange={e => setNewSponsor({...newSponsor, link: e.target.value})} />
              <div className="grid grid-cols-2 gap-2"><select value={newSponsor.position} onChange={e => setNewSponsor({...newSponsor, position: e.target.value})} className="bg-black border-2 border-white p-2 text-xs rounded-xl"><option value="top">BANNER SUPERIOR</option><option value="sidebar">LATERAL</option><option value="bottom">INFERIOR</option></select><input type="number" placeholder="Orden" value={newSponsor.display_order} onChange={e => setNewSponsor({...newSponsor, display_order: parseInt(e.target.value) || 0})} className="bg-black border-2 border-white p-2 text-xs rounded-xl" /></div>
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative rounded-xl font-black font-black"><p className="text-[10px] uppercase text-zinc-500 flex-1 font-black">{uploading ? '...' : (newSponsor.image_url ? 'Imagen OK ✅' : 'Subir Imagen')}</p><input type="file" className="absolute inset-0 opacity-0" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await handleFileUpload(f, 'sponsors'); if (u) setNewSponsor({...newSponsor, image_url: u}); } }} /></div>
              <button type="submit" disabled={uploading} className="w-full bg-red-600 py-2 text-xs border-2 border-white rounded-full font-black">GUARDAR</button>
            </form>
            <div className="space-y-3 max-h-[min(28rem,50vh)] overflow-y-auto pr-2 custom-scrollbar">
              {sponsors.map(sp => (
                <div
                  key={sp.id}
                  className={`border-4 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center rounded-3xl ${
                    sp.is_active ? 'border-red-600 bg-zinc-950' : 'border-zinc-800 opacity-60 bg-zinc-900'
                  }`}
                >
                  <img
                    src={sp.image_url || '/logo-rojo.jpg'}
                    alt={sp.client_name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain bg-black border-2 border-white rounded-xl flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1 w-full">
                    <h3 className="text-base sm:text-lg font-black uppercase leading-tight truncate">{sp.client_name}</h3>
                    <p className="text-xs font-bold text-red-600 uppercase mt-1">
                      {sponsorPositionLabel(sp.position)} · Orden {sp.display_order}
                    </p>
                    {sp.link && (
                      <p className="text-[11px] text-zinc-400 truncate mt-1">{sp.link}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setNewSponsor(sp)}
                        className="text-[11px] sm:text-xs bg-blue-600 px-3 py-1 rounded-full border border-white font-black"
                      >
                        EDITAR
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSponsorStatus(sp.id, sp.is_active)}
                        className="text-[11px] sm:text-xs bg-green-600 px-3 py-1 rounded-full border border-white font-black"
                      >
                        {sp.is_active ? 'PAUSA' : 'ACTIVO'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSponsor(sp.id)}
                        className="text-[11px] sm:text-xs bg-red-600 px-3 py-1 rounded-full border border-white font-black"
                      >
                        BORRAR
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ENTREVISTAS */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-8">
            <h2 className="text-2xl uppercase italic text-red-600 border-l-8 border-red-600 pl-4 bg-zinc-950 py-2 font-franklin font-black">Entrevistas</h2>
            <form onSubmit={handleSaveInterview} className="bg-zinc-950 p-4 border-4 border-white space-y-4 rounded-[32px] font-black">
              <input placeholder="Banda / Artista" className="w-full bg-black border-2 border-white p-2 uppercase text-xs rounded-xl" value={newInterview.band_name} onChange={e => setNewInterview({...newInterview, band_name: e.target.value})} required />
              <input placeholder="Título de la nota" className="w-full bg-black border-2 border-white p-2 uppercase text-xs rounded-xl" value={newInterview.title} onChange={e => setNewInterview({...newInterview, title: e.target.value})} required />
              <input placeholder="Subtítulo / Bajada" className="w-full bg-black border-2 border-white p-2 uppercase text-xs rounded-xl" value={newInterview.subtitle} onChange={e => setNewInterview({...newInterview, subtitle: e.target.value})} />
              <div className="grid grid-cols-2 gap-2"><input placeholder="Créditos Nota" className="bg-black border-2 border-white p-2 text-xs rounded-xl" value={newInterview.author} onChange={e => setNewInterview({...newInterview, author: e.target.value})} /><input placeholder="Créditos Foto" className="bg-black border-2 border-white p-2 text-xs rounded-xl" value={newInterview.photo_credit} onChange={e => setNewInterview({...newInterview, photo_credit: e.target.value})} /></div>
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative rounded-xl font-black"><p className="text-[10px] uppercase text-zinc-500 flex-1">{uploading ? '...' : (newInterview.image_url ? 'Imagen OK ✅' : 'Subir Foto')}</p><input type="file" className="absolute inset-0 opacity-0" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await handleFileUpload(f, 'interviews'); if (u) setNewInterview({...newInterview, image_url: u}); } }} /></div>
              <textarea placeholder="Contenido de la entrevista..." className="w-full bg-black border-2 border-white p-2 text-xs rounded-xl h-24" value={newInterview.content} onChange={e => setNewInterview({...newInterview, content: e.target.value})} required />
              <div className="flex gap-2"><button type="submit" disabled={uploading} className="flex-1 bg-red-600 py-2 text-xs border-2 border-white rounded-full font-black">PUBLICAR</button>{newInterview.id && <button type="button" onClick={() => setNewInterview({id:null, title:'', subtitle:'', band_name:'', content:'', image_url:'', is_active:true, author:'', photo_credit:''})} className="bg-zinc-700 px-4 border border-white rounded-full font-black font-black">X</button>}</div>
            </form>
            <div className="space-y-3 max-h-[min(32rem,55vh)] overflow-y-auto pr-2 custom-scrollbar">
              {interviews.map(int => (
                <div
                  key={int.id}
                  className={`border-4 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center rounded-3xl ${
                    int.is_active
                      ? 'border-red-600 bg-zinc-950 shadow-md'
                      : 'border-zinc-800 opacity-50 bg-zinc-900 grayscale'
                  }`}
                >
                  <img
                    src={int.image_url || '/logo-rojo.jpg'}
                    alt={int.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover border-2 border-white rounded-xl flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1 w-full">
                    <h3 className="text-base sm:text-lg font-black uppercase leading-tight line-clamp-2">{int.title}</h3>
                    <p className="text-xs font-bold text-red-600 uppercase mt-1 truncate">{int.band_name}</p>
                    {int.subtitle && (
                      <p className="text-[11px] text-zinc-400 uppercase mt-1 line-clamp-2 italic">{int.subtitle}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedInterview(int)}
                        className="text-[11px] sm:text-xs bg-zinc-700 text-white px-3 py-1 rounded-full border border-white font-black"
                      >
                        VER
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewInterview(int)}
                        className="text-[11px] sm:text-xs bg-blue-600 px-3 py-1 rounded-full border border-white font-black"
                      >
                        EDITAR
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleInterviewStatus(int.id, int.is_active)}
                        className="text-[11px] sm:text-xs bg-green-600 px-3 py-1 rounded-full border border-white font-black"
                      >
                        {int.is_active ? 'PAUSA' : 'ACTIVO'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteInterview(int.id)}
                        className="text-[11px] sm:text-xs bg-red-600 px-3 py-1 rounded-full border border-white font-black"
                      >
                        BORRAR
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedMessage(null)} /><div className="relative w-full max-w-xl bg-zinc-900 border-8 border-white p-8 shadow-2xl rounded-[50px] font-black text-left font-black"><button onClick={() => setSelectedMessage(null)} className="absolute -top-4 -right-4 bg-red-600 text-white w-10 h-10 text-xl border-4 border-white rounded-full">X</button><h3 className="text-2xl uppercase text-red-600 mb-2">{selectedMessage.name}</h3><p className="text-xs text-zinc-500 mb-2 italic">{selectedMessage.email} | {selectedMessage.phone}</p><p className="text-lg text-white">"{selectedMessage.message}"</p><button onClick={() => { if(confirm('¿Borrar?')) deleteMessage(selectedMessage.id) }} className="mt-6 bg-red-600 text-white px-6 py-2 rounded-full uppercase text-xs border-2 border-white">ELIMINAR</button></div></div>
      )}

      {selectedInterview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setSelectedInterview(null)} /><div className="relative w-full max-w-2xl bg-zinc-900 border-8 border-white p-6 md:p-10 shadow-2xl rounded-[40px] font-black text-left overflow-y-auto max-h-[90vh]"><button onClick={() => setSelectedInterview(null)} className="absolute top-4 right-4 bg-red-600 text-white w-10 h-10 text-xl border-4 border-white rounded-full">X</button><span className="bg-red-600 text-white px-4 py-1 text-xs uppercase italic rounded-full font-black">BANDA: {selectedInterview.band_name}</span><h3 className="text-3xl md:text-5xl font-franklin text-white uppercase mt-4 leading-none">{selectedInterview.title}</h3><p className="text-zinc-400 text-lg uppercase italic mt-2">{selectedInterview.subtitle}</p>{selectedInterview.image_url && <img src={selectedInterview.image_url} className="w-full h-64 object-cover border-4 border-white rounded-3xl my-6" />}<div className="flex justify-between text-[10px] text-zinc-500 uppercase mb-6 font-black"><p>Nota: {selectedInterview.author}</p><p>Foto: {selectedInterview.photo_credit}</p></div><div className="text-white text-xl leading-relaxed whitespace-pre-wrap font-black">{selectedInterview.content}</div></div></div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; border-radius: 10px; }
      `}</style>
    </div>
  );
}
