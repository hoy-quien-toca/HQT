import InterviewDetailClient from './InterviewDetailClient';

// Force dynamic to prevent caching issues on mobile browsers
export const dynamic = 'force-dynamic';

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  return <InterviewDetailClient id={id} />;
}
