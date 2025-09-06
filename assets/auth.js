 // assets/auth.js
// Supabase v2 auth + session restore + clear errors + eye toggles + nav auth visibility + page guard
(function () {
  // === paste your real values ===
const SUPABASE_URL = 'https://clwzbfndjglxqjatvdce.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsd3piZm5kamdseHFqYXR2ZGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTQ4MTMsImV4cCI6MjA3MjY3MDgxM30.vQDDI9T8aMuK-VUrBeqYApXxqL9uHc-ggGPWRXmhuvw';
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const year = $('#y'); if (year) year.textContent = new Date().getFullYear();

  // ---------- render & small UI helpers ----------
  function render(tplId){ const host=$('#authBody'); if(host){ host.innerHTML=$('#'+tplId).innerHTML; wire(); } }
  function toast(text, ok=true, ms=2600){
    let t=$('#jg-toast');
    if(!t){ t=document.createElement('div'); t.id='jg-toast';
      Object.assign(t.style,{position:'fixed',top:'16px',right:'16px',zIndex:9999,padding:'10px 12px',borderRadius:'10px',fontSize:'14px',boxShadow:'0 8px 24px rgba(0,0,0,.45)'}); document.body.appendChild(t); }
    t.style.background=ok?'rgba(46,204,113,.18)':'rgba(255,69,58,.18)';
    t.style.border=ok?'1px solid rgba(46,204,113,.65)':'1px solid rgba(255,69,58,.65)';
    t.style.color=ok?'#d9ffea':'#ffe9e9';
    t.textContent=text; t.style.opacity='1';
    clearTimeout(t._timer); t._timer=setTimeout(()=>{t.style.opacity='0';},ms);
  }
  function formMsg(text, ok=false){
    const box=$('#authMsg'); if(!box) return;
    box.style.display='block';
    box.style.color = ok ? '#d9ffea' : '#ffe9e9';
    box.style.background = ok ? 'rgba(46,204,113,.15)' : 'rgba(255,69,58,.12)';
    box.style.border = ok ? '1px solid rgba(46,204,113,.55)' : '1px solid rgba(255,69,58,.55)';
    box.textContent=text;
  }
  function clearFormMsg(){ const box=$('#authMsg'); if(box) box.style.display='none'; }
  function setInvalid(el,msgId,show){ if(!el) return; if(show){ el.classList.add('invalid'); const m=$('#'+msgId); if(m) m.style.display='block'; } else { el.classList.remove('invalid'); const m=$('#'+msgId); if(m) m.style.display='none'; } }

  // show/hide password eyes
  function wireEyes(){ $$('button.eye').forEach(btn=>{
    const target=$(btn.getAttribute('data-eye')); if(!target) return;
    btn.onclick=()=>{ const isPw=(target.type==='password'); target.type=isPw?'text':'password'; btn.textContent=isPw?'Hide':'Show'; };
  }); }

  // ---------- Supabase boot with CDN fallback ----------
  async function loadLib(){
    if (window.supabase) return;
    await new Promise((res)=>{
      const tryLoad=(u,n)=>{ const s=document.createElement('script'); s.src=u; s.onload=res; s.onerror=n; document.head.appendChild(s); };
      tryLoad('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
        ()=>tryLoad('https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js',res));
    });
  }
  let client=null;
  async function boot(){
    if(client) return client;
    await loadLib();
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}
    });
    client.auth.onAuthStateChange(()=>sync());
    await sync();
    if (sessionStorage.getItem('jg-login-toast')==='1'){ toast('Signed in successfully', true); sessionStorage.removeItem('jg-login-toast'); }
    return client;
  }
  async function getSession(){ const r=await client.auth.getSession(); return r.data.session; }

  // ---------- error mapping ----------
  function friendly(err){
    const raw=(err&&(err.message||err.error_description))||String(err);
    const lower=raw.toLowerCase();
    if (lower.includes('invalid login') || lower.includes('invalid credential')) return 'Invalid email or password.';
    if (lower.includes('confirm')) return 'Please confirm your email first (check your inbox).';
    if (lower.includes('already registered') || lower.includes('already exists')) return 'EMAIL_IN_USE';
    if (lower.includes('redirect url is not allowed') || lower.includes('url not allowed')) return 'This site URL isn’t allowed in Supabase (Auth → Settings → URL Configuration).';
    if (lower.includes('network') || lower.includes('fetch')) return 'Network problem connecting to the server.';
    return raw;
  }

  // ---------- nav auth visibility ----------
  function applyAuthVisibility(user){
    $$('[data-auth="in"]').forEach(el=>{ el.style.display = user ? '' : 'none'; });
    $$('[data-auth="out"]').forEach(el=>{ el.style.display = user ? 'none' : ''; });
    const loginLink=$('#loginLink');
    if(loginLink){
      if(user){ loginLink.textContent='Log Out'; loginLink.style.color='#ff5b62'; loginLink.href='#'; loginLink.onclick=(e)=>{e.preventDefault(); openLogout();}; }
      else{ loginLink.textContent='Login'; loginLink.style.color=''; loginLink.href='login.html'; loginLink.onclick=null; }
    }
  }

  async function sync(){
    const s=await getSession(); const user=s?.user||null;
    applyAuthVisibility(user);
    if(/login\.html$/.test(location.pathname)){
      if(user){ sessionStorage.setItem('jg-login-toast','1'); location.replace('index.html'); }
      else { render('tpl-login'); }
    }
  }

  // ---------- validation ----------
  function validateSignup(){
    const f=$('#suFirst'), l=$('#suLast'), e=$('#suEmail'),
          p=$('#suPass'), p2=$('#suPass2'), m=$('#suMobile');
    let ok=true;

    setInvalid(f,'errFirst', !f.value.trim()); ok = ok && !!f.value.trim();
    setInvalid(l,'errLast',  !l.value.trim()); ok = ok && !!l.value.trim();

    const eok=/^\S+@\S+\.\S+$/.test(e.value.trim());
    setInvalid(e,'errEmail', !eok); ok = ok && eok;

    const pok=(p.value||'').length>=8;
    setInvalid(p,'errPass', !pok); ok = ok && pok;

    const match=(p.value===p2.value && p2.value.length>=8);
    setInvalid(p2,'errPass2', !match); ok = ok && match;

    if (m.value){
      const au=/^(?:\+61\s?4\d{2}\s?\d{3}\s?\d{3}|0?4\d{2}\s?\d{3}\s?\d{3})$/;
      const mok=au.test(m.value.trim()); setInvalid(m,'errMobile', !mok); ok = ok && mok;
    } else setInvalid(m,'errMobile', false);

    return ok;
  }

  // ---------- actions ----------
  async function doLogin(email, password){
    await boot(); clearFormMsg();
    $('#loginEmail')?.classList.remove('invalid'); $('#loginPass')?.classList.remove('invalid');
    if(!email){ setInvalid($('#loginEmail'),'_',true); formMsg('Please enter your email.'); return; }
    if(!password){ setInvalid($('#loginPass'),'_',true); formMsg('Please enter your password.'); return; }

    try{
      const { error } = await client.auth.signInWithPassword({ email, password });
      if(error) throw error;
      sessionStorage.setItem('jg-login-toast','1');
      location.replace('index.html');
    }catch(e){
      const msg=friendly(e);
      if (msg==='Invalid email or password.') { setInvalid($('#loginEmail'),'_',true); setInvalid($('#loginPass'),'_',true); }
      formMsg(msg);
    }
  }

  async function doSignup(){
    if(!validateSignup()){ formMsg('Please fix the highlighted fields.'); return; }
    await boot();
    const meta={ first:$('#suFirst').value.trim(), last:$('#suLast').value.trim(),
                 mobile:($('#suMobile').value||'').trim()||null, role:'regular' };
    try{
      const { error } = await client.auth.signUp({
        email: $('#suEmail').value.trim(),
        password: $('#suPass').value,
        options: { emailRedirectTo: location.origin + '/index.html', data: meta }
      });
      if(error){
        const msg=friendly(error);
        if(msg==='EMAIL_IN_USE'){ render('tpl-emailused'); return; }
        formMsg(msg); return;
      }
      render('tpl-success');
    }catch(e){ formMsg(friendly(e)); }
  }

  async function doReset(){
    await boot();
    const email = ($('#loginEmail')?.value||'').trim();
    if(!email){ formMsg('Enter your email first so we can send the reset link.'); return; }
    try{
      const { error } = await client.auth.resetPasswordForEmail(email,{ redirectTo: location.origin + '/index.html' });
      if(error) throw error;
      formMsg('Password reset email sent. Check your inbox.', true);
    }catch(e){ formMsg(friendly(e)); }
  }

  async function doLogout(){ await boot(); await client.auth.signOut(); toast('Signed out', true); location.replace('index.html'); }

  // ---------- logout modal ----------
  function openLogout(){ const m=$('#logoutModal'); if(m){ m.style.display='grid'; m.setAttribute('aria-hidden','false'); } }
  $('#btnConfirmLogout')?.addEventListener('click', ()=>doLogout());
  $('#btnCancelLogout')?.addEventListener('click', ()=>{ const m=$('#logoutModal'); if(m){ m.style.display='none'; m.setAttribute('aria-hidden','true'); } location.replace('index.html'); });

  // ---------- wire handlers for the visible card ----------
  function wire(){
    $('#btnLogin')?.addEventListener('click', e=>{ e.preventDefault(); doLogin($('#loginEmail').value,$('#loginPass').value); });
    $('#btnReset')?.addEventListener('click', e=>{ e.preventDefault(); doReset(); });
    $('#btnGoSignup')?.addEventListener('click', ()=>render('tpl-signup'));
    $('#signupForm')?.addEventListener('submit', e=>{ e.preventDefault(); doSignup(); });
    $('#btnCancelSignup')?.addEventListener('click', ()=>render('tpl-login'));
    $('#btnBackToSignup')?.addEventListener('click', ()=>render('tpl-signup'));
    wireEyes();
  }

  // ---------- page guard API (use on protected pages) ----------
  window.requireAuth = async function(){
    await boot();
    const s = await getSession();
    if(!s?.user){ location.replace('login.html'); return false; }
    return true;
  };

  // start
  boot().then(()=>{ if(/login\.html$/.test(location.pathname)) render('tpl-login'); });
})();
