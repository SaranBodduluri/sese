/**
 * Quick connectivity check for Gemini + ElevenLabs (reads .env.local, prints only OK/FAIL).
 * Run: node scripts/quick-api-test.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const raw = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  env[k] = v;
}

async function testGemini() {
  const key = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  if (!key) {
    console.log('GEMINI: SKIP (no GEMINI_API_KEY)');
    return;
  }
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }],
    }),
  });
  const text = await r.text();
  if (!r.ok) {
    console.log('GEMINI: FAIL', r.status, text.slice(0, 300));
    return;
  }
  console.log('GEMINI: OK', '(HTTP', r.status + ')');
}

async function testElevenLabsUser() {
  const key = env.ELEVENLABS_API_KEY;
  if (!key) {
    console.log('ELEVENLABS_USER: SKIP (no ELEVENLABS_API_KEY)');
    return;
  }
  const r = await fetch('https://api.elevenlabs.io/v1/user', {
    headers: { 'xi-api-key': key },
  });
  const text = await r.text();
  if (!r.ok) {
    console.log('ELEVENLABS_USER: SKIP/FAIL', r.status, '(TTS may still work)', text.slice(0, 120));
    return;
  }
  console.log('ELEVENLABS_USER: OK', '(HTTP', r.status + ')');
}

/** What the app actually uses: text-to-speech endpoint. */
async function testElevenLabsTTS() {
  const key = env.ELEVENLABS_API_KEY;
  if (!key) {
    console.log('ELEVENLABS_TTS: SKIP');
    return;
  }
  const voiceId = env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
  const modelId = env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': key,
    },
    body: JSON.stringify({
      text: 'Hi.',
      model_id: modelId,
    }),
  });
  const ct = r.headers.get('content-type') || '';
  if (!r.ok) {
    const err = await r.text();
    console.log('ELEVENLABS_TTS: FAIL', r.status, err.slice(0, 300));
    return;
  }
  const buf = await r.arrayBuffer();
  console.log('ELEVENLABS_TTS: OK', '(HTTP', r.status + ', bytes:', buf.byteLength + ', type:', ct + ')');
}

await testGemini();
await testElevenLabsUser();
await testElevenLabsTTS();
