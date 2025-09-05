import * as THREE from 'https://unpkg.com/three@0.161/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.161/examples/jsm/controls/PointerLockControls.js';

/* ===== Data: artworks to hang ===== */
const ARTWORKS = [
  {
    title: "Getting Pinked — Lost Bear Gallery",
    collection: "Getting Pinked", year: 2021,
    page: "https://jodygraham.art/work/getting-pinked-collection/",
    image: "https://jodygraham.art/wp-content/uploads/2021/10/Getting-Pinked-hero.jpg",
    pos: [-7.8, 1.55, -2.0], rotY: Math.PI/2, w: 2.0, h: 1.4
  },
  {
    title: "Burnt — post-bushfire materials",
    collection: "Burnt", year: 2020,
    page: "https://jodygraham.art/work/burnt/",
    image: "https://jodygraham.art/wp-content/uploads/2020/07/Burnt-hero.jpg",
    pos: [-7.8, 1.55, +2.2], rotY: Math.PI/2, w: 2.0, h: 1.4
  },
  {
    title: "Fly like a Bird",
    collection: "Birds", year: 2021,
    page: "https://jodygraham.art/work/fly-like-a-bird/",
    image: "https://jodygraham.art/wp-content/uploads/2021/09/Fly-like-a-Bird-hero.jpg",
    pos: [0.0, 1.55, -9.8], rotY: 0, w: 2.0, h: 1.4
  },
  {
    title: "Behind the Facade",
    collection: "Facade", year: 2024,
    page: "https://jodygraham.art/work/behind-the-facade/",
    image: "https://jodygraham.art/wp-content/uploads/2025/04/Behind-the-Facade-hero.jpg",
    pos: [+7.8, 1.55, +2.2], rotY: -Math.PI/2, w: 2.0, h: 1.4
  }
];

/* ===== DOM ===== */
const canvas = document.getElementById('vg');
const enter = document.getElementById('enter');
const startBtn = document.getElementById('startBtn');
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbTitle = document.getElementById('lbTitle');
const lbNote = document.getElementById('lbNote');
const lbLink = document.getElementById('lbLink');
document.getElementById('lbClose').addEventListener('click', closeLB);
lb.addEventListener('click', (e)=>{ if(e.target===lb) closeLB(); });
window.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && lb.classList.contains('open')) closeLB(); });

function openLB(a){
  lbImg.src = a.image; lbImg.alt = a.title;
  lbTitle.textContent = a.title;
  lbNote.textContent = [a.collection, a.year].filter(Boolean).join(" • ");
  lbLink.href = a.page;
  lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
}
function closeLB(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow=''; lbImg.removeAttribute('src'); }

/* ===== Three setup ===== */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(70, 16/9, 0.1, 100);
camera.position.set(0, 1.6, 0); // eye height

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const spot1 = new THREE.SpotLight(0xffffff, 2.0, 30, Math.PI/6, 0.25, 1.5);
spot1.position.set(0, 3.0, 0);
scene.add(spot1);

// Room (simple white box, open ceiling feel)
const ROOM_W = 16, ROOM_H = 3.2, ROOM_D = 20;
const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.0, side: THREE.BackSide });
const room = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, ROOM_H, ROOM_D), wallMat);
scene.add(room);

// Floor (light grey)
const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 1 }));
floor.rotation.x = -Math.PI/2; floor.position.y = 0.0;
scene.add(floor);

// Frames + paintings
const loader = new THREE.TextureLoader();
const clickable = []; // meshes you can click
ARTWORKS.forEach(a => {
  const tex = loader.load(a.image); tex.colorSpace = THREE.SRGBColorSpace;
  const art = new THREE.Mesh(new THREE.PlaneGeometry(a.w, a.h), new THREE.MeshBasicMaterial({ map: tex }));
  art.position.set(a.pos[0], a.pos[1], a.pos[2]); art.rotation.y = a.rotY;
  art.userData = a;

  // simple black frame
  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(a.w+0.08, a.h+0.08),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  frame.position.copy(art.position); frame.rotation.copy(art.rotation); frame.position.z += 0.001 * (a.rotY===0 ? 1 : -1);

  scene.add(frame, art);
  clickable.push(art);
});

// Resize
function fit(){
  const r = canvas.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
}
new ResizeObserver(fit).observe(canvas); fit();

/* ===== Controls: pointer lock + WASD ===== */
const controls = new PointerLockControls(camera, canvas);
startBtn.addEventListener('click', () => {
  controls.lock();
});
controls.addEventListener('lock', ()=> enter.style.display = 'none');
controls.addEventListener('unlock', ()=> enter.style.display = '');

const keys = { w:false, a:false, s:false, d:false, shift:false };
window.addEventListener('keydown', e => set(e.code, true), false);
window.addEventListener('keyup',   e => set(e.code, false), false);
function set(code, val){
  if (code === 'KeyW') keys.w = val;
  if (code === 'KeyA') keys.a = val;
  if (code === 'KeyS') keys.s = val;
  if (code === 'KeyD') keys.d = val;
  if (code === 'ShiftLeft' || code === 'ShiftRight') keys.shift = val;
}

/* Simple collision: clamp within room bounds (keep ~0.6m from walls) */
const margin = 0.6;
function collide(next){
  next.x = THREE.MathUtils.clamp(next.x, -ROOM_W/2 + margin, ROOM_W/2 - margin);
  next.z = THREE.MathUtils.clamp(next.z, -ROOM_D/2 + margin, ROOM_D/2 - margin);
  return next;
}

/* Click to open art (raycast) */
const ray = new THREE.Raycaster();
canvas.addEventListener('click', (ev)=>{
  if (!controls.isLocked) return; // avoid clicking when not in FP mode
  ray.setFromCamera(new THREE.Vector2(0,0), camera); // center crosshair
  const hits = ray.intersectObjects(clickable, false);
  if (hits[0]) openLB(hits[0].object.userData);
});

/* Mobile fallback: orbit controls (no pointer lock) */
let orbit = null;
if (/Mobi|Android/i.test(navigator.userAgent)){
  const { OrbitControls } = await import('https://unpkg.com/three@0.161/examples/jsm/controls/OrbitControls.js');
  orbit = new OrbitControls(camera, canvas);
  orbit.target.set(0, 1.6, -4);
  camera.position.set(0, 1.6, 4);
  enter.style.display = 'none';
}

/* Animate */
let last = performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last)/1000); last = now;

  if (controls.isLocked){
    const speed = (keys.shift ? 3.5 : 1.8); // m/s
    const dir = new THREE.Vector3();
    // forward/back
    if (keys.w) dir.z -= 1;
    if (keys.s) dir.z += 1;
    // left/right
    if (keys.a) dir.x -= 1;
    if (keys.d) dir.x += 1;
    if (dir.lengthSq() > 0){
      dir.normalize().multiplyScalar(speed * dt);
      // move in camera space (X/Z plane), ignore Y
      const forward = new THREE.Vector3();
      controls.getDirection(forward);
      forward.y = 0; forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).negate();
      const delta = new THREE.Vector3()
        .addScaledVector(forward, dir.z)
        .addScaledVector(right, dir.x);

      const pos = controls.getObject().position.clone().add(delta);
      collide(pos);
      controls.getObject().position.copy(pos);
    }
  } else if (orbit){
    orbit.update();
  }

  renderer.render(scene, camera);
}
loop(performance.now());
