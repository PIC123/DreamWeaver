/**
 * Reads the value of a top-level string field out of JSON that is still being
 * streamed, returning as much of it as has safely arrived so far.
 * Returns null until the field's opening quote has been seen.
 */
export function readPartialString(json: string, key: string): string | null {
  const marker = `"${key}"`;
  const keyAt = json.indexOf(marker);
  if (keyAt === -1) return null;

  let i = keyAt + marker.length;
  while (i < json.length && /\s/.test(json[i])) i++;
  if (json[i] !== ':') return null;
  i++;
  while (i < json.length && /\s/.test(json[i])) i++;
  if (json[i] !== '"') return null;
  i++;

  let out = '';
  while (i < json.length) {
    const ch = json[i];
    if (ch === '"') return out;
    if (ch !== '\\') {
      out += ch;
      i++;
      continue;
    }
    // An escape sequence: only decode it once it has fully arrived.
    const next = json[i + 1];
    if (next === undefined) return out;
    if (next === 'u') {
      const hex = json.slice(i + 2, i + 6);
      if (hex.length < 4) return out;
      const code = parseInt(hex, 16);
      // Hold back a lone high surrogate until its partner arrives.
      if (code >= 0xd800 && code <= 0xdbff) {
        const low = json.slice(i + 6, i + 12);
        if (low.length < 6) return out;
        out += String.fromCharCode(code, parseInt(low.slice(2), 16));
        i += 12;
        continue;
      }
      out += String.fromCharCode(code);
      i += 6;
      continue;
    }
    const simple: Record<string, string> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f' };
    out += simple[next] ?? next;
    i += 2;
  }
  return out;
}
