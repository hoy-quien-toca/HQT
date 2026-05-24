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

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEvent) return;
    const { id, created_at, ...data } = editingEvent;
    if (id === 'new') {
       const { error } = await supabase.from('events').insert([data]);
       if (error) alert('Error: ' + error.message);
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
    if (confirm('¿Borrar definitivamente?')) {
      await supabase.from('events').delete().eq('id', id);
      fetchData();
    }
  }

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
    await supabase.from('sponsors').update({ is_active: !currentStatus }).eq('id', id);
    fetchData();
  }

  async function deleteSponsor(id: string) {
    if (confirm('¿Borrar auspicio?')) {
      const { error } = await supabase.from('sponsors').delete().eq('id', id);
      if (error) alert('Error: ' + error.message);
      else fetchData();
    }
  }

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
    if (error) alert('Error: ' + error.message);
    else { alert('¡Guardado!'); setNewInterview({ id: null, title: '', subtitle: '', band_name: '', content: '', image_url: '', is_active: true, author: '', photo_credit: '', image_position: 'center' }); fetchData(); }
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

  async function deleteMessage(id: string) {
    if (confirm('¿Borrar mensaje?')) {
      await supabase.from('contact_messages').delete().eq('id', id);
      fetchData();
      setSelectedMessage(null);
    }
  }

  if (loading) return <div className="min-h-screen bg-black text-red-600 flex items-center justify-center font-black text-2xl uppercase italic text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 md:p-6 font-sans relative text-left overflow-x-hidden font-black">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-4 border-red-600 pb-6 bg-zinc-950 p-4 sticky top-0 z-50 gap-4">
        <div>
           <h1 className="text-3xl md:text-4xl font-black uppercase italic text-red-600 leading-none">ADMINISTRADOR HQT</h1>
           <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1 italic">Gestión de Hoy Quien Toca</p>
        </div>
        <div className="flex gap-4 font-black">
          <button onClick={() => router.push('/')} className="bg-white text-black px-4 py-1 font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-colors rounded-full border-2 border-white">Web</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="bg-red-600 px-4 py-1 font-black uppercase text-xs hover:bg-white hover:text-black transition-colors rounded-full border-2 border-white font-black">Salir</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 font-black">
        {/* LADO IZQUIERDO: FECHAS (3/4 TAMAÑO) */}
        <section className="space-y-6 text-left">
          <div className="flex justify-between items-center bg-zinc-950 p-3 border-l-4 border-red-600 rounded-r-xl">
             <h2 className="text-xl font-black uppercase italic text-red-600 font-franklin">Fechas</h2>
             <button onClick={() => setEditingEvent({ id: 'new', band_name: '', venue: '', address: '', date: '', time: '21:00', age_rating: 'ATP', description: '', is_approved: false, price_type: 'free' })} className="bg-red-600 text-white px-4 py-1.5 text-[9px] font-black uppercase rounded-full border-2 border-white">+ NUEVA FECHA</button>
          </div>
          
          {editingEvent && (
            <div className="border-4 border-blue-600 p-4 bg-zinc-950 space-y-4 mb-8 shadow-lg rounded-3xl font-black">
              <h3 className="text-sm font-black uppercase text-blue-500 font-franklin">{editingEvent.id === 'new' ? 'NUEVA FECHA' : 'EDITANDO'}</h3>
              <form onSubmit={handleSaveEvent} className="grid grid-cols-2 gap-3 text-[10px] text-white font-black font-black">
                <input value={editingEvent.band_name} onChange={e => setEditingEvent({...editingEvent, band_name: e.target.value})} className="col-span-2 bg-black border-2 border-white p-2 uppercase font-bold rounded-lg" placeholder="Banda" />
                <input value={editingEvent.address || ''} onChange={e => setEditingEvent({...editingEvent, address: e.target.value})} className="col-span-2 bg-black border-2 border-white p-2 uppercase rounded-lg" placeholder="Dirección" />
                <input type="date" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg" />
                <input type="time" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg" />
                
                {/* CAMPOS DE METADATOS SINCRONIZADOS */}
                <input value={editingEvent.venue || ''} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} className="bg-black border-2 border-white p-2 uppercase rounded-lg" placeholder="Lugar" />
                <input value={editingEvent.city || ''} onChange={e => setEditingEvent({...editingEvent, city: e.target.value})} className="bg-black border-2 border-white p-2 uppercase rounded-lg" placeholder="Ciudad" />
                
                <select value={editingEvent.price_type} onChange={e => setEditingEvent({...editingEvent, price_type: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg font-black uppercase">
                   <option value="free">LIBRE</option><option value="range">PAGO</option><option value="gorra">GORRA</option><option value="sobre">SOBRE</option>
                </select>
                <input value={editingEvent.price_min || ''} onChange={e => setEditingEvent({...editingEvent, price_min: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg" placeholder="Precio $" />

                <textarea value={editingEvent.description || ''} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} className="col-span-2 bg-black border-2 border-white p-2 uppercase rounded-lg h-20" placeholder="Reseña" />
                
                <div className="col-span-2 flex gap-2 font-black">
                  <button type="submit" className="flex-1 bg-blue-600 py-3 font-black border-2 border-white rounded-full uppercase shadow-lg">GUARDAR FECHA</button>
                  <button type="button" onClick={() => setEditingEvent(null)} className="bg-zinc-700 px-6 font-black border-2 border-white rounded-full">X</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3 font-black">
            {events.map((event) => (
              <div key={event.id} className={`border-2 p-3 flex flex-col gap-3 ${!event.is_approved ? 'border-red-600 bg-zinc-900 animate-pulse' : 'border-zinc-800 bg-zinc-950/80'} rounded-2xl`}>
                <div className="flex justify-between items-center font-black">
                  <div className="flex gap-2 items-center font-black">
                    {event.flyer_url && <img src={event.flyer_url} className="w-10 h-10 object-cover border-2 border-white rounded-lg" />}
                    <div>
                      <h3 className="text-base font-black uppercase leading-none">{event.band_name}</h3>
                      <p className="text-[7px] text-red-600 font-bold uppercase">{event.date} @ {event.venue}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 font-black">
                    <button onClick={() => setEditingEvent(event)} className="bg-blue-600 text-white px-2 py-0.5 text-[7px] font-black border border-white rounded-full">EDIT</button>
                    <button onClick={() => supabase.from('events').update({ is_approved: !event.is_approved }).eq('id', event.id).then(() => fetchData())} className={`px-2 py-0.5 text-[7px] font-black border border-white rounded-full ${event.is_approved ? 'bg-zinc-800' : 'bg-green-600'}`}>{event.is_approved ? 'BAJAR' : 'ALTA'}</button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 items-center border-t border-zinc-800 pt-1.5 font-black">
                  {/* BOTONES AGOTADO / SUSPENDIDO */}
                  <button onClick={() => toggleSoldOut(event.id, event.is_sold_out)} className={`px-2 py-0.5 text-[6px] font-black border rounded-full ${event.is_sold_out ? 'bg-red-600 text-white' : 'border-red-600 text-red-600'}`}>AGOTADO</button>
                  <button onClick={() => toggleSuspended(event.id, event.is_suspended)} className={`px-2 py-0.5 text-[6px] font-black border rounded-full ${event.is_suspended ? 'bg-zinc-100 text-black' : 'border-zinc-500 text-zinc-500'}`}>SUSPENDIDO</button>
                  
                  <div className="h-4 w-[1px] bg-zinc-800 mx-1" />
                  
                  <button onClick={() => updateEventTag(event.id, 'PLANAZO')} className={`px-2 py-0.5 text-[6px] font-black border rounded-full ${event.suggestion_tag === 'PLANAZO' ? 'bg-red-600 text-white shadow-sm' : 'border-red-600 text-red-600'}`}>PLANAZO</button>
                  <button onClick={() => updateEventTag(event.id, 'SALIDA SEGURA')} className={`px-2 py-0.5 text-[6px] font-black border rounded-full ${event.suggestion_tag === 'SALIDA SEGURA' ? 'bg-green-600 border-white text-white shadow-sm' : 'border-green-600 text-green-600'}`}>SEGURA</button>
                  <button onClick={() => updateEventTag(event.id, 'NO FALLA')} className={`px-2 py-0.5 text-[6px] font-black border rounded-full ${event.suggestion_tag === 'NO FALLA' ? 'bg-white border-black text-black shadow-sm' : 'border-white text-white'}`}>NO FALLA</button>
                  <button onClick={() => updateEventTag(event.id, '')} className="text-[6px] font-black uppercase text-red-600 underline ml-auto italic font-black">X TAG</button>
                  <button onClick={() => deleteEvent(event.id)} className="text-[6px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black ml-1">BORRAR</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LADO DERECHO: PUBLICIDAD (NORMAL) Y ENTREVISTAS (GIGANTES) */}
        <section className="space-y-12 font-black">
          {/* Publicidad */}
          <div className="space-y-4 font-black">
            <h2 className="text-xl font-black uppercase italic text-red-600 border-l-4 border-red-600 pl-3">Publicidad</h2>
            <form onSubmit={handleSaveSponsor} className="bg-zinc-950 p-4 border-2 border-white space-y-3 shadow-md rounded-3xl font-black font-black font-black">
              <input placeholder="Nombre Cliente" className="w-full bg-black border p-2 uppercase text-[10px] text-white focus:border-red-600 outline-none rounded-xl" value={newSponsor.client_name} onChange={e => setNewSponsor({...newSponsor, client_name: e.target.value})} required />
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative rounded-xl font-black">
                <p className="text-[9px] font-black uppercase text-zinc-500 flex-1">{uploading ? 'Subiendo...' : (newSponsor.image_url ? 'Imagen OK ✅' : 'Subir Anuncio')}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer font-black" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (file) { const url = await handleFileUpload(file, 'sponsors'); if (url) setNewSponsor({...newSponsor, image_url: url}); }
                }} />
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-red-600 text-white font-black uppercase py-2 text-[10px] border border-white rounded-full">GUARDAR PUBLICIDAD</button>
            </form>
          </div>

          {/* LISTA DE ENTREVISTAS (ESTA ES LA GIGANTE) */}
          <div className="space-y-6 font-black">
            <div className="flex justify-between items-center bg-zinc-950 p-4 border-l-8 border-red-600 rounded-r-2xl">
               <h2 className="text-3xl font-black uppercase italic text-red-600 font-franklin">Entrevistas Publicadas</h2>
               <button onClick={() => router.push('/interviews')} className="text-xs uppercase underline text-zinc-500 hover:text-white transition-colors font-black">Ver Web</button>
            </div>
            <div className="grid grid-cols-1 gap-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              {interviews.map(int => (
                <div key={int.id} className={`border-4 p-8 flex justify-between items-center shadow-2xl transition-all ${int.is_active ? 'border-red-600 bg-zinc-900 scale-105' : 'border-zinc-800 bg-zinc-950 opacity-40 grayscale italic'} rounded-[50px] font-black`}>
                  <div className="truncate pr-10 text-left flex-1 font-black">
                    <span className="text-2xl font-black uppercase text-red-600 block mb-2 leading-none">{int.title}</span>
                    <p className="text-sm text-zinc-500 uppercase font-black tracking-widest">{int.band_name} {int.is_active ? '' : '(PAUSADA)'}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 font-black">
                    <button onClick={() => toggleInterviewStatus(int.id, int.is_active)} className={`px-8 py-3 text-white text-xs font-black border-4 border-white rounded-full transition-all shadow-lg ${int.is_active ? 'bg-green-600 hover:bg-black' : 'bg-zinc-700 hover:bg-green-600'}`}>{int.is_active ? 'PAUSAR' : 'ACTIVAR'}</button>
                    <button onClick={() => setNewInterview(int)} className="px-8 py-2 bg-blue-600 text-white text-[10px] font-black border-2 border-white rounded-full hover:bg-white hover:text-black uppercase">EDITAR</button>
                    <button onClick={() => deleteInterview(int.id)} className="px-8 py-2 bg-red-600 text-white text-[10px] font-black border-2 border-white rounded-full uppercase font-black">BORRAR</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm font-black" onClick={() => setSelectedMessage(null)} />
          <div className="relative w-full max-w-xl bg-zinc-900 border-8 border-white p-8 shadow-2xl rounded-[50px] font-black text-left">
            <button onClick={() => setSelectedMessage(null)} className="absolute -top-4 -right-4 bg-red-600 text-white w-10 h-10 font-black text-xl border-4 border-white rounded-full shadow-xl">X</button>
            <h3 className="text-2xl font-black uppercase text-red-600 mb-2">{selectedMessage.name}</h3>
            <p className="text-lg text-white font-black">"{selectedMessage.message}"</p>
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
