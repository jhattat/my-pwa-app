import { createHash } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

const testName = process.argv[2];
const errorMessage = process.argv[3];

if (!testName || !errorMessage) {
  console.error('Usage: node report-error.mjs "<test_name>" "<error_message>"');
  process.exit(1);
}

function normalizeError(msg) {
  return msg
    .replace(/\d+ms/g, '')           // remove timing
    .replace(/:\d+:\d+/g, '')        // remove line:col references
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim();
}

function computeFingerprint(name, msg) {
  return createHash('md5').update(name + '::' + normalizeError(msg)).digest('hex');
}

async function supabaseRequest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase error ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const fingerprint = computeFingerprint(testName, errorMessage);

// Check if this error already exists
const existing = await supabaseRequest(
  `test_errors?fingerprint=eq.${fingerprint}&limit=1`
);

if (existing && existing.length > 0) {
  const record = existing[0];
  const newCount = record.occurrences + 1;

  await supabaseRequest(
    `test_errors?id=eq.${record.id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        occurrences: newCount,
        last_seen_at: new Date().toISOString(),
      }),
    }
  );

  console.log(`KNOWN regression: "${testName}" (seen ${newCount} times)`);
  process.exit(0);
}

// New error
await supabaseRequest(
  'test_errors',
  {
    method: 'POST',
    body: JSON.stringify({
      test_name: testName,
      error_message: errorMessage,
      fingerprint,
    }),
  }
);

console.log(`NEW error detected: "${testName}"`);
