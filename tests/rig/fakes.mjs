// Stand-ins for the hosted services DreamWeaver talks to, for end-to-end tests:
//
//   Supabase gateway  /rest/v1    -> proxied to a real PostgREST (real Postgres, real RLS)
//                     /auth/v1    -> a small in-memory imitation of Supabase Auth
//                     /storage/v1 -> an in-memory imitation of Supabase Storage
//   OpenAI            /v1/chat/completions, /v1/images/generations, /v1/moderations
//
// Test-only. Nothing here is used by the app itself.

import http from 'node:http';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

// ── JWT (HS256), the same scheme Supabase projects use by default ────────────
const b64url = (input) => Buffer.from(input).toString('base64url');

export function signJwt(payload, secret) {
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

function verifyJwt(token, secret) {
  const [head, body, sig] = (token ?? '').split('.');
  if (!head || !body || !sig) return null;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${head}.${body}`)
    .digest('base64url');
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null;
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  return payload.exp && payload.exp < Date.now() / 1000 ? null : payload;
}

// ── helpers ──────────────────────────────────────────────────────────────────
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD',
  'access-control-expose-headers': '*',
};

function sendJson(res, status, data, extra = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...CORS, ...extra });
  res.end(JSON.stringify(data));
}

const bearer = (req) => /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? '')?.[1] ?? null;

/** A small solid-colour PNG whose hue depends on `seed`, so pictures are tellable apart. */
function png(seed) {
  const size = 96;
  const hue = (seed * 67) % 360;
  const [r, g, b] = hslToRgb(hue / 360, 0.55, 0.55);
  const row = Buffer.alloc(1 + size * 3);
  for (let x = 0; x < size; x++) row.set([r, g, b], 1 + x * 3);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function hslToRgb(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    return Math.round(255 * (l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

// ── Supabase gateway ─────────────────────────────────────────────────────────
export function startSupabase({ port, postgrestPort, jwtSecret, serviceKey }) {
  const publicUrl = `http://127.0.0.1:${port}`;
  const users = new Map(); // id -> { id, email, password, is_anonymous, created_at }
  const refreshTokens = new Map(); // token -> user id
  const objects = new Map(); // "bucket/path" -> { bytes, contentType }

  const userJson = (u) => ({
    id: u.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: u.email ?? '',
    is_anonymous: u.is_anonymous,
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: u.created_at,
  });

  const session = (u) => {
    const expiresIn = 3600;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    const refresh = crypto.randomBytes(16).toString('hex');
    refreshTokens.set(refresh, u.id);
    return {
      access_token: signJwt(
        {
          sub: u.id,
          role: 'authenticated',
          aud: 'authenticated',
          is_anonymous: u.is_anonymous,
          exp: expiresAt,
        },
        jwtSecret,
      ),
      token_type: 'bearer',
      expires_in: expiresIn,
      expires_at: expiresAt,
      refresh_token: refresh,
      user: userJson(u),
    };
  };

  async function createUser(email, password, isAnonymous) {
    // auth.users lives in Postgres so stories.user_id can reference it.
    const res = await fetch(`http://127.0.0.1:${postgrestPort}/rpc/rig_create_user`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ p_email: email, p_is_anonymous: isAnonymous }),
    });
    if (!res.ok) throw new Error(`rig_create_user failed: ${await res.text()}`);
    const user = {
      id: await res.json(),
      email,
      password,
      is_anonymous: isAnonymous,
      created_at: new Date().toISOString(),
    };
    users.set(user.id, user);
    return user;
  }

  const authError = (res, status, msg) =>
    sendJson(res, status, { code: status, error_code: 'rig', msg });

  async function auth(req, res, path, query) {
    const body = req.method === 'GET' ? {} : JSON.parse((await readBody(req)).toString() || '{}');

    if (path === '/signup' && req.method === 'POST') {
      if (!body.email) return sendJson(res, 200, session(await createUser(null, null, true)));
      if ([...users.values()].some((u) => u.email === body.email)) {
        return authError(res, 422, 'User already registered');
      }
      return sendJson(res, 200, session(await createUser(body.email, body.password, false)));
    }

    if (path === '/token' && query.get('grant_type') === 'password') {
      const user = [...users.values()].find(
        (u) => u.email === body.email && u.password === body.password,
      );
      return user
        ? sendJson(res, 200, session(user))
        : authError(res, 400, 'Invalid login credentials');
    }

    if (path === '/token' && query.get('grant_type') === 'refresh_token') {
      const user = users.get(refreshTokens.get(body.refresh_token));
      return user
        ? sendJson(res, 200, session(user))
        : authError(res, 400, 'Invalid Refresh Token');
    }

    if (path === '/user') {
      const claims = verifyJwt(bearer(req), jwtSecret);
      const user = claims && users.get(claims.sub);
      if (!user) return authError(res, 401, 'invalid JWT');
      if (req.method === 'PUT' && body.password) user.password = body.password;
      return sendJson(res, 200, userJson(user));
    }

    if (path === '/logout') {
      res.writeHead(204, CORS);
      return res.end();
    }
    if (path === '/recover') return sendJson(res, 200, {});

    return authError(res, 404, `rig: unhandled auth route ${req.method} ${path}`);
  }

  async function storage(req, res, path) {
    const isService = verifyJwt(bearer(req), jwtSecret)?.role === 'service_role';

    const publicMatch = /^\/object\/public\/(.+)$/.exec(path);
    if (publicMatch && (req.method === 'GET' || req.method === 'HEAD')) {
      const object = objects.get(decodeURIComponent(publicMatch[1]));
      if (!object) return sendJson(res, 404, { error: 'not_found' });
      res.writeHead(200, {
        'content-type': object.contentType,
        'cache-control': 'no-store',
        ...CORS,
      });
      return res.end(req.method === 'HEAD' ? undefined : object.bytes);
    }

    // Everything below is a write or a listing: the app only does these server-side.
    if (!isService)
      return sendJson(res, 403, {
        statusCode: '403',
        error: 'Unauthorized',
        message: 'rig: service role required',
      });

    const readMatch = /^\/object\/(?!list\/|move$)(.+)$/.exec(path);
    if (readMatch && req.method === 'GET') {
      const object = objects.get(decodeURIComponent(readMatch[1]));
      if (!object)
        return sendJson(res, 404, {
          statusCode: '404',
          error: 'not_found',
          message: 'Object not found',
        });
      res.writeHead(200, { 'content-type': object.contentType, ...CORS });
      return res.end(object.bytes);
    }

    const listMatch = /^\/object\/list\/([^/]+)$/.exec(path);
    if (listMatch && req.method === 'POST') {
      const { prefix = '' } = JSON.parse((await readBody(req)).toString() || '{}');
      const base = `${listMatch[1]}/${prefix}`.replace(/\/?$/, '/');
      const names = [...objects.keys()]
        .filter((k) => k.startsWith(base))
        .map((k) => k.slice(base.length));
      return sendJson(
        res,
        200,
        names.map((name) => ({ name, id: name })),
      );
    }

    if (path === '/object/move' && req.method === 'POST') {
      const { bucketId, sourceKey, destinationKey } = JSON.parse((await readBody(req)).toString());
      const object = objects.get(`${bucketId}/${sourceKey}`);
      if (!object)
        return sendJson(res, 404, {
          statusCode: '404',
          error: 'not_found',
          message: 'Object not found',
        });
      objects.delete(`${bucketId}/${sourceKey}`);
      objects.set(`${bucketId}/${destinationKey}`, object);
      return sendJson(res, 200, { message: 'Successfully moved' });
    }

    const bucketMatch = /^\/object\/([^/]+)$/.exec(path);
    if (bucketMatch && req.method === 'DELETE') {
      const { prefixes = [] } = JSON.parse((await readBody(req)).toString() || '{}');
      const removed = prefixes.filter((p) => objects.delete(`${bucketMatch[1]}/${p}`));
      return sendJson(
        res,
        200,
        removed.map((name) => ({ name })),
      );
    }

    const objectMatch = /^\/object\/(.+)$/.exec(path);
    if (objectMatch && (req.method === 'POST' || req.method === 'PUT')) {
      const key = decodeURIComponent(objectMatch[1]);
      objects.set(key, {
        bytes: await readBody(req),
        contentType: req.headers['content-type'] ?? 'application/octet-stream',
      });
      return sendJson(res, 200, { Key: key, Id: key });
    }

    return sendJson(res, 404, { error: `rig: unhandled storage route ${req.method} ${path}` });
  }

  async function rest(req, res, pathAndQuery) {
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    delete headers['content-length'];
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req);
    const upstream = await fetch(`http://127.0.0.1:${postgrestPort}${pathAndQuery}`, {
      method: req.method,
      headers,
      body,
    });
    const out = Object.fromEntries(upstream.headers);
    delete out['transfer-encoding'];
    delete out['content-encoding'];
    delete out['content-length'];
    res.writeHead(upstream.status, { ...out, ...CORS });
    res.end(Buffer.from(await upstream.arrayBuffer()));
  }

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS);
        return res.end();
      }
      const url = new URL(req.url, publicUrl);
      if (url.pathname.startsWith('/rest/v1'))
        return await rest(req, res, req.url.slice('/rest/v1'.length));
      if (url.pathname.startsWith('/auth/v1')) {
        return await auth(req, res, url.pathname.slice('/auth/v1'.length), url.searchParams);
      }
      if (url.pathname.startsWith('/storage/v1')) {
        return await storage(req, res, url.pathname.slice('/storage/v1'.length));
      }
      if (url.pathname === '/__rig/storage') return sendJson(res, 200, [...objects.keys()]);
      sendJson(res, 404, { error: `rig: unhandled ${req.method} ${url.pathname}` });
    } catch (err) {
      console.error('[rig supabase]', err);
      sendJson(res, 500, { error: String(err) });
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

// ── OpenAI ───────────────────────────────────────────────────────────────────
export function startOpenAI({ port }) {
  const log = []; // every request, for tests to inspect
  const failedOnce = new Set();
  let images = 0;

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      if (url.pathname === '/__rig/requests') return sendJson(res, 200, log);

      const body = JSON.parse((await readBody(req)).toString() || '{}');
      log.push({ path: url.pathname, body });

      if (url.pathname === '/v1/moderations') {
        const flagged = JSON.stringify(body.input).includes('FLAGME');
        return sendJson(res, 200, {
          id: 'modr-rig',
          model: body.model,
          results: [{ flagged, categories: {}, category_scores: {} }],
        });
      }

      if (url.pathname === '/v1/images/generations') {
        if (body.prompt.includes('BUSYIMG') && !failedOnce.has(body.prompt)) {
          failedOnce.add(body.prompt);
          return sendJson(
            res,
            429,
            {
              error: {
                message: 'rig: rate limited',
                type: 'rate_limit_error',
                code: 'rate_limit_exceeded',
              },
            },
            { 'retry-after': '1' },
          );
        }
        if (body.prompt.includes('QUOTAIMG')) {
          return sendJson(res, 429, {
            error: {
              message:
                'You exceeded your current quota, please check your plan and billing details.',
              type: 'insufficient_quota',
              code: 'insufficient_quota',
            },
          });
        }
        if (body.prompt.includes('FAILIMG') && !failedOnce.has(body.prompt)) {
          failedOnce.add(body.prompt);
          return sendJson(res, 400, {
            error: { message: 'rig: image refused', type: 'invalid_request_error' },
          });
        }
        images += 1;
        return sendJson(res, 200, {
          created: 0,
          data: [{ b64_json: png(images).toString('base64') }],
        });
      }

      if (url.pathname === '/v1/chat/completions') {
        const lastUser = [...body.messages].reverse().find((m) => m.role === 'user')?.content ?? '';

        if (!body.stream) {
          return sendJson(res, 200, {
            id: 'chatcmpl-rig',
            object: 'chat.completion',
            choices: [
              {
                index: 0,
                finish_reason: 'stop',
                message: {
                  role: 'assistant',
                  // The character creator asks for a tidy look; anything else is a setting idea.
                  content: !body.messages[0].content.includes('character sheet')
                    ? 'A clockwork garden beneath a paper moon'
                    : lastUser.includes('EMPTYLOOK')
                      ? '' // the model used its whole allowance thinking
                      : `Distilled look: ${lastUser.split('Description: ')[1] ?? lastUser}`.slice(
                          0,
                          300,
                        ),
                },
              },
            ],
          });
        }
        if (lastUser.includes('FAILTURN')) {
          return sendJson(res, 500, {
            error: { message: 'rig: storyteller down', type: 'server_error' },
          });
        }

        const sceneNumber = body.messages.filter((m) => m.role === 'assistant').length + 1;
        const isOpening = lastUser.startsWith('Begin the story');
        const isEnding = lastUser.startsWith('(The reader has decided');
        // Quotes, a newline and an emoji exercise the streaming JSON reader.
        // The bible updates let tests check consistency: the opening introduces a
        // cast, "Look around" finds a key, "Wait quietly" loses it, and every later
        // turn tries (and must fail) to change how the main character looks.
        const turn = JSON.stringify({
          narration: isOpening
            ? `Scene ${sceneNumber}: the adventure begins. A sign reads "Welcome, traveller" \u2728\nThe path forks ahead.`
            : isEnding
              ? `Scene ${sceneNumber}: and so the adventure came to a gentle close.`
              : `Scene ${sceneNumber}: you chose to ${lastUser}. The story "continues" \u2728\nSomething stirs nearby.`,
          choices: [
            `Go north (${sceneNumber})`,
            `Look around (${sceneNumber})`,
            `Wait quietly (${sceneNumber})`,
          ],
          imagePrompt: `Illustration of scene ${sceneNumber}: ${lastUser}`,
          featuring: isOpening ? ['You', 'The Lighthouse'] : ['You', 'Old Gull'],
          summary: `Summary after scene ${sceneNumber}.`,
          newCharacters: isOpening
            ? [
                {
                  name: 'You',
                  role: 'the traveller',
                  appearance: 'a small traveller in a yellow raincoat and red scarf',
                },
                {
                  name: 'Old Gull',
                  role: 'lighthouse keeper',
                  appearance: 'a grey gull wearing a tiny blue cap',
                },
              ]
            : [
                {
                  name: 'you',
                  role: 'the traveller',
                  appearance: 'a tall wizard in a purple cloak',
                },
              ],
          newPlaces: isOpening
            ? [{ name: 'The Lighthouse', appearance: 'a white tower with a green door' }]
            : [],
          itemsGained: lastUser.includes('Look around')
            ? [{ name: 'Brass key', description: 'small and cold' }]
            : [],
          itemsLost: lastUser.includes('Wait quietly') ? ['brass key'] : [],
          threads: [`Find the lamp (${sceneNumber})`],
        });

        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store' });
        const chunk = (delta, finish = null) =>
          res.write(
            `data: ${JSON.stringify({ id: 'chatcmpl-rig', object: 'chat.completion.chunk', created: 0, model: body.model, choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`,
          );
        chunk({ role: 'assistant', content: '' });
        // Odd-sized pieces so escape sequences get split across chunks.
        for (let i = 0; i < turn.length; i += 7) {
          chunk({ content: turn.slice(i, i + 7) });
          await new Promise((r) => setTimeout(r, 4));
        }
        chunk({}, 'stop');
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      sendJson(res, 404, { error: { message: `rig: unhandled ${url.pathname}` } });
    } catch (err) {
      console.error('[rig openai]', err);
      sendJson(res, 500, { error: { message: String(err) } });
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}
