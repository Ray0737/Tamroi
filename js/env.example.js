// ── HOW TO SET UP SUPABASE CREDENTIALS ────────────────
// 1. Copy this file → js/env.js     (js/env.js is gitignored)
// 2. Create a project at https://supabase.com
// 3. Go to Settings → API
// 4. Copy "Project URL" and "anon public" key into js/env.js
//
// OAuth redirect URLs to whitelist (Authentication → URL Configuration):
//   http://127.0.0.1:5500/**
//   http://localhost:5500/**
// ─────────────────────────────────────────────────────
window.ENV = {
  SUPABASE_URL:     'https://your-project-id.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key-here',
};
