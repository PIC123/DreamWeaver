/** @type {import('next').NextConfig} */

// Accept the names Supabase and the old CRA build used, so an existing Vercel
// project keeps working. `env` values are inlined at build time, which is what
// makes them visible to the browser.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.REACT_APP_SUPABASE_URL ?? '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.REACT_APP_SUPABASE_ANON_KEY ??
  '';

function origin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

const supabaseOrigin = origin(supabaseUrl);
const supabaseWs = supabaseOrigin.replace(/^http/, 'ws');
const isDev = process.env.NODE_ENV !== 'production';

// Vercel adds a comment toolbar to preview deployments; let it load there only.
const preview = process.env.VERCEL_ENV === 'preview';
const live = preview ? ' https://vercel.live' : '';

const csp = [
  "default-src 'self'",
  // Next.js injects small inline bootstrap scripts; dev mode also needs eval for fast refresh.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}${live}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}${live}${preview ? ' https://vercel.com' : ''}`.trim(),
  `font-src 'self' data:${live}${preview ? ' https://assets.vercel.com' : ''}`,
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}${live}${preview ? ' wss://ws-us3.pusher.com' : ''}`.trim(),
  ...(preview ? ['frame-src https://vercel.live'] : []),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
