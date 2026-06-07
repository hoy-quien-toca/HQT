'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const DEPARTAMENTOS = ["MONTEVIDEO", "CANELONES", "MALDONADO", "COLONIA", "SAN JOSE", "FLORIDA", "LAVALLEJA", "ROCHA", "TREINTA Y TRES", "CERRO LARGO", "RIVERA", "TACUAREMBÓ", "DURAZNO", "SORIANO", "RIO NEGRO", "PAYSANDU", "SALTO", "ARTIGAS", "ARGENTINA"];
const GENEROS = ["ACUSTICO", "ALTERNATIVO", "BLUES", "CANDOMBE", "COVERS", "CUMBIA", "ELECTRONICA", "FIESTA", "FOLKLORE", "HIP-HOP/RAP", "JAZZ", "METAL", "MILONGA", "MURGA", "OTROS", "PLENA", "POP", "PUNK ROCK", "REGGAETON", "REGGUE", "ROCK", "SKA", "TANGO", "TRAP", "TROPICAL", "UNDER"];

const adminBtn = 'text-[9px] sm:text-[10px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border font-black whitespace-nowrap';
const adminBar = 'w-full py-1 sm:py-1.5 px-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wide border-2 rounded-md transition-colors leading-tight min-h-[1.35rem] sm:min-h-[1.6rem] flex items-center justify-center';

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showEventsSection, setShowEventsSection] = useState(true);
  const [showMessagesSection, setShowMessagesSection] = useState(true);
  const [showSponsorsSection, setShowSponsorsSection] = useState(true);
  const [showInterviewsSection, setShowInterviewsSection] = useState(true);
  
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
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (!a.is_approved && !b.is_approved) return dateA.localeCompare(dateB);
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return dateA.localeCompare(dateB);
    });
    setEvents(sortedEvents); setMessages(messageRes.data || []); setInterviews(interviewRes.data || []); setSponsors(sponsorRes.data || []); setLoading(false);
  }

  async function handleFileUpload(file: File, folder: string) {
    setUploading(true);
    
    // Comprimir imagen antes de subir
    const compressedFile = await new Promise<Blob>((resolve) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const MAX = 1200;
          let w = img.width, h = img.height;
          if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
          if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.75);
        };
        img.src = e.target!.result as string;
      };
      reader.readAsDataURL(file);
    });

    const filePath = `${folder}/${Math.random()}.jpg`;
    const { error: uploadError } = await supabase.storage.from('hqt-assets').upload(filePath, compressedFile, { contentType: 'image/jpeg' });
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
    
    // Normalización de datos para filtros consistentes
    const normalizedData = {
      ...data,
      band_name: data.band_name?.trim().toUpperCase(),
      venue: data.venue?.trim().toUpperCase(),
      address: data.address?.trim().toUpperCase(),
      city: data.city?.trim().toUpperCase(),
    };

    const res = id === 'new' ? await supabase.from('events').insert([normalizedData]) : await supabase.from('events').update(normalizedData).eq('id', id);
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
  async function toggleInterviewFeatured(id: string, current: boolean) { await supabase.from('interviews').update({ is_featured: !current }).eq('id', id); fetchData(); }
  async function toggleSponsorStatus(id: string, current: boolean) { await supabase.from('sponsors').update({ is_active: !current }).eq('id', id); fetchData(); }

  if (loading) return <div className="min-h-screen bg-black text-red-600 flex items-center justify-center font-black text-2xl uppercase italic">Cargando Admin...</div>;

  const today = new Date().toISOString().split('T')[0];
  const pendingEvents = events.filter((e) => !e.is_approved);
  const upcomingEvents = events.filter((e) => e.is_approved && e.date >= today);
  const pastEvents = events.filter((e) => e.is_approved && e.date < today);

  const renderEventCard = (ev: any) => {
    const isPending = !ev.is_approved;
    return (
      <div
        key={ev.id}
        className={`border-4 p-2.5 sm:p-3 rounded-2xl ${
          isPending
            ? 'border-red-600 bg-red-950/40 admin-pending-card'
            : 'border-red-600 bg-zinc-950/80'
        }`}
      >
        {isPending && (
          <p className="text-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-red-500 animate-pulse mb-2">
            ⚠ Pendiente
          </p>
        )}
        <div className="flex gap-2 sm:gap-3">
          <img
            src={ev.flyer_url || '/logo-rojo.jpg'}
            alt={ev.band_name}
            className="w-[6.65rem] h-[8.05rem] sm:w-28 sm:h-[8.4rem] object-cover border-2 border-white rounded-lg flex-shrink-0 self-start"
          />
          <div className="min-w-0 flex-1 flex flex-col gap-1 min-h-[8.05rem] sm:min-h-[8.4rem]">
            <div className="flex items-start justify-between gap-1 flex-shrink-0">
              <h3 className="text-sm sm:text-base font-black uppercase leading-tight truncate flex-1 min-w-0 pr-1">{ev.band_name}</h3>
              <div className="flex flex-shrink-0 gap-0.5 sm:gap-1">
                <button type="button" onClick={() => setEditingEvent(ev)} className={`${adminBtn} bg-blue-600 border-white`}>EDITAR</button>
                <button type="button" onClick={() => supabase.from('events').update({ is_approved: !ev.is_approved }).eq('id', ev.id).then(() => fetchData())} className={`${adminBtn} border-white ${ev.is_approved ? 'bg-zinc-800' : 'bg-green-600'}`}>{ev.is_approved ? 'BAJAR' : 'APROBAR'}</button>
                <button type="button" onClick={() => deleteEvent(ev.id)} className={`${adminBtn} bg-red-600 border-white`}>BORRAR</button>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-red-600 uppercase line-clamp-2 flex-shrink-0">
              {ev.date} — {ev.time?.substring(0, 5)} hs · {ev.venue}
            </p>
            <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 justify-between min-h-0">
              <button
                type="button"
                onClick={() => toggleFeatured(ev.id, ev.is_featured)}
                title="Carrusel destacado arriba en la portada"
                className={`${adminBar} flex-1 ${ev.is_featured ? 'bg-red-600 border-white text-white' : 'bg-transparent border-red-600 text-red-600'}`}
              >
                BANNER
              </button>
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5 flex-1">
                <button type="button" onClick={() => updateEventTag(ev.id, 'PLANAZO', ev.suggestion_tag)} className={`${adminBar} h-full ${ev.suggestion_tag === 'PLANAZO' ? 'bg-yellow-400 text-black border-black' : 'border-yellow-400 text-yellow-400'}`}>PLANAZO</button>
                <button type="button" onClick={() => updateEventTag(ev.id, 'NO FALLA', ev.suggestion_tag)} className={`${adminBar} h-full ${ev.suggestion_tag === 'NO FALLA' ? 'bg-white text-black border-black' : 'border-white text-white'}`}>NO FALLA</button>
                <button type="button" onClick={() => updateEventTag(ev.id, 'SALIDA SEGURA', ev.suggestion_tag)} className={`${adminBar} h-full text-[8px] sm:text-[9px] ${ev.suggestion_tag === 'SALIDA SEGURA' ? 'bg-green-600 border-white text-white' : 'border-green-600 text-green-600'}`}>SALIDA SEGURA</button>
              </div>
              <div className="grid grid-cols-2 gap-1 sm:gap-1.5 flex-1">
                <button type="button" onClick={() => toggleSoldOut(ev.id, ev.is_sold_out)} className={`${adminBar} h-full ${ev.is_sold_out ? 'bg-red-600 border-white text-white' : 'border-red-600 text-red-600'}`}>AGOTADO</button>
                <button type="button" onClick={() => toggleSuspended(ev.id, ev.is_suspended)} className={`${adminBar} h-full ${ev.is_suspended ? 'bg-orange-500 border-white text-black' : 'border-orange-500 text-orange-500'}`}>SUSPENDIDO</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMessageCard = (m: any) => (
    <div key={m.id} className={`border-4 p-2.5 sm:p-3 rounded-2xl border-red-600 bg-zinc-950/80`}>
      <div className="flex gap-3">
        <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
          <span className="text-xs uppercase text-red-600 font-black">MSG</span>
        </div>
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-start justify-between">
            <h3 className="text-sm sm:text-base font-black uppercase leading-tight truncate">{m.name}</h3>
            <div className="flex gap-1">
              <button type="button" onClick={() => setSelectedMessage(m)} className={`${adminBtn} bg-blue-600 border-white`}>VER</button>
              <button type="button" onClick={() => deleteMessage(m.id)} className={`${adminBtn} bg-red-600 border-white`}>BORRAR</button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-300 truncate mt-1">{m.message}</p>
          <p className="text-[9px] text-zinc-500 mt-2 uppercase">{m.email} · {m.phone}</p>
        </div>
      </div>
    </div>
  );

  const renderSponsorCard = (sp: any) => (
    <div key={sp.id} className={`border-4 p-2.5 sm:p-3 rounded-2xl ${sp.is_active ? 'border-red-600 bg-zinc-950' : 'border-zinc-800 opacity-60 bg-zinc-900'}`}>
      <div className="flex gap-3">
        <img src={sp.image_url || '/logo-rojo.jpg'} alt={sp.client_name} className="w-28 h-28 object-contain object-center border-2 border-white rounded-lg flex-shrink-0" />
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-start justify-between">
            <h3 className="text-sm sm:text-base font-black uppercase leading-tight truncate">{sp.client_name}</h3>
            <div className="flex gap-1">
              <button type="button" onClick={() => setNewSponsor(sp)} className={`${adminBtn} bg-blue-600 border-white`}>EDITAR</button>
              <button type="button" onClick={() => toggleSponsorStatus(sp.id, sp.is_active)} className={`${adminBtn} bg-green-600 border-white`}>{sp.is_active ? 'PAUSA' : 'ACTIVO'}</button>
              <button type="button" onClick={() => deleteSponsor(sp.id)} className={`${adminBtn} bg-red-600 border-white`}>BORRAR</button>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-red-600 uppercase mt-1">{sponsorPositionLabel(sp.position)} · Ord. {sp.display_order}</p>
          {sp.link && <p className="text-[10px] text-zinc-400 truncate mt-1">{sp.link}</p>}
        </div>
      </div>
    </div>
  );

  const renderInterviewCard = (intv: any) => (
    <div key={intv.id} className={`border-4 p-2.5 sm:p-3 rounded-2xl ${intv.is_active ? 'border-red-600 bg-zinc-950 shadow-md' : 'border-zinc-800 opacity-50 bg-zinc-900 grayscale'}`}>
      <div className="flex gap-3 items-start">
        <img src={intv.image_url || '/logo-rojo.jpg'} alt={intv.title} className="w-20 h-20 sm:w-24 sm:h-24 object-cover object-center border-2 border-white rounded-lg flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-black uppercase leading-tight truncate">{intv.title}</h3>
          <p className="text-[10px] sm:text-xs font-bold text-red-600 uppercase mt-1 truncate">{intv.band_name}</p>
          <p className="text-[10px] text-zinc-400 mt-2 line-clamp-2">{intv.subtitle}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center sm:justify-end gap-1">
        <button type="button" onClick={() => setSelectedInterview(intv)} className={`${adminBtn} bg-zinc-700 border-white text-white`}>VER</button>
        <button type="button" onClick={() => setNewInterview(intv)} className={`${adminBtn} bg-blue-600 border-white`}>EDITAR</button>
        <button type="button" onClick={() => toggleInterviewFeatured(intv.id, intv.is_featured)} className={`${adminBtn} ${intv.is_featured ? 'bg-yellow-400 text-black border-black' : 'bg-zinc-800 border-white'}`}>DESTACAR</button>
        <button type="button" onClick={() => toggleInterviewStatus(intv.id, intv.is_active)} className={`${adminBtn} bg-green-600 border-white`}>{intv.is_active ? 'PAUSA' : 'ACTIVO'}</button>
        <button type="button" onClick={() => deleteInterview(intv.id)} className={`${adminBtn} bg-red-600 border-white`}>BORRAR</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-3 sm:p-4 md:p-6 font-sans relative text-left overflow-x-hidden font-black">
      <header className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-4 sm:mb-6 border-b-4 border-red-600 pb-4 sm:pb-6 bg-zinc-950 p-3 sm:p-4 sticky top-0 z-50 gap-3">
        <div><h1 className="text-xl sm:text-3xl md:text-4xl font-black uppercase italic text-red-600 leading-none">ADMINISTRADOR HQT</h1></div>
        <div className="flex gap-2 sm:gap-4"><button onClick={() => router.push('/')} className="flex-1 sm:flex-none bg-white text-black px-4 py-2 font-black uppercase text-xs rounded-full">Web</button><button onClick={() => supabase.auth.signOut().then(() => router.push('/admin'))} className="flex-1 sm:flex-none bg-red-600 px-4 py-2 font-black uppercase text-xs rounded-full">Salir</button></div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        {/* IZQUIERDA: FECHAS */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-zinc-950 p-3 sm:p-4 border-l-8 border-red-600 rounded-r-2xl font-black">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl uppercase italic text-red-600 font-franklin">Fechas</h2>
              <button type="button" onClick={() => setShowEventsSection((prev) => !prev)} className={`${adminBtn} bg-zinc-800 border-white`}>{showEventsSection ? 'Ocultar' : 'Mostrar'}</button>
            </div>
            <button onClick={() => setEditingEvent({ id: 'new', band_name: '', venue: '', address: '', city: '', department: 'MONTEVIDEO', date: '', time: '21:00', age_rating: 'ATP', description: '', is_approved: false, price_type: 'range', genre: 'ROCK', flyer_url: '', price_min: null, price_max: null, ticket_type: 'link', ticket_contact: '' })} className="w-full sm:w-auto bg-red-600 text-white px-4 sm:px-6 py-2 text-[10px] font-black uppercase rounded-full border-2 border-white">+ NUEVA FECHA</button>
          </div>
          
          {showEventsSection && (
          <>
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
                <div className="grid grid-cols-2 gap-2 col-span-2">
                  <input 
                    type="number" 
                    placeholder="Mín $" 
                    value={editingEvent.price_min || ''} 
                    onChange={e => setEditingEvent({...editingEvent, price_min: e.target.value})} 
                    className="bg-black border-2 border-white p-2 rounded-lg" 
                  />
                  <input 
                    type="number" 
                    placeholder="Máx $" 
                    value={editingEvent.price_max || ''} 
                    onChange={e => setEditingEvent({...editingEvent, price_max: e.target.value})} 
                    className="bg-black border-2 border-white p-2 rounded-lg" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 col-span-2">
                  <select value={editingEvent.ticket_type || 'link'} onChange={e => setEditingEvent({...editingEvent, ticket_type: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg uppercase">
                    <option value="link">LINK PAGO</option>
                    <option value="whatsapp">WHATSAPP</option>
                  </select>
                  <input value={editingEvent.ticket_contact || ''} onChange={e => setEditingEvent({...editingEvent, ticket_contact: e.target.value})} className="bg-black border-2 border-white p-2 rounded-lg" placeholder={editingEvent.ticket_type === 'whatsapp' ? "CEL: 099123456" : "URL DE PAGO"} />
                </div>
                <div className="col-span-2 flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative rounded-xl font-black"><p className="text-[10px] uppercase text-zinc-500 flex-1">{uploading ? '...' : (editingEvent.flyer_url ? 'Foto OK ✅' : 'Subir Flyer')}</p><input type="file" className="absolute inset-0 opacity-0" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await handleFileUpload(f, 'flyers'); if (u) setEditingEvent({...editingEvent, flyer_url: u}); } }} /></div>
                <textarea value={editingEvent.description || ''} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} className="sm:col-span-2 bg-black border-2 border-white p-2 uppercase rounded-lg h-20" placeholder="Reseña" />
                <div className="sm:col-span-2 flex gap-2"><button type="submit" className="flex-1 bg-blue-600 py-3 font-black border-2 border-white rounded-full uppercase shadow-lg">GUARDAR</button><button type="button" onClick={() => setEditingEvent(null)} className="bg-zinc-700 px-6 font-black border-2 border-white rounded-full">X</button></div>
              </form>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:gap-4 pb-6">
            {pendingEvents.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="border-2 border-red-600 bg-red-600/20 rounded-2xl px-4 py-2 text-center admin-pending-banner">
                  <p className="text-sm font-black uppercase text-red-500 tracking-widest">
                    Por aprobar ({pendingEvents.length})
                  </p>
                </div>
                {pendingEvents.map(renderEventCard)}
              </div>
            )}
            
            {upcomingEvents.length > 0 && (
              <div className="flex flex-col gap-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">
                  Próximas fechas ({upcomingEvents.length})
                </p>
                {upcomingEvents.map(renderEventCard)}
              </div>
            )}

            {pastEvents.length > 0 && (
              <div className="flex flex-col gap-5 mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">
                  Fechas pasadas ({pastEvents.length}) - No visibles en la web
                </p>
                <div className="opacity-60 grayscale">
                  {pastEvents.map(renderEventCard)}
                </div>
              </div>
            )}
          </div>
          </>
            )}
        </section>

        {/* DERECHA: MENSAJES -> PUBLICIDAD -> ENTREVISTAS */}
        <section className="space-y-8 sm:space-y-12">
          {/* MENSAJES */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-zinc-950 p-3 border-l-8 border-red-600 rounded-r-2xl">
              <h2 className="text-xl sm:text-2xl uppercase italic text-red-600 font-franklin">Mensajes</h2>
              <button type="button" onClick={() => setShowMessagesSection((prev) => !prev)} className={`${adminBtn} bg-zinc-800 border-white`}>{showMessagesSection ? 'Ocultar' : 'Mostrar'}</button>
            </div>
            {showMessagesSection && (
              <div className="space-y-2 sm:space-y-3 font-black">
                {messages.map(renderMessageCard)}
              </div>
            )}
          </div>

          {/* PUBLICIDAD */}
          <div className="space-y-4 sm:space-y-6 border-t-4 border-zinc-800 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-zinc-950 p-3 border-l-8 border-red-600 rounded-r-2xl">
              <h2 className="text-xl sm:text-2xl uppercase italic text-red-600 font-franklin">Publicidad</h2>
              <button type="button" onClick={() => setShowSponsorsSection((prev) => !prev)} className={`${adminBtn} bg-zinc-800 border-white`}>{showSponsorsSection ? 'Ocultar' : 'Mostrar'}</button>
            </div>
            {showSponsorsSection && (
              <>
                <form onSubmit={handleSaveSponsor} className="bg-zinc-950 p-4 border-4 border-white space-y-4 rounded-[32px] font-black">
                  <input placeholder="Nombre Cliente" className="w-full bg-black border-2 border-white p-2 uppercase text-xs rounded-xl" value={newSponsor.client_name} onChange={e => setNewSponsor({...newSponsor, client_name: e.target.value})} required />
                  <input placeholder="Link Web" className="w-full bg-black border-2 border-white p-2 text-xs rounded-xl" value={newSponsor.link} onChange={e => setNewSponsor({...newSponsor, link: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2"><select value={newSponsor.position} onChange={e => setNewSponsor({...newSponsor, position: e.target.value})} className="bg-black border-2 border-white p-2 text-xs rounded-xl"><option value="top">BANNER SUPERIOR</option><option value="sidebar">LATERAL</option><option value="bottom">INFERIOR</option></select><input type="number" placeholder="Orden" value={newSponsor.display_order} onChange={e => setNewSponsor({...newSponsor, display_order: parseInt(e.target.value) || 0})} className="bg-black border-2 border-white p-2 text-xs rounded-xl" /></div>
                  <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative rounded-xl font-black font-black"><p className="text-[10px] uppercase text-zinc-500 flex-1 font-black">{uploading ? '...' : (newSponsor.image_url ? 'Imagen OK ✅' : 'Subir Imagen')}</p><input type="file" className="absolute inset-0 opacity-0" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await handleFileUpload(f, 'sponsors'); if (u) setNewSponsor({...newSponsor, image_url: u}); } }} /></div>
                  <button type="submit" disabled={uploading} className="w-full bg-red-600 py-2 text-xs border-2 border-white rounded-full font-black">GUARDAR</button>
                </form>
                <div className="space-y-2 sm:space-y-3">
                  {sponsors.map(renderSponsorCard)}
            </div>
          </>
            )}
            </div>

          {/* ENTREVISTAS */}
          <div className="space-y-4 sm:space-y-6 border-t-4 border-zinc-800 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-zinc-950 p-3 border-l-8 border-red-600 rounded-r-2xl">
              <h2 className="text-xl sm:text-2xl uppercase italic text-red-600 font-franklin">Entrevistas</h2>
              <button type="button" onClick={() => setShowInterviewsSection((prev) => !prev)} className={`${adminBtn} bg-zinc-800 border-white`}>{showInterviewsSection ? 'Ocultar' : 'Mostrar'}</button>
            </div>
            {showInterviewsSection && (
              <div className="space-y-4">
                <form onSubmit={handleSaveInterview} className="bg-zinc-950 p-4 border-4 border-white space-y-4 rounded-[32px] font-black">
              <input placeholder="Banda / Artista" className="w-full bg-black border-2 border-white p-2 uppercase text-xs rounded-xl" value={newInterview.band_name} onChange={e => setNewInterview({...newInterview, band_name: e.target.value})} required />
              <input placeholder="Título de la nota" className="w-full bg-black border-2 border-white p-2 uppercase text-xs rounded-xl" value={newInterview.title} onChange={e => setNewInterview({...newInterview, title: e.target.value})} required />
              <input placeholder="Subtítulo / Bajada" className="w-full bg-black border-2 border-white p-2 uppercase text-xs rounded-xl" value={newInterview.subtitle} onChange={e => setNewInterview({...newInterview, subtitle: e.target.value})} />
              <div className="grid grid-cols-2 gap-2"><input placeholder="Créditos Nota" className="bg-black border-2 border-white p-2 text-xs rounded-xl" value={newInterview.author} onChange={e => setNewInterview({...newInterview, author: e.target.value})} /><input placeholder="Créditos Foto" className="bg-black border-2 border-white p-2 text-xs rounded-xl" value={newInterview.photo_credit} onChange={e => setNewInterview({...newInterview, photo_credit: e.target.value})} /></div>
              <div className="flex gap-4 items-center border-2 border-dashed border-zinc-700 p-2 relative rounded-xl font-black"><p className="text-[10px] uppercase text-zinc-500 flex-1">{uploading ? '...' : (newInterview.image_url ? 'Imagen OK ✅' : 'Subir Foto')}</p><input type="file" className="absolute inset-0 opacity-0" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await handleFileUpload(f, 'interviews'); if (u) setNewInterview({...newInterview, image_url: u}); } }} /></div>
              <textarea placeholder="Contenido de la entrevista..." className="w-full bg-black border-2 border-white p-2 text-xs rounded-xl h-24" value={newInterview.content} onChange={e => setNewInterview({...newInterview, content: e.target.value})} required />
              <div className="flex gap-2"><button type="submit" disabled={uploading} className="flex-1 bg-red-600 py-2 text-xs border-2 border-white rounded-full font-black">PUBLICAR</button>{newInterview.id && <button type="button" onClick={() => setNewInterview({id:null, title:'', subtitle:'', band_name:'', content:'', image_url:'', is_active:true, author:'', photo_credit:''})} className="bg-zinc-700 px-4 border border-white rounded-full font-black font-black">X</button>}</div>
            </form>
            <div className="space-y-2 sm:space-y-3">
              {interviews.map(renderInterviewCard)}
            </div>
          </div>
        )}
      </div>
    </section>
  </div>

      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"><div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedMessage(null)} /><div className="relative w-full max-w-xl bg-zinc-900 border-4 sm:border-8 border-white p-5 sm:p-8 shadow-2xl rounded-t-3xl sm:rounded-[40px] font-black text-left max-h-[85vh] overflow-y-auto"><button onClick={() => setSelectedMessage(null)} className="absolute top-3 right-3 sm:-top-4 sm:-right-4 bg-red-600 text-white w-9 h-9 sm:w-10 sm:h-10 text-lg border-4 border-white rounded-full">X</button><h3 className="text-xl sm:text-2xl uppercase text-red-600 mb-2 pr-10">{selectedMessage.name}</h3><p className="text-xs text-zinc-500 mb-2 italic break-all">{selectedMessage.email} | {selectedMessage.phone}</p><p className="text-base sm:text-lg text-white">"{selectedMessage.message}"</p><button onClick={() => { if(confirm('¿Borrar?')) deleteMessage(selectedMessage.id) }} className="mt-6 w-full sm:w-auto bg-red-600 text-white px-6 py-2 rounded-full uppercase text-xs border-2 border-white">ELIMINAR</button></div></div>
      )}

      {selectedInterview && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"><div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setSelectedInterview(null)} /><div className="relative w-full max-w-2xl bg-zinc-900 border-4 sm:border-8 border-white p-5 sm:p-10 shadow-2xl rounded-t-3xl sm:rounded-[40px] font-black text-left overflow-y-auto max-h-[92vh] sm:max-h-[90vh]"><button onClick={() => setSelectedInterview(null)} className="absolute top-3 right-3 bg-red-600 text-white w-9 h-9 text-lg border-4 border-white rounded-full">X</button><span className="bg-red-600 text-white px-3 py-1 text-[10px] sm:text-xs uppercase italic rounded-full font-black">BANDA: {selectedInterview.band_name}</span><h3 className="text-2xl sm:text-3xl md:text-5xl font-franklin text-white uppercase mt-3 sm:mt-4 leading-none pr-10">{selectedInterview.title}</h3><p className="text-zinc-400 text-sm sm:text-lg uppercase italic mt-2">{selectedInterview.subtitle}</p>{selectedInterview.image_url && <img src={selectedInterview.image_url} className="w-full h-40 sm:h-64 object-cover object-center border-4 border-white rounded-2xl sm:rounded-3xl my-4 sm:my-6" />}<div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[10px] text-zinc-500 uppercase mb-4 sm:mb-6 font-black"><p>Nota: {selectedInterview.author}</p><p>Foto: {selectedInterview.photo_credit}</p></div><div className="text-white text-base sm:text-xl leading-relaxed whitespace-pre-wrap font-black">{selectedInterview.content}</div></div></div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; border-radius: 10px; }
        @keyframes admin-pending-blink {
          0%, 100% {
            border-color: #dc2626;
            box-shadow: 0 0 18px rgba(220, 38, 38, 0.55);
          }
          50% {
            border-color: #ffffff;
            box-shadow: 0 0 28px rgba(220, 38, 38, 0.85);
          }
        }
        .admin-pending-card {
          animation: admin-pending-blink 1.1s ease-in-out infinite;
        }
        .admin-pending-banner {
          animation: admin-pending-blink 1.1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
