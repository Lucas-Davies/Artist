/* ========================
   Navigation & UI helpers
   ======================== */

/* Mobile menu toggle */
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('mainmenu');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

/* Year in footer */
const y = document.getElementById('y');
if (y) y.textContent = new Date().getFullYear();

/* Active tab highlighting */
(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu a').forEach(a=>{
    const href = a.getAttribute('href');
    if(!href) return;
    const file = href.replace('./','');
    if(file === path) a.setAttribute('aria-current','page');
  });
})();

/* ========================
   Anti-save / anti-copy
   ======================== */

/* Block right-click menu everywhere */
document.addEventListener('contextmenu', e => e.preventDefault());

/* Block drag, select, or long-press save */
['dragstart','selectstart'].forEach(ev =>
  document.addEventListener(ev, e => {
    const t = e.target;
    if (t.closest('img, .no-save, .guard')) e.preventDefault();
  })
);

/* Block common save/print/view-source shortcuts */
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && ['s','p','u'].includes(k)) {
    e.preventDefault(); e.stopPropagation();
  }
});
