import * as THREE from 'https://unpkg.com/three@0.161/build/three.module.js';
import { ARTWORKS } from './gallery.js';

const vgCanvas = document.getElementById('vg');
if (vgCanvas){
  const renderer = new THREE.WebGLRenderer({canvas:vgCanvas, antialias:true});
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x111111);
  const camera = new THREE.PerspectiveCamera(60, 16/9, .1, 100);
  camera.position.set(0,1.6,6);
  const ambient = new THREE.AmbientLight(0xffffff,.9), hemi = new THREE.HemisphereLight(0xffffff,0x444444,.4);
  scene.add(ambient,hemi);

  const room = new THREE.Mesh(new THREE.BoxGeometry(12,3.2,12), new THREE.MeshStandardMaterial({color:0xffffff, side:THREE.BackSide}));
  scene.add(room);

  function fit(){ const r = vgCanvas.getBoundingClientRect(); renderer.setSize(r.width, r.height); camera.aspect = r.width/r.height; camera.updateProjectionMatrix(); }
  new ResizeObserver(fit).observe(vgCanvas); fit();

  const loader = new THREE.TextureLoader();
  function framePlane({img,x,y,z,ry=0,w=1.6,h=1.2,meta}){
    const tex = loader.load(img); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({map:tex});
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat);
    mesh.position.set(x,y,z); mesh.rotation.y = ry; mesh.userData = meta;
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(w+0.06,h+0.06), new THREE.MeshBasicMaterial({color:0x000000}));
    frame.position.copy(mesh.position); frame.rotation.copy(mesh.rotation); frame.position.z += 0.001;
    scene.add(frame, mesh);
    return mesh;
  }

  [
    {img: ARTWORKS[0].image, meta: ARTWORKS[0], x:-3.5, y:1.6, z:-5.8},
    {img: ARTWORKS[1].image, meta: ARTWORKS[1], x: 0.0, y:1.6, z:-5.8},
    {img: ARTWORKS[2].image, meta: ARTWORKS[2], x: 3.5, y:1.6, z:-5.8},
    {img: ARTWORKS[3].image, meta: ARTWORKS[3], x:-5.8, y:1.6, z: 0.0, ry: Math.PI/2}
  ].forEach(cfg => framePlane(cfg));

  let t=0; function loop(){ t+=0.003; camera.position.x = Math.sin(t)*6; camera.position.z = Math.cos(t)*6; camera.lookAt(0,1.6,0); renderer.render(scene,camera); requestAnimationFrame(loop); }
  loop();
}
