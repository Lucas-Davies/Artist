// assets/auth.js
// Client-side auth for GitHub Pages using Supabase v2
// - Handles: login, signup, logout, session restore, UI swap (guest/member)
// - Safe to use on static hosting. Your anon key is meant to be public.
// - Fill in SUPABASE_URL and SUPABASE_ANON_KEY below.

(function () {
  // =========  CONFIG — REPLACE THESE  =========
  const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // anon public key
  // ============================================

  // Lazy-load supabase-js if not present
  function loadSupabase() {
    return new Promise((resolve, reject) => {
      if (window.supabase) return resolve(window.supabase);
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = () => resolve(window.supabase);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Message area (created on the fly)
  function ensureMsgArea() {
    let m = $('#authMsg');
    if (!m) {
      m = document.createElement('div');
      m.id = 'authMsg';
      m.style.margin = '12px 0';
      m.style.fontSize = '14px';
      m.style.padding = '10px';
      m.style.borderRadius = '8px';
      m.style.display = 'none';
      const form = $('form[onsubmit="authLogin(event)"]');
      form && form.parentNode.insertBefore(m, form.nextSibling);
    }
    return m;
  }
  function showMsg(text, type = 'err') {
    const m = ensureMsgArea();
    m.textContent = text;
    m.style.display = 'block';
    if (type === 'ok') {
      m.style.color = '#e7fff0';
      m.style.background = 'rgba(50,215,75,.08)';
      m.style.border = '1px solid rgba(50,215,75,.45)';
    } else {
      m.style.color = '#fff1f1';
      m.style.background = 'rgba(255,69,58,.10)';
      m.style.border = '1px solid rgba(255,69,58,.45)';
    }
  }
  function clearMsg() {
    const m = $('#authMsg');
    if (m) m.style.display = 'none';
  }

  // UI sections
  const guestBlocks = $$('[data-guest]');
  const memberBlocks = $$('[data-member]');
  const whoami = $('#whoami');
  const year = $('#y');

  if (year) year.textContent = new Date().getFullYear();

  // Expose handlers globally for your inline HTML attributes
  window.authLogin = async function authLogin(ev) {
    ev.preventDefault();
    clearMsg();
    const emailEl = $('#loginEmail');
    const passEl = $('#loginPass');
    const email = (emailEl?.value || '').trim();
    const password = (passEl?.value || '').trim();

    if (!email || !password) {
      showMsg('Please enter both email and password.');
      return;
    }

    try {
      const supabase = await boot();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      showMsg('Welcome back — signed in.', 'ok');
      await refreshUI(supabase);
    } catch (err) {
      showMsg(humaniseAuthError(err));
    }
  };

  window.authSignup = async function authSignup(_ev) {
    clearMsg();
    const email = ($('#loginEmail')?.value || '').trim();
    const password = ($('#loginPass')?.value || '').trim();

    if (!email || !password) {
      showMsg('Please enter an email and a password to sign up.');
      return;
    }
    if (password.length < 8) {
      showMsg('Password must be at least 8 characters.');
      return;
    }

    try {
      const supabase = await boot();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: location.origin + '/member.html', // adjust if desired
          data: { role: 'regular' } // store a default role in user metadata
        }
      });
      if (error) throw error;

      // Supabase may require email confirmation depending on your settings
      if (data.user?.identities?.length === 0) {
        showMsg('This email is already registered. Try logging in instead.');
        return;
      }
      showMsg('Check your inbox to confirm your email. Once confirmed, log in.', 'ok');
    } catch (err) {
      showMsg(humaniseAuthError(err));
    }
  };

  window.authLogout = async function authLogout() {
    clearMsg();
    try {
      const supabase = await boot();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showMsg('Signed out.', 'ok');
      await refreshUI(supabase);
    } catch (err) {
      showMsg('Could not sign out. Please try again.');
      console.error(err);
    }
  };

  // Map Supabase error codes/messages to friendlier text
  function humaniseAuthError(err) {
    const msg = (err && (err.message || err.error_description)) || String(err);
    if (/Invalid login credentials/i.test(msg)) return 'Invalid email or password.';
    if (/Email rate limit|too many requests/i.test(msg)) return 'Too many attempts. Please try again shortly.';
    if (/Email not confirmed/i.test(msg)) return 'Please confirm your email first (check your inbox).';
    return msg;
  }

  // Initialize Supabase client (singleton)
  let _client = null;
  async function boot() {
    if (_client) return _client;
    const supabaseLib = await loadSupabase();
    _client = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    // Keep UI synced with auth changes
    _client.auth.onAuthStateChange((_event, _session) => {
      refreshUI(_client);
    });
    // Initial UI refresh
    await refreshUI(_client);
    return _client;
  }

  async function refreshUI(supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;

      if (user) {
        // Show member view
        guestBlocks.forEach(el => (el.style.display = 'none'));
        memberBlocks.forEach(el => (el.style.display = 'block'));
        if (whoami) {
          const name = user.user_metadata?.name || user.email || 'Member';
          whoami.textContent = name;
        }
      } else {
        // Show guest view
        guestBlocks.forEach(el => (el.style.display = 'block'));
        memberBlocks.forEach(el => (el.style.display = 'none'));
      }
    } catch (e) {
      console.warn('UI refresh failed', e);
    }
  }

  // Kick off
  boot().catch((e) => {
    console.error('Supabase failed to init:', e);
    showMsg('Auth initialisation failed. Check your keys and internet connection.');
  });
})();
