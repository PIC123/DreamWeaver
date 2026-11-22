import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import StoryClient from '@/components/story/StoryClient';
import { isSupabaseConfigured } from '@/lib/env.client';
import { getAnon } from '@/lib/supabase/server';

type Props = { params: Promise<{ storyId: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Link previews for shared stories. Private stories reveal nothing here. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storyId } = await params;
  if (!UUID.test(storyId) || !isSupabaseConfigured) return { title: 'DreamWeaver' };
  try {
    const { data } = await getAnon()
      .from('stories')
      .select('setting, cover_url')
      .eq('id', storyId)
      .maybeSingle();
    if (!data?.setting) return { title: 'A story · DreamWeaver' };
    const title = `${data.setting} · DreamWeaver`;
    const description = 'An illustrated interactive story, written with DreamWeaver.';
    return {
      title,
      description,
      openGraph: { title, description, images: data.cover_url ? [data.cover_url as string] : [] },
      twitter: { card: data.cover_url ? 'summary_large_image' : 'summary', title, description },
    };
  } catch {
    return { title: 'DreamWeaver' };
  }
}

export default async function StoryPage({ params }: Props) {
  const { storyId } = await params;

  // Short ids from the original app: forward to the story's permanent address.
  if (!UUID.test(storyId)) {
    if (!isSupabaseConfigured || !/^[\w-]{1,64}$/.test(storyId)) notFound();
    const { data } = await getAnon()
      .from('stories')
      .select('id')
      .eq('legacy_id', storyId)
      .maybeSingle();
    if (!data) notFound();
    redirect(`/story/${data.id as string}`);
  }

  return <StoryClient storyId={storyId} />;
}
