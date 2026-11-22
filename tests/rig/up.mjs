// Starts everything the end-to-end tests need and keeps it running:
// a fresh Postgres database with the real schema, PostgREST, the fake Supabase
// and OpenAI services, and a production build of the app wired to them.
//
// Needs: `psql` and a `postgrest` binary on PATH (or POSTGREST_BIN), and a
// Postgres superuser connection in PGADMIN_URL.

import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { signJwt, startOpenAI, startSupabase } from './fakes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const adminUrl =
  process.env.PGADMIN_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';
const dbName = 'dw_e2e';
const dbUrl = (user, password) => {
  const url = new URL(adminUrl);
  url.username = user;
  url.password = password;
  url.pathname = `/${dbName}`;
  return url.toString();
};
const adminDbUrl = (() => {
  const url = new URL(adminUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
})();

const ports = { app: 3210, supabase: 54321, postgrest: 54323, openai: 54322 };
const jwtSecret = 'rig-secret-rig-secret-rig-secret-rig-secret';
const farFuture = Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 3600;
const anonKey = signJwt({ role: 'anon', exp: farFuture }, jwtSecret);
const serviceKey = signJwt({ role: 'service_role', exp: farFuture }, jwtSecret);

const psql = (url, ...args) =>
  execFileSync('psql', ['-v', 'ON_ERROR_STOP=1', '-q', '-o', '/dev/null', url, ...args], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'pipe'],
  });

console.log('[rig] preparing database');
psql(
  adminUrl,
  '-c',
  `drop database if exists ${dbName} with (force)`,
  '-c',
  `create database ${dbName}`,
);
psql(
  adminDbUrl,
  '-f',
  'tests/rig/supabase-stub.sql',
  '-f',
  'supabase/schema.sql',
  '-f',
  'tests/rig/seed.sql',
);

const children = [];
function run(name, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  child.on('exit', (code) => {
    if (code) {
      console.error(`[rig] ${name} exited with code ${code}`);
      shutdown(1);
    }
  });
  children.push(child);
  return child;
}
function shutdown(code = 0) {
  for (const child of children) child.kill('SIGTERM');
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function waitFor(url, label) {
  for (let i = 0; i < 120; i++) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`[rig] ${label} did not start`);
}

run('postgrest', process.env.POSTGREST_BIN ?? 'postgrest', [], {
  PGRST_DB_URI: dbUrl('authenticator', 'authenticator'),
  PGRST_DB_SCHEMAS: 'public',
  PGRST_DB_ANON_ROLE: 'anon',
  PGRST_JWT_SECRET: jwtSecret,
  PGRST_SERVER_HOST: '127.0.0.1',
  PGRST_SERVER_PORT: String(ports.postgrest),
  PGRST_LOG_LEVEL: 'error',
});
await waitFor(`http://127.0.0.1:${ports.postgrest}/`, 'PostgREST');

await startSupabase({
  port: ports.supabase,
  postgrestPort: ports.postgrest,
  jwtSecret,
  serviceKey,
});
await startOpenAI({ port: ports.openai });

const appEnv = {
  NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${ports.supabase}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  OPENAI_API_KEY: 'sk-rig',
  OPENAI_BASE_URL: `http://127.0.0.1:${ports.openai}/v1`,
  QUOTA_GUEST_TURNS_PER_DAY: '6',
  NEXT_TELEMETRY_DISABLED: '1',
};

if (process.env.RIG_SKIP_BUILD !== '1') {
  console.log('[rig] building the app');
  execFileSync('npx', ['next', 'build'], {
    cwd: root,
    env: { ...process.env, ...appEnv },
    stdio: 'inherit',
  });
}
run('next', 'npx', ['next', 'start', '-H', '127.0.0.1', '-p', String(ports.app)], appEnv);
await waitFor(`http://127.0.0.1:${ports.app}/`, 'the app');
console.log(`[rig] ready on http://127.0.0.1:${ports.app}`);
