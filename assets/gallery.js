export const ARTWORKS = [
  {
    id:"gp-lbg-2021-catalogue",
    title:"Getting Pinked — Lost Bear Gallery",
    year:2021,
    medium:"Mixed media on paper (series)",
    size_cm:"",
    collection:"Getting Pinked",
    status:"series",
    page:"https://jodygraham.art/work/getting-pinked-collection/",
    image:"https://jodygraham.art/wp-content/uploads/2021/10/Getting-Pinked-hero.jpg"
  },
  {
    id:"burnt-series",
    title:"Burnt — post-bushfire materials",
    year:2020,
    medium:"Drawings with burnt branches & found matter",
    size_cm:"",
    collection:"Burnt",
    status:"series",
    page:"https://jodygraham.art/work/burnt/",
    image:"https://jodygraham.art/wp-content/uploads/2020/07/Burnt-hero.jpg"
  },
  {
    id:"fly-bird",
    title:"Fly like a Bird",
    year:2021,
    medium:"Charcoal from Black Summer fires (birds)",
    size_cm:"",
    collection:"Fly like a Bird",
    status:"series",
    page:"https://jodygraham.art/work/fly-like-a-bird/",
    image:"https://jodygraham.art/wp-content/uploads/2021/09/Fly-like-a-Bird-hero.jpg"
  },
  {
    id:"facade",
    title:"Behind the Facade",
    year:2024,
    medium:"Charcoal and mixed media",
    size_cm:"",
    collection:"Behind the Facade",
    status:"series",
    page:"https://jodygraham.art/work/behind-the-facade/",
    image:"https://jodygraham.art/wp-content/uploads/2025/04/Behind-the-Facade-hero.jpg"
  }
];

export function renderGalleryGrid(targetId){
  const grid = document.getElementById(targetId);
  if(!grid) return;

  function card(a){
    return `
    <article class="card" data-collection="${a.collection}">
      <figure><img loading="lazy" src="${a.image}" alt="${a.title}"></figure>
      <div class="meta">
        <h3>${a.title}</h3>
        <p>${[a.medium,a.size_cm,a.year].filter(Boolean).join(' • ')}</p>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn" href="${a.page}" target="_blank" rel="noopener">Open on jodygraham.art</a>
        </div>
      </div>
    </article>`;
  }

  function bindLightbox(items){
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lbImg');
    const lbTitle = document.getElementById('lbTitle');
    const lbNote = document.getElementById('lbNote');
    const lbLink = document.getElementById('lbLink');
    function openLB(a){
      if(a.image){ lbImg.src=a.image; lbImg.alt=a.title; } else { lbImg.removeAttribute('src'); lbImg.alt=''; }
      lbTitle.textContent = a.title;
      lbNote.textContent = [a.collection, a.medium, a.size_cm, a.year].filter(Boolean).join(' • ');
      lbLink.href = a.page; lbLink.textContent = 'View on jodygraham.art';
      lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    }
    function closeLB(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow=''; lbImg.removeAttribute('src'); }
    document.getElementById('lbClose')?.addEventListener('click', closeLB);
    lb?.addEventListener('click', (e)=>{ if(e.target===lb) closeLB(); });
    window.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && lb?.classList.contains('open')) closeLB(); });

    grid.querySelectorAll('.card').forEach((el, i)=>{
      el.addEventListener('click', (e)=>{
        if(e.target.closest('a')) return;
        openLB(items[i]);
      });
    });
  }

  const items = ARTWORKS;
  grid.innerHTML = items.map(card).join('');
  bindLightbox(items);

  // Simple filter buttons
  document.querySelectorAll('.pill[data-filter]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.pill[data-filter]').forEach(b=>b.setAttribute('aria-pressed','false'));
      btn.setAttribute('aria-pressed','true');
      const filter = btn.dataset.filter;
      const filtered = ARTWORKS.filter(a => !filter || filter==='all' || a.collection===filter);
      grid.innerHTML = filtered.map(card).join('');
      bindLightbox(filtered);
    });
  });
}
