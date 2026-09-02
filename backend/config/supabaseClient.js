// ==========================================================
// config/supabaseClient.js
// Creates a single shared Supabase client used by every route.
// Unlike MongoDB, Supabase talks to the database over a REST
// API (PostgREST), so there is no "connect" step here — this
// client is just configured once and reused for every query.
// ==========================================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Fail fast with a clear message instead of a confusing crash later
  console.error(
    'Missing SUPABASE_URL or SUPABASE_ANON_KEY. Check your .env file.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
