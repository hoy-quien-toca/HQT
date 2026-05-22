'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const DEPARTAMENTOS = [
  "MONTEVIDEO", "CANELONES", "MALDONADO", "COLONIA", "SAN JOSE", 
  "FLORIDA", "LAVALLEJA", "ROCHA", "TREINTA Y TRES", "CERRO LARGO", 
  "RIVERA", "TACUAREMBÓ", "DURAZNO", "SORIANO", "RIO NEGRO", 
  "PAYSANDU", "SALTO", "ARTIGAS"
];

const GENEROS = [
  "ROCK", "CUMBIA", "PLENA", "ELECTRONICA", "TECHNO", "HOUSE", "INDIE", 
  "POP", "TRAP", "REGGAETON", "HIP-HOP/RAP", "PUNK ROCK", "METAL", 
  "FOLKLORE", "TANGO", "JAZZ", "BLUES", "FUNK", "REGGUE", "SKA", 
  "ALTERNATIVO", "CARNAVAL", "MURGA", "TROPICAL", "LATINA", 
  "ACUSTICO", "COVERS", "FIESTA", "DJ-SET", "UNDER"
];

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Forms State
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newSponsor, setNewSponsor] = useState({ id: null, client_name: '', image_url: '', link: '', position: 'sidebar' });
  const [newInterview, setNewInterview] = useState({ id: null, title: '', subtitle: '', band_name: '', content: '', image_url: '', is_active: true, author: '', photo_credit: '' });
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

    const sortedEvents = (eventRes.data || []).sort((a: any, b: any) => {
      if (!a.is_approved && b.is_approved) return -1;
      if (a.is_approved && !b.is_approved) return 1;
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return 0;
    });

    setEvents(sortedEvents);
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
  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEvent) return;
    const { id, created_at, ...data } = editingEvent;
    const finalData = {
      ...data,
      price_min: data.price_min ? parseInt(data.price_min) : null,
      price_max: data.price_max ? parseInt(data.price_max) : null,
    };
    const { error } = await supabase.from('events').update(finalData).eq('id', id);
    if (error) alert('Error: ' + error.message);
    else { setEditingEvent(null); fetchData(); }
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
  async function toggleSuspended(id: string, currentStatus: boolean) {
    await supabase.from('events').update({ is_suspended: !currentStatus }).eq('id', id);
    fetchData();
  }
  async function deleteEvent(id: string) {
    if (confirm('¿Borrar toque definitivamente?')) {
      await supabase.from('events').delete().eq('id', id);
      fetchData();
    }
  }

  // --- SPONSORS ---
  async function handleSaveSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!newSponsor.image_url) return alert('Sube imagen primero');
    const { id, ...data } = newSponsor;
    let error;
    if (id) error = (await supabase.from('sponsors').update(data).eq('id', id)).error;
    else error = (await supabase.from('sponsors').insert([data])).error;
    if (error) alert('Error: ' + error.message);
    else { setNewSponsor({ id: null, client_name: '', image_url: '', link: '', position: 'sidebar' }); fetchData(); }
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
    if (id) error = (await supabase.from('interviews').update(data).eq('id', id)).error;
    else error = (await supabase.from('interviews').insert([data])).error;
    if (error) alert('Error: ' + error.message);
    else { setNewInterview({ id: null, title: '', subtitle: '', band_name: '', content: '', image_url: '', is_active: true, author: '', photo_credit: '' }); fetchData(); }
  }

  async function deleteInterview(id: string) {
    if (confirm('¿Borrar entrevista?')) {
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

  if (loading) return <div className="min-h-screen bg-black text-red-600 flex items-center justify-center font-black text-4xl uppercase italic text-center font-black">Cargando Admin...</div>;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 md:p-6 font-sans relative text-left overflow-x-hidden font-black">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-4 border-red-600 pb-6 bg-zinc-950 p-4 sticky top-0 z-50 gap-4 font-black">
        <div>
           <h1 className="text-3xl md:text-4xl font-franklin text-red-600 leading-none">ADMINISTRADOR HQT</h1>
           <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1 italic font-black">Descubri recitales, toques y eventos musicales en tu Ciudad</p>
        </div>
        <div className="flex gap-4 font-black">
          <button onClick={() => router.push('/')} className="bg-white text-black px-4 py-1 font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-colors">Web</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="bg-red-600 px-4 py-1 font-black uppercase text-xs hover:bg-white hover:text-black transition-colors">Salir</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 font-black">
        {/* LADO IZQUIERDO: FECHAS */}
        <section className="space-y-6 text-left font-black">
          <h2 className="text-2xl font-black uppercase italic text-red-600 border-l-8 border-red-600 pl-4 bg-zinc-950 py-2 font-black">Gestión de Fechas</h2>
          
          {editingEvent && (
            <div className="border-4 border-blue-600 p-4 bg-zinc-950 space-y-4 mb-8 shadow-[10px_10px_0px_0px_rgba(37,99,235,1)] font-black rounded-[32px]">
              <h3 className="font-black uppercase text-blue-500">Editando: {editingEvent.band_name}</h3>
              <form onSubmit={handleSaveEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-white font-black">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] text-zinc-500">BANDA / ARTISTA</label>
                  <input value={editingEvent.band_name} onChange={e => setEditingEvent({...editingEvent, band_name: e.target.value})} className="w-full bg-black border-2 border-white p-2 uppercase font-black rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-black">FECHA</label>
                  <input type="date" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} className="w-full bg-black border-2 border-white p-2 rounded-xl font-black" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-black">HORA</label>
                  <input type="time" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} className="w-full bg-black border-2 border-white p-2 rounded-xl font-black" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-black">LUGAR / LOCAL</label>
                  <input value={editingEvent.venue} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} className="w-full bg-black border-2 border-white p-2 uppercase font-black rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-black">DIRECCION</label>
                  <input value={editingEvent.address || ''} onChange={e => setEditingEvent({...editingEvent, address: e.target.value})} className="w-full bg-black border-2 border-white p-2 uppercase font-black rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-black">DEPARTAMENTO</label>
                  <select value={editingEvent.department} onChange={e => setEditingEvent({...editingEvent, department: e.target.value})} className="w-full bg-black border-2 border-white p-2 uppercase font-black rounded-xl">
                    {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-black">CIUDAD</label>
                  <input value={editingEvent.city} onChange={e => setEditingEvent({...editingEvent, city: e.target.value})} className="w-full bg-black border-2 border-white p-2 uppercase font-black rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-black">GÉNERO</label>
                  <select value={editingEvent.genre} onChange={e => setEditingEvent({...editingEvent, genre: e.target.value})} className="w-full bg-black border-2 border-white p-2 uppercase font-black rounded-xl">
                    {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-black">EDAD</label>
                  <select value={editingEvent.age_rating} onChange={e => setEditingEvent({...editingEvent, age_rating: e.target.value})} className="w-full bg-black border-2 border-white p-2 uppercase font-black rounded-xl">
                    <option value="ATP">ATP</option>
                    <option value="+5">+5</option><option value="+7">+7</option><option value="+10">+10</option>
                    <option value="+12">+12</option><option value="+15">+15</option><option value="+18">+18</option>
                  </select>
                </div>

                <div className="md:col-span-2 border-t border-zinc-800 pt-4 grid grid-cols-2 gap-4 font-black font-black">
                  <div className="space-y-1 font-black">
                    <label className="text-[10px] text-zinc-500 uppercase font-black font-black">Tipo Entrada</label>
                    <select value={editingEvent.price_type} onChange={e => setEditingEvent({...editingEvent, price_type: e.target.value})} className="w-full bg-black border-2 border-white p-2 uppercase font-black rounded-xl">
                      <option value="range">PAGO (Entradas)</option>
                      <option value="free">ENTRADA LIBRE</option>
                      <option value="gorra">A LA GORRA</option>
                      <option value="sobre">SOBRE ARTÍSTICO</option>
                    </select>
                  </div>
                  {editingEvent.price_type === 'range' && (
                    <div className="grid grid-cols-2 gap-2 font-black font-black">
                      <div className="space-y-1 font-black">
                        <label className="text-[10px] text-zinc-500 uppercase font-black font-black">Precio Min $</label>
                        <input type="number" value={editingEvent.price_min || ''} onChange={e => setEditingEvent({...editingEvent, price_min: e.target.value})} className="w-full bg-black border-2 border-white p-2 font-black rounded-xl font-black" placeholder="Ej: 500" />
                      </div>
                      <div className="space-y-1 font-black">
                        <label className="text-[10px] text-zinc-500 uppercase font-black font-black">Precio Max $</label>
                        <input type="number" value={editingEvent.price_max || ''} onChange={e => setEditingEvent({...editingEvent, price_max: e.target.value})} className="w-full bg-black border-2 border-white p-2 font-black rounded-xl font-black" placeholder="Vacio = Unico" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 grid grid-cols-2 gap-4 font-black">
                  <div className="space-y-1 font-black">
                    <label className="text-[10px] text-zinc-500 uppercase font-black">Venta vía</label>
                    <select value={editingEvent.ticket_type} onChange={e => setEditingEvent({...editingEvent, ticket_type: e.target.value})} className="w-full bg-black border-2 border-white p-2 font-black rounded-xl font-black">
                      <option value="link">Link Web</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div className="space-y-1 font-black">
                    <label className="text-[10px] text-zinc-500 uppercase font-black">{editingEvent.ticket_type === 'whatsapp' ? 'Celular' : 'URL Link'}</label>
                    <input value={editingEvent.ticket_contact} onChange={e => setEditingEvent({...editingEvent, ticket_contact: e.target.value})} className="w-full bg-black border-2 border-white p-2 font-black rounded-xl font-black" placeholder="Ej: 099..." />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1 font-black">
                  <label className="text-[10px] text-zinc-500 uppercase font-black font-black">Bio / Reseña</label>
                  <textarea value={editingEvent.description || ''} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} className="w-full bg-black border-2 border-white p-2 font-black rounded-xl h-24 font-black" />
                </div>

                <div className="md:col-span-2 flex gap-4 pt-4 font-black">
                  <button type="submit" className="flex-1 bg-blue-600 py-3 font-black border-2 border-white rounded-full text-white font-black">GUARDAR CAMBIOS</button>
                  <button type="button" onClick={() => setEditingEvent(null)} className="bg-zinc-700 px-6 font-black border-2 border-white rounded-full text-white font-black">X</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4 font-black">
            {events.map((event) => (
              <div key={event.id} className={`border-4 p-4 flex flex-col gap-4 ${!event.is_approved ? 'border-red-600 bg-zinc-900 animate-pulse shadow-lg' : event.is_featured ? 'border-red-600 bg-zinc-950/80 shadow-md' : 'border-zinc-700 bg-zinc-950/80'} rounded-[32px]`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                  <div className="flex gap-4 items-center font-black">
                    {event.flyer_url && <img src={event.flyer_url} className="w-16 h-16 object-cover border-2 border-white shadow-md rounded-xl font-black" />}
                    <div className="text-left font-black">
                      <h3 className="text-xl font-black uppercase leading-none font-black">{event.band_name}</h3>
                      <p className="text-[10px] font-bold text-red-600 uppercase font-black">{event.date} - {event.time.substring(0,5)}hs</p>
                      <p className="text-[10px] text-zinc-400 uppercase font-black">{event.venue} - {event.address || 'Sin Dirección'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto font-black font-black">
                    <button onClick={() => setEditingEvent(event)} className="bg-blue-600 text-white px-3 py-1 font-black uppercase text-[10px] border-2 border-white shadow-sm rounded-full font-black">EDITAR</button>
                    <button onClick={() => supabase.from('events').update({ is_approved: !event.is_approved }).eq('id', event.id).then(() => fetchData())} className={`flex-1 md:flex-none px-3 py-1 font-black uppercase text-[10px] border-2 border-white shadow-sm rounded-full font-black ${event.is_approved ? 'bg-zinc-800 text-zinc-400' : 'bg-green-600 text-white font-black'}`}>{event.is_approved ? 'BAJAR' : 'APROBAR'}</button>
                    <button onClick={() => deleteEvent(event.id)} className="bg-red-600 text-white px-3 py-1 font-black text-[10px] border-2 border-white shadow-sm rounded-full font-black">BORRAR</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DERECHO: PUBLICIDAD, ENTREVISTAS, MENSAJES */}
        <section className="space-y-12">
          <div className="space-y-6 text-left font-black">
            <h2 className="text-2xl font-black uppercase italic text-red-600 border-l-8 border-red-600 pl-4 bg-zinc-950 py-2 font-black font-black">Publicidad</h2>
            <form onSubmit={handleSaveSponsor} className="bg-zinc-950 p-4 md:p-6 border-4 border-white space-y-4 shadow-xl rounded-[32px] font-black font-black">
              <span className="text-[10px] font-black uppercase text-zinc-500 font-black">{newSponsor.id ? 'EDITANDO' : 'NUEVO ANUNCIO'}</span>
              <input placeholder="Nombre Cliente" className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-xs text-white outline-none focus:border-red-600 rounded-xl" value={newSponsor.client_name} onChange={e => setNewSponsor({...newSponsor, client_name: e.target.value})} required />
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative rounded-xl font-black font-black">
                <p className="text-[10px] font-black uppercase text-zinc-500 flex-1 font-black">{uploading ? 'Cargando...' : (newSponsor.image_url ? 'Imagen OK ✅' : 'Subir Imagen/GIF')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer font-black" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'sponsors'); if (url) setNewSponsor({...newSponsor, image_url: url}); }
                }} />
                {newSponsor.image_url && <img src={newSponsor.image_url} className="h-10 w-10 object-cover border rounded-lg font-black" />}
              </div>
              <div className="grid grid-cols-2 gap-2 text-white font-black">
                <input placeholder="Link" className="bg-black border-2 border-white p-2 text-xs rounded-xl font-black" value={newSponsor.link} onChange={e => setNewSponsor({...newSponsor, link: e.target.value})} />
                <select className="bg-black border-2 border-white p-2 text-xs uppercase rounded-xl font-black" value={newSponsor.position} onChange={e => setNewSponsor({...newSponsor, position: e.target.value})}>
                  <option value="top">SUPERIOR</option>
                  <option value="sidebar">LATERAL</option>
                  <option value="bottom">INFERIOR</option>
                </select>
              </div>
              <div className="flex gap-2 font-black">
                <button type="submit" disabled={uploading} className={`flex-1 font-black uppercase py-3 text-sm border-2 border-white rounded-full font-black ${newSponsor.id ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>{newSponsor.id ? 'ACTUALIZAR' : 'GUARDAR'}</button>
                {newSponsor.id && <button type="button" onClick={() => setNewSponsor({id:null, client_name:'', image_url:'', link:'', position:'sidebar'})} className="bg-zinc-700 px-6 font-black border-2 border-white text-white rounded-full font-black">X</button>}
              </div>
            </form>
          </div>

          {/* Entrevistas */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-8 text-left font-black">
            <h2 className="text-2xl font-black uppercase italic text-red-600 border-l-8 border-red-600 pl-4 bg-zinc-950 py-2 font-black font-black">Entrevistas</h2>
            <form onSubmit={handleSaveInterview} className="bg-zinc-950 p-4 md:p-6 border-4 border-white space-y-4 shadow-xl rounded-[32px] font-black">
              <input placeholder="Título" className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-xs text-white focus:border-red-600 outline-none rounded-xl" value={newInterview.title} onChange={e => setNewInterview({...newInterview, title: e.target.value})} required />
              <input placeholder="Subtítulo / Copete" className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-xs text-white focus:border-red-600 outline-none rounded-xl" value={newInterview.subtitle || ''} onChange={e => setNewInterview({...newInterview, subtitle: e.target.value})} />
              <input placeholder="Banda" className="w-full bg-black border-2 border-white p-3 font-bold uppercase text-xs text-white focus:border-red-600 outline-none rounded-xl" value={newInterview.band_name} onChange={e => setNewInterview({...newInterview, band_name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-2 text-[10px] text-white font-black">
                <input placeholder="Autor Texto" className="bg-black border-2 border-white p-2 uppercase font-black rounded-xl" value={newInterview.author} onChange={e => setNewInterview({...newInterview, author: e.target.value})} />
                <input placeholder="Crédito Foto" className="bg-black border-2 border-white p-2 uppercase font-black rounded-xl" value={newInterview.photo_credit} onChange={e => setNewInterview({...newInterview, photo_credit: e.target.value})} />
              </div>
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative rounded-xl font-black font-black">
                <p className="text-[10px] font-black uppercase text-zinc-500 flex-1 font-black">{uploading ? 'Cargando...' : (newInterview.image_url ? 'Imagen OK ✅' : 'Subir Foto')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer font-black" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'interviews'); if (url) setNewInterview({...newInterview, image_url: url}); }
                }} />
                {newInterview.image_url && <img src={newInterview.image_url} className="h-10 w-10 object-cover border rounded-lg font-black" />}
              </div>
              <textarea placeholder="Contenido..." className="w-full bg-black border-2 border-white p-3 text-xs text-white h-32 rounded-xl" value={newInterview.content} onChange={e => setNewInterview({...newInterview, content: e.target.value})} required />
              <div className="flex gap-2 font-black">
                <button type="submit" disabled={uploading} className={`flex-1 font-black uppercase py-3 text-sm border-2 border-white rounded-full font-black ${newInterview.id ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>{newInterview.id ? 'ACTUALIZAR' : 'PUBLICAR'}</button>
                {newInterview.id && <button type="button" onClick={() => setNewInterview({id:null, title:'', subtitle:'', band_name:'', content:'', image_url:'', is_active:true, author:'', photo_credit:''})} className="bg-zinc-700 px-6 font-black border-2 border-white text-white rounded-full font-black">X</button>}
              </div>
            </form>
          </div>
        </section>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; }
      `}</style>
    </div>
  );
}
