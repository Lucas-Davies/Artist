// assets/auth.js
// Supabase v2 client-side auth for GitHub Pages
// Exposes: authLogin(event), authSignup(event), authLogout(), authResetPassword()

(function () {
  // ====== SET THESE TWO VALUES ======
  const SUPABASE_URL = 'https://YOUR-REF.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';
  // ==================================

  // Early warning if keys aren't set
  if (!SUPABASE_URL.includes('supabase.co') || SUPABASE_ANON_KEY.length < 20) {
    window.authLogin = () => alert('Supabase keys not set. Add your Project URL + anon key in assets/auth.js');
    window.authSignup = () => alert('Supabase keys not set. Add your Project URL + anon key in assets/auth.js');
    window.authLogout = () => {};
    window.authResetPassword = () => {};
    console.warn('Supabase keys missing in assets/auth.js');
    // continue; the rest will init once you add keys
  }

  // ---- Helpers ----
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  function msg(text, ok=false){
    const m = $('#authMsg'); if(!m) return;
    m.style.display='block';
    if (ok) { m.style.color='#e7fff0'; m.style.background='rgba(50,215,75,.08)'; m.style.border='1px solid rgba(50,215,75,.45)'; }
    else    { m.style.color='#fff1f1'; m.style.background='rgba(255,69,58,.10)'; m.style.border='1px solid rgba(255,69,58,.45)'; }
    m.textContent = text;
  }
  function clearMsg(){ const m=$('#authMsg'); if(m) m.style.display='none'; }

  const guestBlocks = $$('[data-guest]');
  const memberBlocks = $$('[data-member]');
  const whoami = $('#whoami');
  const year = $('#y'); if (year) year.textContent = new Date().getFullYear();

  // ---- Load supabase-js UMD and create client (singleton) ----
  let _client = null;
  async function boot(){
    if (_client) return _client;
    if (!window.supabase) {
      await new Promise((res, rej) => {
        const s=document.createElement('script');
        s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        s.onload=res; s.onerror=rej; document.head.appendChild(s);
      });
    }
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken:true, persistSession:true, detectSessionInUrl:true }
    });
    _client.auth.onAuthStateChange(() => refreshUI(_client));
    await refreshUI(_client);
    return _client;
  }

  function friendly(err){
    const msgText = (err && (err.message || err.error_description)) || String(err);
    if (/Invalid login credentials/i.test(msgText)) return 'Invalid email or password.';
    if (/Email not confirmed/i.test(msgText)) return 'Please confirm your email (check your inbox).';
    if (/rate limit|too many/i.test(msgText)) return 'Too many attempts. Please try again shortly.';
    return msgText;
  }

  async function refreshUI(supabase){
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      const user = session?.user || null;

      if (user) {
        guestBlocks.forEach(el => el.style.display='none');
        memberBlocks.forEach(el => el.style.display='block');
        if (whoami) whoami.textContent = user.user_metadata?.name || user.email || 'Member';

        // Optional: route member link by role
        const link = document.querySelector('a[href="member.html"]');
        if (link) {
          const role = user.user_metadata?.role || 'regular';
          link.href = role === 'admin' ? 'admin.html'
                 : role === 'business' ? 'business.html'
                 : 'member.html';
        }
      } else {
        guestBlocks.forEach(el => el.style.display='block');
        memberBlocks.forEach(el => el.style.display='none');
      }
    } catch (e) {
      console.warn('UI refresh failed', e);
    }
  }

  // ---- Public handlers (used by login.html) ----
  window.authLogin = async function authLogin(ev){
    ev.preventDefault();
    clearMsg();
    const email = ($('#loginEmail')?.value || '').trim();
    const password = ($('#loginPass')?.value || '').trim();
    if (!email || !password) { msg('Please enter both email and password.'); return; }

    try {
      const supabase = await boot();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      msg('Welcome back — signed in.', true);
      await refreshUI(supabase);
    } catch (e) {
      msg(friendly(e));
    }
  };

  window.authSignup = async function authSignup(_ev){
    clearMsg();
    const email = ($('#loginEmail')?.value || '').trim();
    const password = ($('#loginPass')?.value || '').trim();
    if (!email || !password) { msg('Please enter an email and a password to sign up.'); return; }
    if (password.length < 8) { msg('Password must be at least 8 characters.'); return; }

    try {
      const supabase = await boot();
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: location.origin + '/member.html',
          data: { role: 'regular' }
        }
      });
      if (error) throw error;

      // If email confirmation is ON, Supabase may not sign in immediately.
      msg('Check your inbox to confirm your email. Then log in.', true);
    } catch (e) {
      msg(friendly(e));
    }
  };

  window.authLogout = async function authLogout(){
    clearMsg();
    try {
      const supabase = await boot();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      msg('Signed out.', true);
      await refreshUI(supabase);
    } catch (e) {
      msg('Could not sign out. Please try again.');
      console.error(e);
    }
  };

  window.authResetPassword = async function authResetPassword(){
    clearMsg();
    const email = ($('#loginEmail')?.value || '').trim();
    if (!email) { msg('Enter your email first so we can send the reset link.'); return; }
    try {
      const supabase = await boot();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + '/member.html' // or a dedicated reset page
      });
      if (error) throw error;
      msg('Password reset email sent. Check your inbox.', true);
    } catch (e) {
      msg('Could not send reset email: ' + (e.message || e));
    }
  };

  // Initial kick so page reflects session on first load
  boot().catch(e => {
    console.error('Supabase init failed', e);
    msg('Auth initialisation failed. Check your keys and connection.');
  });
})();
