<!-- Put this in <head> of any page that needs login UI -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
/* ====== Supabase init (replace with your values) ====== */
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ====== Simple auth state + UI helpers ====== */
async function refreshUserUI(){
  const { data: { user } } = await supabase.auth.getUser();
  document.querySelectorAll('[data-guest]').forEach(el=> el.style.display = user ? 'none' : '');
  document.querySelectorAll('[data-member]').forEach(el=> el.style.display = user ? '' : 'none');
  const emailSpan = document.getElementById('whoami');
  if (emailSpan) emailSpan.textContent = user ? (user.email || 'Member') : 'Guest';
}

/* login with email+password */
async function login(e){
  e?.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { alert(error.message); return; }
  await refreshUserUI();
  // Close modal if present
  document.getElementById('loginModal')?.close?.();
}

/* sign up */
async function signup(e){
  e?.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) { alert(error.message); return; }
  alert('Check your email to confirm your account');
}

/* logout */
async function logout(){
  await supabase.auth.signOut();
  await refreshUserUI();
}

/* Get a signed URL to a premium file in Storage */
async function signedUrl(path, expires=3600){
  const { data, error } = await supabase
    .storage.from('premium')
    .createSignedUrl(path, expires);
  if (error) throw error;
  return data.signedUrl;
}

/* Example: load a gated image/video onto the page when logged in */
async function loadMemberAssets(){
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return;

  // Example: replace src of an <img id="premiumImg">
  const img = document.getElementById('premiumImg');
  if (img){
    img.src = await signedUrl('images/behind-the-facade-hires.jpg'); // your path in the bucket
  }

  // Example: set <video id="premiumVid"> source
  const vid = document.getElementById('premiumVid');
  if (vid){
    vid.src = await signedUrl('videos/found-tools-masterclass.mp4'); // your path in the bucket
    vid.load();
  }
}

/* Listen to auth changes */
supabase.auth.onAuthStateChange(async (_event, _session)=> {
  await refreshUserUI();
  await loadMemberAssets();
});

/* Boot */
document.addEventListener('DOMContentLoaded', async ()=>{
  await refreshUserUI();
  await loadMemberAssets();
});

/* Expose for buttons */
window.authLogin = login;
window.authSignup = signup;
window.authLogout = logout;
</script>
