import InterviewDetailClient from './InterviewDetailClient';

// Server Component (Default in Next 15)
export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return <InterviewDetailClient id={id} />;
}
