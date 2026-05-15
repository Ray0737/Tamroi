// Reads credentials from js/env.js (gitignored).
// Falls back to placeholder strings so the app loads without crashing.
const _env = window.ENV || {};

window.APP_CONFIG = {
  supabaseUrl:     _env.SUPABASE_URL      || 'YOUR_SUPABASE_URL',
  supabaseAnonKey: _env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
  appName:         'Siam Echo',
  appVersion:      '0.6.0',
};
