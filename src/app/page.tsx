import { supabase } from '@/lib/supabase';
import HomePageClient from './HomePageClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const today = new Date().toISOString().split('T')[0];
  
  const [eventRes, sponsorRes, interviewRes] = await Promise.all([
    supabase.from('events')
      .select('*')
      .eq('is_approved', true)
      .gte('date', today)
      .order('date', { ascending: true })
      .order('time', { ascending: true }),
    supabase.from('sponsors').select('*').eq('is_active', true),
    supabase.from('interviews')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(2)
  ]);

  const normalizedEvents = (eventRes.data || []).map(e => ({
    ...e,
    department: e.department?.trim().toUpperCase(),
    genre: e.genre?.trim().toUpperCase()
  }));

  return (
    <HomePageClient 
      initialEvents={normalizedEvents}
      initialSponsors={sponsorRes.data || []}
      initialInterviews={interviewRes.data || []}
    />
  );
}
