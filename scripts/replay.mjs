#!/usr/bin/env node
// Plays stories against a running DreamWeaver (local or deployed) with a fixed
// choice policy and writes the transcripts to a Markdown file, so narrator or
// model changes can be compared side by side. It writes text only: no
// illustrations are requested, so a run costs a fraction of a cent.
//
//   APP_URL=https://your-preview.vercel.app \
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//   node scripts/replay.mjs --turns 10 --level family --out before.md
//
// Options:
//   --setting "..."   may be repeated; defaults to a small fixed set of premises
//   --level           early | family | advanced        (default family)
//   --turns N         scenes per story, opening included (default 8)
//   --policy          first | rotate | last             (default rotate)
//   --end             finish each story with the "bring to a close" page
//   --out FILE        where to write the transcript     (default replay.md)
// Sign in as a member (higher daily limit) with DW_EMAIL and DW_PASSWORD;
// otherwise the script plays as a guest.

import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const all = (name) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []));
const one = (name, fallback) => all(name)[0] ?? fallback;
const flag = (name) => args.includes(`--${name}`);

const appUrl = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const settings = all('setting').length
  ? all('setting')
  : [
      'A lighthouse at the edge of the world, tended by a talking gull',
      'A night market that only appears when it rains',
      'A library where the books come alive after midnight',
    ];
const level = one('level', 'family');
const turns = Number(one('turns', '8'));
const policy = one('policy', 'rotate');
const out = one('out', 'replay.md');

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
const { data: auth, error: authError } =
  process.env.DW_EMAIL && process.env.DW_PASSWORD
    ? await supabase.auth.signInWithPassword({
        email: process.env.DW_EMAIL,
        password: process.env.DW_PASSWORD,
      })
    : await supabase.auth.signInAnonymously();
if (authError || !auth.session) {
  console.error('Could not sign in:', authError?.message ?? 'no session');
  process.exit(1);
}
const headers = {
  Authorization: `Bearer ${auth.session.access_token}`,
  'Content-Type': 'application/json',
};

async function api(path, body) {
  const res = await fetch(`${appUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(`${path}: ${res.status} ${detail.error ?? ''}`);
  }
  return res;
}

/** Takes one turn and returns the saved scene plus whether the narrator thinks it could end. */
async function turn(storyId, body) {
  const res = await api(`/api/stories/${storyId}/turns`, body);
  let result = null;
  for (const line of (await res.text()).split('\n')) {
    if (!line.trim()) continue;
    const event = JSON.parse(line);
    if (event.type === 'error') throw new Error(event.message);
    if (event.type === 'scene') result = event;
  }
  if (!result) throw new Error('The turn returned no scene.');
  return result;
}

const choose = (choices, index) =>
  policy === 'first'
    ? choices[0]
    : policy === 'last'
      ? choices[choices.length - 1]
      : choices[index % choices.length];

const report = [
  `# DreamWeaver replay`,
  '',
  `App: ${appUrl} · level: ${level} · policy: ${policy}`,
  '',
];
const stats = [];

for (const setting of settings) {
  console.log(`\n▶ ${setting}`);
  const { id } = await (await api('/api/stories', { setting, readingLevel: level })).json();
  report.push(`## ${setting}`, '');

  let position = 0;
  let event = await turn(id, { action: null, expectedPosition: 0 });
  let openEndings = 0;
  let firstReady = null;
  const said = [];

  for (;;) {
    const { scene } = event;
    position += 1;
    said.push(scene.narration);
    if (/[?…]$|\?["”']?$/.test(scene.narration.trim())) openEndings += 1;
    if (event.readyToEnd && firstReady === null) firstReady = position;
    report.push(
      `**Scene ${position}**${scene.action ? ` — _${scene.action}_` : ''}`,
      '',
      scene.narration,
      '',
    );
    if (scene.choices.length) report.push(...scene.choices.map((c) => `- ${c}`), '');
    console.log(`  scene ${position}: ${scene.narration.slice(0, 80).replace(/\s+/g, ' ')}…`);

    if (position >= turns || scene.choices.length === 0) break;
    event = await turn(id, { action: choose(scene.choices, position), expectedPosition: position });
  }

  if (flag('end') && !event.finished) {
    event = await turn(id, { action: null, expectedPosition: position, ending: true });
    report.push('**Final page**', '', event.scene.narration, '');
    said.push(event.scene.narration);
  }

  const words = said.join(' ').split(/\s+/).length;
  stats.push({ setting, scenes: said.length, words, openEndings, firstReady });
  report.push(
    `_${said.length} scenes, ${Math.round(words / said.length)} words per scene, ` +
      `${openEndings} ended on a question, narrator first said "ready to end" at scene ${firstReady ?? 'never'}._`,
    '',
    `Story: ${appUrl}/story/${id}`,
    '',
  );
}

writeFileSync(out, report.join('\n'));
console.log(`\nWrote ${out}`);
console.table(stats);
