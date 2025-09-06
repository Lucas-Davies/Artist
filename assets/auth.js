(function () {
  const SUPABASE_URL = 'https://clwzbfndjglxqjatvdce.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsd3piZm5kamdseHFqYXR2ZGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTQ4MTMsImV4cCI6MjA3MjY3MDgxM30.vQDDI9T8aMuK-VUrBeqYApXxqL9uHc-ggGPWRXmhuvw';

  const $ = (s,r=document)=>r.querySelector(s);
  const year=$('#y'); if(year) year.textContent=new Date().getFullYear();

  function render(tplId){ const host=$('#authBody'); host.innerHTML=$('#'+tplId).innerHTML; wire(); }

  function toast(msg,ok=true){ let t=$('#jg-toast'); if(!t){t=document.createElement('div');t.id='jg-toast';
    Object.assign(t.style,{position:'fixed',top:'16px',right:'16px',zIndex:9999,
    padding:'10px 12px',borderRadius:'10px',fontSize:'14px',boxShadow:'0 8px 24px rgba(0,0,0,.45)'});document.body.appendChild(t);}
    t.style.background=ok?'rgba(46,204,113,.18)':'rgba(255,69,58,.18)';
    t.style.border=ok?'1px solid rgba(46,204,113,.65)':'1px solid rgba(255,69,58,.65)';
    t.style.color=ok?'#d9ffea':'#ffe9e9'; t.textContent=msg; t.style.opacity='1';
    clearTimeout(t._timer); t._timer=setTimeout(()=>t.style.opacity='0',2500); }

  async function loadLib(){ if(window.supabase) return;
    await new Promise(res=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';s.onload=res;document.head.appendChild(s);});}
  let client=null;
  async function boot(){ if(client) return client; await loadLib();
    client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
    client.auth.onAuthStateChange(()=>sync()); await sync(); return client; }

  async function session(){ return (await client.auth.getSession()).data.session; }

  async function sync(){ const s=await session(); const u=s?.user||null;
    const l=$('#loginLink');
    if(l){ if(u){ l.textContent='Log Out'; l.style.color='#ff5b62'; l.href='#'; l.onclick=(e)=>{e.preventDefault();openLogout();}; }
            else { l.textContent='Login'; l.style.color=''; l.href='login.html'; l.onclick=null; } }
    if(/login\.html$/.test(location.pathname)){ if(u){ sessionStorage.setItem('jg-login-toast','1'); location.replace('index.html'); } else { render('tpl-login'); } } }

  // Validation
  function setInvalid(el,msg,show){ if(!el) return; if(show){el.classList.add('invalid');$('#'+msg).style.display='block';} else {el.classList.remove('invalid');$('#'+msg).style.display='none';} }
  function validateSignup(){ const f=$('#suFirst'),l=$('#suLast'),e=$('#suEmail'),p=$('#suPass'),m=$('#suMobile');let ok=true;
    setInvalid(f,'errFirst',!f.value.trim()); ok&=!!f.value.trim();
    setInvalid(l,'errLast',!l.value.trim()); ok&=!!l.value.trim();
    const eok=/^\S+@\S+\.\S+$/.test(e.value.trim()); setInvalid(e,'errEmail',!eok); ok&=eok;
    const pok=(p.value||'').length>=8; setInvalid(p,'errPass',!pok); ok&=pok;
    if(m.value){ const au=/^(?:\+61\s?4\d{2}\s?\d{3}\s?\d{3}|0?4\d{2}\s?\d{3}\s?\d{3})$/; const mok=au.test(m.value); setInvalid(m,'errMobile',!mok); ok&=mok; }
    return !!ok; }

  function friendly(err){const m=(err&&(err.message||err.error_description))||String(err);
    if(/already/i.test(m)) return 'EMAIL_IN_USE'; if(/Invalid/.test(m)) return 'Invalid credentials'; return m; }

  async function doLogin(e,p){ await boot(); try{const {error}=await client.auth.signInWithPassword({email:e,password:p});
    if(error) throw error; sessionStorage.setItem('jg-login-toast','1'); location.replace('index.html'); }catch(err){ showMsg(friendly(err)); }}
  async function doSignup(){ if(!validateSignup()){showMsg('Fix highlighted fields');return;} await boot();
    const meta={first:$('#suFirst').value,last:$('#suLast').value,mobile:$('#suMobile').value||null,role:'regular'};
    try{const {error}=await client.auth.signUp({email:$('#suEmail').value,password:$('#suPass').value,options:{emailRedirectTo:location.origin+'/index.html',data:meta}});
      if(error){ if(friendly(error)==='EMAIL_IN_USE'){render('tpl-emailused');return;} showMsg(friendly(error));return;} render('tpl-success'); }
    catch(err){showMsg(friendly(err));}}
  async function doReset(){ await boot(); const e=$('#loginEmail').value; if(!e){showMsg('Enter email first');return;}
    try{await client.auth.resetPasswordForEmail(e,{redirectTo:location.origin+'/index.html'}); showMsg('Password reset sent',true);}catch(err){showMsg('Reset failed');}}
  async function doLogout(){ await boot(); await client.auth.signOut(); toast('Signed out',true); location.replace('index.html'); }

  function showMsg(msg,ok){const box=$('#authMsg');if(!box)return;box.style.display='block';box.textContent=msg;box.style.color=ok?'#d9ffea':'#ffe9e9';}

  // Modal
  function openLogout(){const m=$('#logoutModal');m.style.display='grid';}
  $('#btnConfirmLogout')?.addEventListener('click',()=>doLogout());
  $('#btnCancelLogout')?.addEventListener('click',()=>{ $('#logoutModal').style.display='none'; location.replace('index.html'); });

  function wire(){ $('#btnLogin')?.addEventListener('click',e=>{e.preventDefault();doLogin($('#loginEmail').value,$('#loginPass').value);});
    $('#btnReset')?.addEventListener('click',e=>{e.preventDefault();doReset();});
    $('#btnGoSignup')?.addEventListener('click',()=>render('tpl-signup'));
    $('#signupForm')?.addEventListener('submit',e=>{e.preventDefault();doSignup();});
    $('#btnCancelSignup')?.addEventListener('click',()=>render('tpl-login'));
    $('#btnBackToSignup')?.addEventListener('click',()=>render('tpl-signup')); }

  boot().then(()=>{ if(/login\.html$/.test(location.pathname)) render('tpl-login'); });
})();
