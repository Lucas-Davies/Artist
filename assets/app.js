/* Mobile menu */
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('mainmenu');
if (toggle) toggle.addEventListener('click', ()=> {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
/* Year */
const y = document.getElementById('y'); if (y) y.textContent = new Date().getFullYear();
/* Active tab */
(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu a').forEach(a=>{
    const href = a.getAttribute('href'); if(!href) return;
    const file = href.replace('./','');
    if(file === path) a.setAttribute('aria-current','page');
  });
})();
