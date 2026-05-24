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
  const [newInterview, setNewInterview] = useState<any>({ id: null, title: '', subtitle: '', band_name: '', content: '', image_url: '', is_active: true, author: '', photo_credit: '', image_position: 'center' });
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
    const { error } = await supabase.from('events').update(data).eq('id', id);
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
    if (confirm('¿Borrar definitivamente?')) {
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
    const temp: any = { ...newInterview };
    const { id, created_at, published_at, ...data } = temp;
    
    const finalData = {
        title: data.title, subtitle: data.subtitle, band_name: data.band_name,
        content: data.content, image_url: data.image_url, is_active: data.is_active,
        author: data.author, photo_credit: data.photo_credit, image_position: data.image_position
    };

    let error;
    if (id) error = (await supabase.from('interviews').update(finalData).eq('id', id)).error;
    else error = (await supabase.from('interviews').insert([finalData])).error;
    
    if (error) alert('Error al guardar: ' + error.message);
    else { 
        alert('¡Guardado con éxito!');
        setNewInterview({ id: null, title: '', subtitle: '', band_name: '', content: '', image_url: '', is_active: true, author: '', photo_credit: '', image_position: 'center' }); 
        fetchData(); 
    }
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
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-4 border-red-600 pb-6 bg-zinc-950 p-4 sticky top-0 z-50 gap-4 font-black font-black">
        <div>
           <h1 className="text-3xl md:text-4xl font-black uppercase italic text-red-600 leading-none">ADMINISTRADOR HQT</h1>
           <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1 italic font-black font-black">Gestión de Hoy Quien Toca</p>
        </div>
        <div className="flex gap-4 font-black">
          <button onClick={() => router.push('/')} className="bg-white text-black px-4 py-1 font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-colors rounded-full border-2 border-white font-black font-black">Web</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="bg-red-600 px-4 py-1 font-black uppercase text-xs hover:bg-white hover:text-black transition-colors font-black rounded-full border-2 border-white font-black">Salir</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 font-black">
        {/* LADO IZQUIERDO: FECHAS */}
        <section className="space-y-6 text-left font-black font-black">
          <div className="flex justify-between items-center bg-zinc-950 p-4 border-l-8 border-red-600 rounded-r-2xl font-black font-black">
             <h2 className="text-2xl font-black uppercase italic text-red-600 font-franklin">Fechas</h2>
             <button onClick={() => setEditingEvent({ id: 'new', band_name: '', venue: '', address: '', city: '', department: 'MONTEVIDEO', date: '', time: '21:00', age_rating: 'ATP', description: '', is_approved: false, price_type: 'free', genre: 'ROCK' })} className="bg-red-600 text-white px-6 py-2 text-[10px] font-black uppercase rounded-full hover:bg-white hover:text-black transition-all shadow-lg font-black">+ NUEVA FECHA</button>
          </div>
          
          {editingEvent && (
            <div className="border-4 border-blue-600 p-4 bg-zinc-950 space-y-4 mb-8 shadow-lg rounded-3xl font-black font-black">
              <h3 className="font-black uppercase text-blue-500 font-franklin">{editingEvent.id === 'new' ? 'NUEVA FECHA' : 'EDITANDO'}</h3>
              <form onSubmit={handleSaveEvent} className="grid grid-cols-2 gap-3 text-xs text-white font-black font-black">
                <input value={editingEvent.band_name} onChange={e => setEditingEvent({...editingEvent, band_name: e.target.value})} className="col-span-2 bg-black border-2 border-white p-2 uppercase font-bold rounded-lg" placeholder="Banda" />
                <input value={editingEvent.venue || ''} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} className="bg-black border-2 border-white p-2 uppercase rounded-lg" placeholder="Lugar" />
                <input value={editingEvent.address || ''} onChange={e => setEditingEvent({...editingEvent, address: e.target.value})} className="bg-black border-2 border-white p-2 uppercase rounded-lg" placeholder="Dirección" />
                <input value={editingEvent.city || ''} onChange={e => setEditingEvent({...editingEvent, city: e.target.value})} className="bg-black border-2 border-white p-2 uppercase rounded-lg" placeholder="Ciudad" />
                
                <select value={editingEvent.department} onChange={e => setEditingEvent({...editingEvent, department: e.target.value})} className="bg-black border-2 border-white p-2 uppercase rounded-lg font-black font-black">
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={editingEvent.genre} onChange={e => setEditingEvent({...editingEvent, genre: e.target.value})} className="bg-black border-2 border-white p-2 uppercase rounded-lg font-black font-black">
                  {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>

                <input type="date" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg" />
                <input type="time" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg" />
                
                <select value={editingEvent.price_type} onChange={e => setEditingEvent({...editingEvent, price_type: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg font-black uppercase font-black">
                   <option value="free">LIBRE</option><option value="range">PAGO</option><option value="gorra">GORRA</option><option value="sobre">SOBRE</option>
                </select>
                <input value={editingEvent.price_min || ''} onChange={e => setEditingEvent({...editingEvent, price_min: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg" placeholder="Precio $" />

                <textarea value={editingEvent.description || ''} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} className="col-span-2 bg-black border-2 border-white p-2 uppercase rounded-lg h-20" placeholder="Reseña" />

                <div className="col-span-2 flex gap-2 font-black font-black">
                  <button type="submit" className="flex-1 bg-blue-600 py-3 font-black border-2 border-white rounded-full uppercase shadow-lg font-black font-black">GUARDAR</button>
                  <button type="button" onClick={() => setEditingEvent(null)} className="bg-zinc-700 px-6 font-black border-2 border-white rounded-full font-black font-black">X</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4 font-black">
            {events.map((event) => (
              <div key={event.id} className={`border-4 p-4 flex flex-col gap-4 ${!event.is_approved ? 'border-red-600 bg-zinc-900 animate-pulse shadow-lg' : event.is_featured ? 'border-red-600 bg-zinc-950/80 shadow-md' : 'border-zinc-700 bg-zinc-950/80'} rounded-[32px] font-black`}>
                <div className="flex justify-between items-center font-black">
                  <div className="flex gap-4 items-center font-black">
                    {event.flyer_url && <img src={event.flyer_url} className="w-16 h-16 object-cover border-2 border-white rounded-xl shadow-md font-black" />}
                    <div className="font-black">
                      <h3 className="text-xl font-black uppercase leading-none font-black">{event.band_name}</h3>
                      <p className="text-[10px] font-bold text-red-600 uppercase font-black font-black">{event.date} - {event.time?.substring(0,5)}hs</p>
                      <p className="text-[10px] text-zinc-400 uppercase font-black font-black">{event.venue} - {event.address || 'Sin Dirección'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto font-black font-black">
                    <button onClick={() => setEditingEvent(event)} className="bg-blue-600 text-white px-3 py-1 font-black uppercase text-[10px] border-2 border-white shadow-sm rounded-full font-black">EDITAR</button>
                    <button onClick={() => supabase.from('events').update({ is_approved: !event.is_approved }).eq('id', event.id).then(() => fetchData())} className={`flex-1 md:flex-none px-3 py-1 font-black uppercase text-[10px] border-2 border-white shadow-sm rounded-full font-black ${event.is_approved ? 'bg-zinc-800 text-zinc-400' : 'bg-green-600 text-white'}`}>{event.is_approved ? 'BAJAR' : 'APROBAR'}</button>
                    <button onClick={() => deleteEvent(event.id)} className="bg-red-600 text-white px-3 py-1 font-black text-[10px] border-2 border-white shadow-sm rounded-full font-black font-black">BORRAR</button>
                  </div>
                </div>

                {event.is_approved && (
                  <div className="space-y-3 border-t border-zinc-800 pt-3 font-black">
                    <button onClick={() => toggleFeatured(event.id, event.is_featured)} className={`w-full py-1 font-black uppercase text-[10px] border-2 transition-all rounded-full font-black ${event.is_featured ? 'bg-red-600 text-white border-white shadow-md' : 'bg-black text-red-600 border-red-600'}`}>
                      {event.is_featured ? '★ EN BANNER (DESACTIVAR)' : '★ PONER EN BANNER'}
                    </button>
                    <div className="flex flex-wrap gap-2 items-center font-black">
                      <button onClick={() => toggleSoldOut(event.id, event.is_sold_out)} className={`px-2 py-0.5 text-[8px] font-black border-2 rounded-full ${event.is_sold_out ? 'bg-red-600 text-white shadow-md' : 'border-red-600 text-red-600'}`}>AGOTADO</button>
                      <button onClick={() => toggleSuspended(event.id, event.is_suspended)} className={`px-2 py-0.5 text-[8px] font-black border-2 rounded-full ${event.is_suspended ? 'bg-zinc-100 text-black shadow-md' : 'border-zinc-500 text-zinc-500'}`}>SUSPENDIDO</button>
                      <div className="h-4 w-[1px] bg-zinc-800 mx-1" />
                      <button onClick={() => updateEventTag(event.id, 'PLANAZO')} className={`px-2 py-1 text-[8px] font-black border-2 rounded-full ${event.suggestion_tag === 'PLANAZO' ? 'bg-red-600 border-white text-white shadow-sm font-black' : 'border-red-600 text-red-600 font-black'} font-black`}>PLANAZO</button>
                      <button onClick={() => updateEventTag(event.id, 'SALIDA SEGURA')} className={`px-2 py-1 text-[8px] font-black border-2 rounded-full ${event.suggestion_tag === 'SALIDA SEGURA' ? 'bg-green-600 border-white text-white shadow-sm' : 'border-green-600 text-green-600'} font-black`}>SEGURA</button>
                      <button onClick={() => updateEventTag(event.id, 'NO FALLA')} className={`px-2 py-1 text-[8px] font-black border-2 rounded-full ${event.suggestion_tag === 'NO FALLA' ? 'bg-white border-black text-black shadow-sm' : 'border-white text-white'} font-black`}>NO FALLA</button>
                      <button onClick={() => updateEventTag(event.id, '')} className="text-[8px] font-black uppercase text-red-600 underline ml-auto italic font-black">X TAG</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* LADO DERECHO: PUBLICIDAD, ENTREVISTAS, MENSAJES */}
        <section className="space-y-12 font-black">
          {/* Publicidad */}
          <div className="space-y-6 text-left font-black">
            <h2 className="text-2xl font-black uppercase italic text-red-600 border-l-8 border-red-600 pl-4 bg-zinc-950 py-2 font-franklin">Publicidad</h2>
            <form onSubmit={handleSaveSponsor} className="bg-zinc-950 p-4 border-4 border-white space-y-4 shadow-xl rounded-[32px] font-black font-black">
              <input placeholder="Nombre Cliente" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white outline-none focus:border-red-600 rounded-xl" value={newSponsor.client_name} onChange={e => setNewSponsor({...newSponsor, client_name: e.target.value})} required />
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative rounded-xl font-black font-black">
                <p className="text-[10px] font-black uppercase text-zinc-500 flex-1">{uploading ? 'Cargando...' : (newSponsor.image_url ? 'Imagen OK ✅' : 'Subir Imagen/GIF')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer font-black font-black" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'sponsors'); if (url) setNewSponsor({...newSponsor, image_url: url}); }
                }} />
                {newSponsor.image_url && <img src={newSponsor.image_url} className="h-10 w-10 object-cover border rounded-lg font-black" />}
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-red-600 text-white font-black uppercase py-2 text-xs border-2 border-white rounded-full font-black">GUARDAR</button>
            </form>
          </div>

          {/* Entrevistas */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-8 text-left font-black font-black">
            <h2 className="text-2xl font-black uppercase italic text-red-600 border-l-8 border-red-600 pl-4 bg-zinc-950 py-2 font-franklin">Entrevistas</h2>
            <form onSubmit={handleSaveInterview} className="bg-zinc-950 p-4 border-4 border-white space-y-4 shadow-xl rounded-[32px] font-black">
              <input placeholder="Título" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white focus:border-red-600 outline-none rounded-xl" value={newInterview.title} onChange={e => setNewInterview({...newInterview, title: e.target.value})} required />
              <input placeholder="Banda" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white focus:border-red-600 outline-none rounded-xl" value={newInterview.band_name} onChange={e => setNewInterview({...newInterview, band_name: e.target.value})} required />
              <textarea placeholder="Contenido..." className="w-full bg-black border-2 border-white p-2 text-xs text-white h-24 rounded-xl font-black font-black" value={newInterview.content} onChange={e => setNewInterview({...newInterview, content: e.target.value})} required />
              <div className="flex gap-2 font-black">
                <button type="submit" disabled={uploading} className="flex-1 bg-red-600 text-white font-black uppercase py-2 text-sm border-2 border-white rounded-full font-black">PUBLICAR</button>
                {newInterview.id && <button type="button" onClick={() => setNewInterview({id:null, title:'', subtitle:'', band_name:'', content:'', image_url:'', is_active:true, author:'', photo_credit:'', image_position: 'center'})} className="bg-zinc-700 px-4 font-black border-2 border-white text-white rounded-full font-black font-black">X</button>}
              </div>
            </form>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar font-black font-black font-black">
              {interviews.map(int => (
                <div key={int.id} className={`border-2 p-3 flex justify-between items-center ${int.is_active ? 'border-red-600 bg-zinc-900 shadow-md' : 'border-zinc-800 bg-zinc-950 opacity-40 grayscale italic'} rounded-2xl font-black`}>
                  <div className="truncate pr-4 text-left font-black">
                    <span className="text-[10px] font-black uppercase text-red-600 font-black">{int.title}</span>
                    <p className="text-[8px] text-zinc-500 uppercase font-bold font-black">{int.band_name} {int.is_active ? '' : '(PAUSADA)'}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 font-black font-black">
                    <button onClick={() => setNewInterview(int)} className="px-2 py-0.5 bg-blue-600 text-white text-[7px] font-black border border-white rounded-full font-black">EDITAR</button>
                    <button onClick={() => toggleInterviewStatus(int.id, int.is_active)} className={`px-2 py-0.5 text-white text-[7px] font-black border border-white rounded-full ${int.is_active ? 'bg-green-600' : 'bg-zinc-700 font-black'}`}>{int.is_active ? 'PAUSA' : 'ACTIVO'}</button>
                    <button onClick={() => deleteInterview(int.id)} className="px-2 py-0.5 bg-red-600 text-white text-[7px] font-black border border-white rounded-full font-black">BORRAR</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mensajes */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-8 text-left text-white font-black">
            <h2 className="text-2xl font-black uppercase italic text-red-600 border-l-8 border-red-600 pl-4 bg-zinc-950 py-2 font-black font-franklin font-black font-black">Mensajes</h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar font-black font-black">
              {messages.map((msg) => (
                <div key={msg.id} className={`border-2 p-3 flex justify-between items-center ${msg.is_read ? 'border-zinc-800 bg-zinc-950/50 opacity-60' : 'border-white bg-zinc-900'} rounded-2xl font-black`}>
                  <div onClick={() => setSelectedMessage(msg)} className="cursor-pointer flex-1 font-black">
                    <h3 className="font-black uppercase text-[10px] text-red-600 font-black">{msg.name}</h3>
                    <p className="text-[9px] text-zinc-300 truncate max-w-[150px] font-black">"{msg.message}"</p>
                  </div>
                  <button onClick={() => deleteMessage(msg.id)} className="text-[7px] bg-red-600 text-white px-2 py-0.5 border border-white rounded-full font-black font-black">BORRAR</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-black">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm font-black" onClick={() => setSelectedMessage(null)} />
          <div className="relative w-full max-w-xl bg-zinc-900 border-8 border-white p-8 shadow-2xl rounded-[50px] font-black text-left font-black">
            <button onClick={() => setSelectedMessage(null)} className="absolute -top-4 -right-4 bg-red-600 text-white w-10 h-10 font-black text-xl border-4 border-white rounded-full shadow-xl font-black">X</button>
            <h3 className="text-2xl font-black uppercase text-red-600 mb-2 font-black">{selectedMessage.name}</h3>
            <p className="text-lg text-white font-black font-black">"{selectedMessage.message}"</p>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; border-radius: 10px; }
      `}</style>
    </div>
  );
}
