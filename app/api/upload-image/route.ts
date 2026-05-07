import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { getSupabaseAdmin, getSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_BYTES = 10 * 1024 * 1024; // 10MB ceiling for any single image
const FETCH_TIMEOUT_MS = 15_000;

type UploadBody = {
  imageUrl?: string;
  storyId?: string;
  imageIndex?: number;
  anonToken?: string;
};

function isAllowedHost(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:') return false;
    return u.hostname === env.allowedImageHost;
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  let body: UploadBody;
  try {
    body = (await req.json()) as UploadBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { imageUrl, storyId, imageIndex, anonToken } = body;

  if (!imageUrl || !storyId || typeof imageIndex !== 'number') {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }
  if (!isAllowedHost(imageUrl)) {
    return NextResponse.json(
      { error: `Image host not allowed. Expected ${env.allowedImageHost}.` },
      { status: 400 },
    );
  }
  if (imageIndex < 0 || imageIndex > 999 || !Number.isInteger(imageIndex)) {
    return NextResponse.json({ error: 'Invalid imageIndex' }, { status: 400 });
  }

  // ── Authorize: must be the story owner OR hold the anon token for an anon story ──
  const auth = req.headers.get('authorization');
  const accessToken = auth ? auth.replace(/^Bearer\s+/i, '') : null;

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server config error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: story, error: storyErr } = await admin
    .from('stories')
    .select('user_id, is_anonymous, anon_token')
    .eq('story_id', storyId)
    .maybeSingle();

  if (storyErr) {
    return NextResponse.json({ error: storyErr.message }, { status: 500 });
  }
  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  let authorized = false;
  if (story.is_anonymous) {
    authorized = !!anonToken && story.anon_token === anonToken;
  } else if (accessToken) {
    const supa = getSupabaseServer(accessToken);
    const { data: userResp } = await supa.auth.getUser();
    authorized = userResp?.user?.id === story.user_id;
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Fetch image with timeout & size cap ──
  let imageResponse: Response;
  try {
    imageResponse = await fetchWithTimeout(imageUrl, FETCH_TIMEOUT_MS);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fetch failed';
    return NextResponse.json({ error: `Failed to fetch image: ${message}` }, { status: 502 });
  }

  if (!imageResponse.ok) {
    return NextResponse.json(
      { error: `Failed to fetch image: ${imageResponse.status}` },
      { status: 502 },
    );
  }

  const contentLength = Number(imageResponse.headers.get('content-length') ?? '0');
  if (contentLength && contentLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large' }, { status: 413 });
  }

  const arrayBuffer = await imageResponse.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large' }, { status: 413 });
  }
  const buffer = Buffer.from(arrayBuffer);

  // ── Upload to Storage as the story owner ──
  const fileName = `${storyId}/${imageIndex}.png`;
  const { error: uploadErr } = await admin.storage
    .from('story-images')
    .upload(fileName, buffer, { contentType: 'image/png', upsert: true });
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from('story-images').getPublicUrl(fileName);
  return NextResponse.json({ publicUrl: urlData.publicUrl });
}
