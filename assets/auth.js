// assets/auth.js
// Supabase v2 auth + session restore + toast + nav "Logged In" indicator
(function () {
  // === SET THESE FROM Supabase → Settings → API ===
  const SUPABASE_URL = 'https://clwzbfndjglxqjatvdce.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsd3piZm5kamdseHFqYXR2ZGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTQ4MTMsImV4cCI6MjA3MjY3MDgxM30.vQDDI9T8aMuK-VUrBeqYApXxqL9uHc-ggGPWRXmhuvw';
  // ===============================================

  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const MSG = $('#authMsg');
  const guestBlocks  = $$('[data-guest]');
  const memberBlocks = $$('[data-member]');
  const whoami = $('#whoami');
  const loginLink = $('#loginLink');
  const year = $('#y'); if (year) year.textContent = new Date().getFullYear();

  // ---- Toast (top-right, green for success) ----
  function showToast(text, ok=true, ms=2800){
    let t = $('#jg-toast');
    if(!t){
      t = document.createElement('div');
      t.id='jg-toast';
      t.style.position='fixed'; t.style.top='16px'; t.style.right='16px';
      t.style.zIndex='9999'; t.style.padding='10px 12px';
      t.style.borderRadius='10px'; t.style.fontSize='14px';
      t.style.boxShadow='0 8px 24px rgba(0,0,0,.45)';
      document.body.appendChild(t);
    }
    t.style.background = ok ? 'rgba(46, 204, 113, .18)' : 'rgba(255, 69, 58, .18)';
    t.style.border = ok ? '1px solid rgba(46, 204, 113, .65)' : '1px solid rgba(255, 69, 58, .65)';
    t.style.color = ok ? '#d9ffea' : '#ffe9e9';
    t.textContent = text;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>{ t.style.transition='opacity .25s'; t.style.opacity='0'; }, ms);
  }

  // Inline message under form (login page)
  function showMsg(text, ok=false){
    if(!MSG) return;
    MSG.style.display='block';
    MSG.style.color = ok ? '#d9ffea' : '#ffe9e9';
    MSG.style.background = ok ? 'rgba(46,204,113,.15)' : 'rgba(255,69,58,.12)';
    MSG.style.border = ok ? '1px solid rgba(46,204,113,.55)' : '1px solid rgba(255,69,58,.55)';
    MSG.textContent = text;
  }
  function clearMsg(){ if(MSG) MSG.style.display='none'; }

  // Load supabase-js (with fallback CDN)
  async function loadLib(){
    if (window.supabase) return;
    await new Promise((res) => {
      const tryLoad = (url, next) => {
        const s=document.createElement('script'); s.src=url; s.onload=res; s.onerror=next; document.head.appendChild(s);
      };
      tryLoad(
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
        () => tryLoad('https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js', res)
      );
    });
  }

  let client = null;
  async function boot(){
    if (client) return client;
    if (!SUPABASE_URL.includes('supabase.co') || SUPABASE_ANON_KEY.length < 20) {
      console.warn('Supabase keys missing in assets/auth.js');
      return null;
    }
    await loadLib();
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth:{ autoRefreshToken:true, persistSession:true, detectSessionInUrl:true }
    });
    client.auth.onAuthStateChange(() => refreshUI());
    await refreshUI();
    // Show toast on any page if a redirect asked for it
    if (sessionStorage.getItem('jg-login-toast') === '1') {
      showToast('Signed in successfully', true);
      sessionStorage.removeItem('jg-login-toast');
    }
    return client;
  }

  function friendly(err){
    const m = (err && (err.message || err.error_description)) || String(err);
    if (/Invalid login credentials/i.test(m)) return 'Invalid email or password.';
    if (/Email not confirmed/i.test(m)) return 'Please confirm your email (check your inbox).';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Please try again shortly.';
    return m;
  }

  async function getSession(){
    if(!client) return null;
    const { data:{ session } } = await client.auth.getSession();
    return session || null;
  }

  // Update nav label state
  async function applyNavState(user){
    if (!loginLink) return;
    if (user){
      loginLink.textContent = 'Logged In';
      loginLink.style.color = '#2ecc71';
      loginLink.href = 'index.html';
    } else {
      loginLink.textContent = 'Login';
      loginLink.style.color = '';
      loginLink.href = 'login.html';
    }
  }

  // Keep UI in sync everywhere
  async function refreshUI(){
    const session = await getSession();
    const user = session?.user || null;

    await applyNavState(user);

    if (user){
      guestBlocks.forEach(el => el.style.display='none');
      memberBlocks.forEach(el => el.style.display='block');
      if (whoami) whoami.textContent = user.user_metadata?.name || user.email || 'Member';

      // If we are on the login page AND logged in → go home
      const onLogin = /\/login\.html?$/.test(location.pathname);
      if (onLogin) {
        sessionStorage.setItem('jg-login-toast','1'); // show toast on the landing page
        location.replace('index.html');
      }
    } else {
      guestBlocks.forEach(el => el.style.display='block');
      memberBlocks.forEach(el => el.style.display='none');
    }
  }

  // Public: protect pages (optional helper you can call anywhere)
  window.requireAuth = async function requireAuth(opts={}){
    await boot();
    const user = (await getSession())?.user || null;
    if (!user){ location.replace(opts.redirectTo || 'login.html'); return false; }
    const allowed = opts.roles;
    if (allowed && !allowed.includes((user.user_metadata?.role)||'regular')) {
      location.replace('index.html'); return false;
    }
    return true;
  };

  // Handlers used by login.html
  window.authLogin = async function authLogin(e){
    e.preventDefault(); clearMsg(); await boot(); if(!client) { showMsg('Auth not initialised. Check keys.'); return; }
    const email = ($('#loginEmail')?.value || '').trim();
    const password = ($('#loginPass')?.value || '').trim();
    if (!email || !password){ showMsg('Please enter both email and password.'); return; }
    try{
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showMsg('Welcome back — signing you in…', true);
      sessionStorage.setItem('jg-login-toast','1');
      location.replace('index.html');
    }catch(err){ showMsg(friendly(err)); }
  };

  window.authSignup = async function authSignup(_e){
    clearMsg(); await boot(); if(!client){ showMsg('Auth not initialised. Check keys.'); return; }
    const email = ($('#loginEmail')?.value || '').trim();
    const password = ($('#loginPass')?.value || '').trim();
    if (!email || !password){ showMsg('Please enter an email and a password to sign up.'); return; }
    if (password.length < 8){ showMsg('Password must be at least 8 characters.'); return; }
    try{
      const { error } = await client.auth.signUp({
        email, password,
        options:{ emailRedirectTo: location.origin + '/index.html', data:{ role:'regular' } }
      });
      if (error) throw error;
      showMsg('Check your inbox to confirm your email. Then log in.', true);
    }catch(err){ showMsg(friendly(err)); }
  };

  window.authLogout = async function authLogout(){
    clearMsg(); await boot(); if(!client) return;
    try{
      const { error } = await client.auth.signOut(); if(error) throw error;
      showToast('Signed out', true);
      await refreshUI();
    }catch(err){ showMsg('Could not sign out. Please try again.'); }
  };

  window.authResetPassword = async function authResetPassword(){
    clearMsg(); await boot(); if(!client) return;
    const email = ($('#loginEmail')?.value || '').trim();
    if (!email){ showMsg('Enter your email first so we can send the reset link.'); return; }
    try{
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + '/index.html'
      });
      if (error) throw error;
      showMsg('Password reset email sent. Check your inbox.', true);
    }catch(err){ showMsg('Could not send reset email: ' + (err.message || err)); }
  };

  // Start
  boot().catch(()=>showMsg('Auth initialisation failed. Check your keys and connection.'));
})();
