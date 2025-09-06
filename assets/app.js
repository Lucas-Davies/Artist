/* ========================
   Navigation & UI helpers
   ======================== */

/* Mobile menu toggle (works with .menu.open OR [data-open="true"]) */
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mainmenu');
  if (!toggle || !menu) return;

  const setOpen = (isOpen) => {
    // Support both CSS approaches
    menu.classList.toggle('open', isOpen);
    menu.setAttribute('data-open', String(isOpen));
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  // Initialise to closed on load
  setOpen(false);

  // Toggle on button click
  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));

  // Close when a menu link is clicked (useful on mobile)
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) setOpen(false);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();

/* Year in footer */
(() => {
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
})();

/* Active tab highlighting */
(() => {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const file = href.replace('./','');
    if (file === path) a.setAttribute('aria-current','page');
  });
})();

/* ========================
   Anti-save / anti-copy
   ======================== */

/* Block right-click menu everywhere */
document.addEventListener('contextmenu', e => e.preventDefault(), { passive:false });

/* Block drag, select, or long-press save on guarded elements */
['dragstart','selectstart'].forEach(ev =>
  document.addEventListener(ev, e => {
    const t = e.target;
    if (t && t.closest && t.closest('img, .no-save, .guard')) e.preventDefault();
  }, { passive:false })
);

/* Block common save/print/view-source shortcuts */
document.addEventListener('keydown', e => {
  const k = (e.key || '').toLowerCase();
  if ((e.ctrlKey || e.metaKey) && ['s','p','u'].includes(k)) {
    e.preventDefault(); e.stopPropagation();
  }
});
