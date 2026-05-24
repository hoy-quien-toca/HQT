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

    if (id === 'new') {
       const { error } = await supabase.from('events').insert([data]);
       if (error) alert('Error al crear: ' + error.message);
       else { setEditingEvent(null); fetchData(); }
    } else {
       const { error } = await supabase.from('events').update(data).eq('id', id);
       if (error) alert('Error: ' + error.message);
       else { setEditingEvent(null); fetchData(); }
    }
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
    
    // Type casting and cleaning for safety
    const temp: any = { ...newInterview };
    const { id, created_at, published_at, ...data } = temp;
    
    // ENSURE WE ONLY SEND VALID COLUMNS
    const finalData = {
        title: data.title,
        subtitle: data.subtitle,
        band_name: data.band_name,
        content: data.content,
        image_url: data.image_url,
        is_active: data.is_active,
        author: data.author,
        photo_credit: data.photo_credit,
        image_position: data.image_position
    };

    let error;
    if (id) error = (await supabase.from('interviews').update(finalData).eq('id', id)).error;
    else error = (await supabase.from('interviews').insert([finalData])).error;
    
    if (error) {
        alert('Error al guardar entrevista: ' + error.message);
    } else { 
        alert('¡Entrevista guardada con éxito!');
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
    if (error) {
        alert('Error al pausar/activar: ' + error.message);
    } else {
        fetchData();
    }
  }

  // --- MESSAGES ---
  async function deleteMessage(id: string) {
    if (confirm('¿Borrar mensaje?')) {
      await supabase.from('contact_messages').delete().eq('id', id);
      fetchData();
      setSelectedMessage(null);
    }
  }

  if (loading) return <div className="min-h-screen bg-black text-red-600 flex items-center justify-center font-black text-4xl uppercase italic text-center">Cargando Admin...</div>;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 md:p-6 font-sans relative text-left overflow-x-hidden font-black">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-4 border-red-600 pb-6 bg-zinc-950 p-4 sticky top-0 z-50 gap-4 font-black">
        <div>
           <h1 className="text-3xl md:text-4xl font-black uppercase italic text-red-600 leading-none font-franklin">ADMINISTRADOR HQT</h1>
           <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1 italic font-black">Descubri recitales en tu Ciudad</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="bg-white text-black px-4 py-1 font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-colors rounded-full border-2 border-white font-black font-black">Web</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="bg-red-600 px-4 py-1 font-black uppercase text-xs hover:bg-white hover:text-black transition-colors font-black rounded-full border-2 border-white font-black">Salir</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 font-black">
        {/* LADO IZQUIERDO: FECHAS (TAMAÑO NORMAL) */}
        <section className="space-y-6 text-left font-black">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-950 p-4 border-l-8 border-red-600 rounded-r-2xl font-black">
             <h2 className="text-2xl font-black uppercase italic text-red-600 font-franklin">Gestión de Fechas</h2>
             <button 
                onClick={() => setEditingEvent({ id: 'new', band_name: '', venue: '', address: '', date: '', time: '21:00', age_rating: 'ATP', description: '', is_approved: false })}
                className="bg-red-600 text-white px-6 py-2 text-[10px] font-black uppercase rounded-full hover:bg-white hover:text-black transition-all shadow-lg font-black font-black"
             >
                + NUEVA FECHA
             </button>
          </div>
          
          {editingEvent && (
            <div className="border-4 border-blue-600 p-4 bg-zinc-950 space-y-4 mb-8 shadow-[10px_10px_0px_0px_rgba(37,99,235,1)] rounded-3xl font-black font-black">
              <h3 className="font-black uppercase text-blue-500 font-franklin">{editingEvent.id === 'new' ? 'NUEVA FECHA' : `Editando: ${editingEvent.band_name}`}</h3>
              <form onSubmit={handleSaveEvent} className="grid grid-cols-2 gap-2 text-xs text-white font-black">
                <input value={editingEvent.band_name} onChange={e => setEditingEvent({...editingEvent, band_name: e.target.value})} className="col-span-2 bg-black border-2 border-white p-2 uppercase font-bold rounded-xl" />
                <input value={editingEvent.address || ''} onChange={e => setEditingEvent({...editingEvent, address: e.target.value})} className="col-span-2 bg-black border-2 border-white p-2 uppercase rounded-xl" placeholder="Dirección" />
                <input type="date" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} className="bg-black border-2 border-white p-2 rounded-xl font-black" />
                <input type="time" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} className="bg-black border-2 border-white p-2 rounded-xl font-black" />
                <select value={editingEvent.age_rating} onChange={e => setEditingEvent({...editingEvent, age_rating: e.target.value})} className="bg-black border-2 border-white p-2 rounded-xl font-black font-black">
                   <option value="ATP">ATP</option>
                   <option value="+5">+5</option><option value="+7">+7</option><option value="+10">+10</option>
                   <option value="+12">+12</option><option value="+15">+15</option><option value="+18">+18</option>
                </select>
                <div className="col-span-2 flex gap-2 pt-2 font-black font-black">
                  <button type="submit" className="flex-1 bg-blue-600 py-2 font-black border-2 border-white rounded-full">ACTUALIZAR</button>
                  <button type="button" onClick={() => setEditingEvent(null)} className="bg-zinc-700 px-4 font-black rounded-full">X</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4 font-black">
            {events.map((event) => (
              <div key={event.id} className={`border-4 p-4 flex flex-col gap-4 ${!event.is_approved ? 'border-red-600 bg-zinc-900 animate-pulse shadow-lg' : event.is_featured ? 'border-red-600 bg-zinc-950/80 shadow-md' : 'border-zinc-700 bg-zinc-950/80'} rounded-[32px]`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left font-black">
                  <div className="flex gap-4 items-center">
                    {event.flyer_url && <img src={event.flyer_url} className="w-16 h-16 object-cover border-2 border-white shadow-md rounded-xl" />}
                    <div>
                      <h3 className="text-xl font-black uppercase leading-none">{event.band_name}</h3>
                      <p className="text-[10px] font-bold text-red-600 uppercase font-black">{event.date} - {event.time.substring(0,5)}hs</p>
                      <p className="text-[10px] text-zinc-400 uppercase font-black">{event.venue} - {event.address || 'Sin Dirección'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto font-black font-black">
                    <button onClick={() => setEditingEvent(event)} className="bg-blue-600 text-white px-3 py-1 font-black uppercase text-[10px] border-2 border-white shadow-sm rounded-full font-black">EDITAR</button>
                    <button onClick={() => supabase.from('events').update({ is_approved: !event.is_approved }).eq('id', event.id).then(() => fetchData())} className={`flex-1 md:flex-none px-3 py-1 font-black uppercase text-[10px] border-2 border-white shadow-sm rounded-full font-black ${event.is_approved ? 'bg-zinc-800 text-zinc-400' : 'bg-green-600 text-white font-black font-black'}`}>{event.is_approved ? 'BAJAR' : 'APROBAR'}</button>
                    <button onClick={() => deleteEvent(event.id)} className="bg-red-600 text-white px-3 py-1 font-black text-[10px] border-2 border-white shadow-sm rounded-full font-black">BORRAR</button>
                  </div>
                </div>

                {event.is_approved && (
                  <div className="space-y-3 border-t border-zinc-800 pt-3 font-black">
                    <button 
                      onClick={() => toggleFeatured(event.id, event.is_featured)} 
                      className={`w-full py-1 font-black uppercase text-[10px] border-2 transition-all rounded-full font-black ${event.is_featured ? 'bg-red-600 text-white border-white shadow-md font-black' : 'bg-black text-red-600 border-red-600 font-black'}`}
                    >
                      {event.is_featured ? '★ EN BANNER PRINCIPAL (DESACTIVAR)' : '★ PONER EN BANNER PRINCIPAL'}
                    </button>
                    <div className="flex flex-wrap gap-2 items-center font-black">
                      <button onClick={() => updateEventTag(event.id, 'PLANAZO')} className={`px-2 py-1 text-[8px] font-black border-2 rounded-full font-black ${event.suggestion_tag === 'PLANAZO' ? 'bg-red-600 border-white text-white shadow-md' : 'border-red-600 text-red-600'}`}>PLANAZO</button>
                      <button onClick={() => updateEventTag(event.id, 'SALIDA SEGURA')} className={`px-2 py-1 text-[8px] font-black border-2 rounded-full font-black ${event.suggestion_tag === 'SALIDA SEGURA' ? 'bg-green-600 border-white text-white shadow-md' : 'border-green-600 text-green-600 font-black'}`}>SALIDA SEGURA</button>
                      <button onClick={() => updateEventTag(event.id, 'NO FALLA')} className={`px-2 py-1 text-[8px] font-black border-2 rounded-full font-black ${event.suggestion_tag === 'NO FALLA' ? 'bg-white border-black text-black shadow-md' : 'border-white text-white font-black'}`}>NO FALLA</button>
                      <button onClick={() => updateEventTag(event.id, '')} className="text-[8px] font-black uppercase text-red-600 underline ml-auto italic font-black font-black">QUITAR TAG</button>
                    </div>
                    
                    <div className="flex gap-2">
                       <button onClick={() => toggleSoldOut(event.id, event.is_sold_out)} className={`flex-1 py-1 text-[9px] font-black uppercase border-2 rounded-full font-black ${event.is_sold_out ? 'bg-red-600 border-white text-white shadow-lg animate-pulse' : 'border-zinc-700 text-zinc-500'}`}>{event.is_sold_out ? 'AGOTADO' : 'MARCAR AGOTADO'}</button>
                       <button onClick={() => toggleSuspended(event.id, event.is_suspended)} className={`flex-1 py-1 text-[9px] font-black uppercase border-2 rounded-full font-black ${event.is_suspended ? 'bg-white text-black border-black shadow-lg animate-pulse' : 'border-zinc-700 text-zinc-500 font-black'}`}>{event.is_suspended ? 'ACTIVAR' : 'SUSPENDER'}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* LADO DERECHO: ENTREVISTAS (AGRANDADO) Y OTROS */}
        <section className="space-y-12 font-black">
          {/* Entrevistas - ESTA ES LA PARTE QUE QUIERES MÁS GRANDE */}
          <div className="space-y-8 border-t-8 border-red-600 pt-10 text-left font-black">
            <h2 className="text-4xl font-black uppercase italic text-red-600 border-l-8 border-red-600 pl-6 bg-zinc-950 py-4 font-franklin rounded-r-3xl">Entrevistas (Editor)</h2>
            <form onSubmit={handleSaveInterview} className="bg-zinc-950 p-6 md:p-10 border-4 border-white space-y-6 shadow-2xl rounded-[50px] font-black">
              <input placeholder="TÍTULO GIGANTE" className="w-full bg-black border-4 border-white p-4 font-black uppercase text-xl text-white focus:border-red-600 outline-none rounded-3xl" value={newInterview.title} onChange={e => setNewInterview({...newInterview, title: e.target.value})} required />
              <input placeholder="Subtítulo / Copete (Largo)" className="w-full bg-black border-4 border-white p-4 font-bold uppercase text-lg text-white focus:border-red-600 outline-none rounded-3xl" value={newInterview.subtitle || ''} onChange={e => setNewInterview({...newInterview, subtitle: e.target.value})} />
              <input placeholder="BANDA / ARTISTA" className="w-full bg-black border-4 border-white p-4 font-black uppercase text-xl text-white focus:border-red-600 outline-none rounded-3xl" value={newInterview.band_name} onChange={e => setNewInterview({...newInterview, band_name: e.target.value})} required />
              
              <div className="space-y-2 font-black">
                <label className="text-sm text-zinc-500 uppercase font-black">Encruadre de Foto (Miniatura)</label>
                <select value={newInterview.image_position} onChange={e => setNewInterview({...newInterview, image_position: e.target.value})} className="w-full bg-black border-4 border-white p-4 text-lg uppercase font-black text-white rounded-3xl">
                   <option value="center">Centrado</option>
                   <option value="top">Arriba</option>
                   <option value="bottom">Abajo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 text-white font-black">
                <input placeholder="AUTOR TEXTO" className="bg-black border-4 border-white p-4 uppercase font-black rounded-3xl text-lg" value={newInterview.author} onChange={e => setNewInterview({...newInterview, author: e.target.value})} />
                <input placeholder="CRÉDITO FOTO" className="bg-black border-4 border-white p-4 uppercase font-black rounded-3xl text-lg" value={newInterview.photo_credit} onChange={e => setNewInterview({...newInterview, photo_credit: e.target.value})} />
              </div>
              
              <div className="flex gap-6 items-center border-4 border-dashed border-zinc-700 p-6 relative rounded-3xl font-black">
                <p className="text-lg font-black uppercase text-zinc-500 flex-1">{uploading ? 'CARGANDO...' : (newInterview.image_url ? 'FOTO CARGADA ✅' : 'SUBIR FOTO PRINCIPAL')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer font-black" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'interviews'); if (url) setNewInterview({...newInterview, image_url: url}); }
                }} />
                {newInterview.image_url && <img src={newInterview.image_url} className="h-24 w-24 object-cover border-4 border-white rounded-2xl shadow-lg" />}
              </div>
              
              <textarea placeholder="CONTENIDO DE LA ENTREVISTA..." className="w-full bg-black border-4 border-white p-6 text-xl text-white h-64 rounded-[40px] font-black" value={newInterview.content} onChange={e => setNewInterview({...newInterview, content: e.target.value})} required />
              
              <div className="flex gap-4 font-black">
                <button type="submit" disabled={uploading} className={`flex-1 font-black uppercase py-6 text-2xl border-4 border-white rounded-full shadow-xl transition-all ${newInterview.id ? 'bg-blue-600 text-white' : 'bg-red-600 text-white hover:bg-white hover:text-black'}`}>{newInterview.id ? 'ACTUALIZAR' : 'PUBLICAR ENTREVISTA'}</button>
                {newInterview.id && <button type="button" onClick={() => setNewInterview({id:null, title:'', subtitle:'', band_name:'', content:'', image_url:'', is_active:true, author:'', photo_credit:'', image_position: 'center'})} className="bg-zinc-700 px-12 font-black border-4 border-white text-white rounded-full text-2xl font-black">X</button>}
              </div>
            </form>

            <div className="grid grid-cols-1 gap-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar font-black">
              {interviews.map(int => (
                <div key={int.id} className={`border-4 p-6 flex justify-between items-center shadow-xl transition-all ${int.is_active ? 'border-red-600 bg-zinc-900' : 'border-zinc-800 bg-zinc-950 opacity-40 grayscale italic'} rounded-[40px] font-black`}>
                  <div className="truncate pr-8 text-left font-black">
                    <span className="text-xl font-black uppercase text-red-600 block mb-1">{int.title}</span>
                    <p className="text-xs text-zinc-500 uppercase font-black">{int.band_name} {int.is_active ? '' : '(PAUSADA)'}</p>
                  </div>
                  <div className="flex gap-3 shrink-0 font-black">
                    <button onClick={() => setNewInterview(int)} className="px-6 py-2 bg-blue-600 text-white text-xs font-black border-2 border-white rounded-full font-black">EDITAR</button>
                    <button onClick={() => toggleInterviewStatus(int.id, int.is_active)} className={`px-6 py-2 text-white text-xs font-black border-2 border-white rounded-full font-black ${int.is_active ? 'bg-green-600' : 'bg-zinc-700'}`}>{int.is_active ? 'PAUSAR' : 'ACTIVAR'}</button>
                    <button onClick={() => deleteInterview(int.id)} className="px-6 py-2 bg-red-600 text-white text-xs font-black border-2 border-white rounded-full font-black font-black">ELIMINAR</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publicidad */}
          <div className="space-y-6 text-left border-t-4 border-zinc-800 pt-10 font-black">
            <h2 className="text-2xl font-black uppercase italic text-red-600 border-l-8 border-red-600 pl-4 bg-zinc-950 py-2 font-franklin rounded-r-2xl font-black">Publicidad</h2>
            <form onSubmit={handleSaveSponsor} className="bg-zinc-950 p-4 border-4 border-white space-y-4 shadow-xl rounded-[32px] font-black">
              <input placeholder="Nombre Cliente" className="w-full bg-black border-2 border-white p-2 font-bold uppercase text-xs text-white outline-none focus:border-red-600 rounded-xl" value={newSponsor.client_name} onChange={e => setNewSponsor({...newSponsor, client_name: e.target.value})} required />
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative rounded-xl font-black">
                <p className="text-[10px] font-black uppercase text-zinc-500 flex-1">{uploading ? 'Subiendo...' : (newSponsor.image_url ? 'Imagen OK ✅' : 'Subir Anuncio')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer font-black" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'sponsors'); if (url) setNewSponsor({...newSponsor, image_url: url}); }
                }} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={uploading} className="flex-1 bg-red-600 text-white font-black uppercase py-2 text-xs border-2 border-white rounded-full">GUARDAR</button>
                {newSponsor.id && <button type="button" onClick={() => setNewSponsor({id:null, client_name:'', image_url:'', link:'', position:'sidebar'})} className="bg-zinc-700 px-4 font-black border-2 border-white text-white rounded-full">X</button>}
              </div>
            </form>
          </div>

          {/* Mensajes */}
          <div className="space-y-6 border-t-4 border-zinc-800 pt-10 text-left text-white font-black">
            <h2 className="text-2xl font-black uppercase italic text-red-600 border-l-8 border-red-600 pl-4 bg-zinc-950 py-2 font-black font-franklin rounded-r-2xl font-black">Mensajes Recibidos</h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar font-black">
              {messages.map((msg) => (
                <div key={msg.id} className={`border-2 p-4 flex justify-between items-center ${msg.is_read ? 'border-zinc-800 bg-zinc-950/50 opacity-60' : 'border-white bg-zinc-900'} rounded-2xl font-black font-black`}>
                  <div onClick={() => setSelectedMessage(msg)} className="cursor-pointer flex-1 font-black">
                    <h3 className="font-black uppercase text-xs text-red-600 font-black">{msg.name}</h3>
                    <p className="text-[10px] text-zinc-300 truncate max-w-[150px] font-black">"{msg.message}"</p>
                  </div>
                  <div className="flex gap-2 font-black font-black font-black">
                    {!msg.is_read && <button onClick={() => supabase.from('contact_messages').update({ is_read: true }).eq('id', msg.id).then(() => fetchData())} className="text-[8px] bg-green-600 text-white px-3 py-1 font-black uppercase border-2 border-white rounded-full">LEER</button>}
                    <button onClick={() => deleteMessage(msg.id)} className="text-[8px] bg-red-600 text-white px-3 py-1 font-black uppercase border-2 border-white rounded-full">BORRAR</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-black">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm font-black" onClick={() => setSelectedMessage(null)} />
          <div className="relative w-full max-w-2xl bg-zinc-900 border-8 border-white p-10 shadow-[20px_20px_0px_0px_rgba(220,38,38,1)] text-left font-black uppercase rounded-[50px] font-black">
            <button onClick={() => setSelectedMessage(null)} className="absolute -top-6 -right-6 bg-red-600 text-white w-14 h-14 font-black text-2xl border-4 border-white text-center flex items-center justify-center shadow-xl rounded-full font-black">X</button>
            <h3 className="text-3xl font-black uppercase italic text-red-600 mb-3 border-b-4 border-red-600 pb-3 font-black font-franklin">{selectedMessage.name}</h3>
            <p className="text-xs font-bold text-zinc-500 uppercase mb-2 italic font-black">{selectedMessage.email}</p>
            <p className="text-xs font-bold text-green-500 uppercase mb-8 italic font-black">Celular: {selectedMessage.phone || 'No proporcionado'}</p>
            <p className="text-xl text-white leading-relaxed whitespace-pre-wrap font-black">"{selectedMessage.message}"</p>
            <button onClick={() => deleteMessage(selectedMessage.id)} className="mt-10 bg-red-600 text-white px-10 py-3 font-black uppercase text-sm border-4 border-white hover:bg-black transition-colors shadow-lg rounded-full font-black">Eliminar Mensaje</button>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; border-radius: 10px; }
      `}</style>
    </div>
  );
}
