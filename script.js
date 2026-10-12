const stage = document.querySelector('.stage');
const layers = [...document.querySelectorAll('[data-depth]')];
const intensity = document.querySelector('#intensity');
const toggle = document.querySelector('#toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobileMotion = matchMedia('(max-width: 650px), (pointer: coarse)');
let viewportWidth = innerWidth;
let scrollRange = Math.max(1, document.documentElement.scrollHeight - innerHeight);
let paused = reduced.matches;
let target = { x: 0, y: 0 };
let current = { x: 0, y: 0 };
let scrollTarget = 0;
let scrollCurrent = 0;
let frame = 0;

function render() {
  frame = 0;
  if (mobileMotion.matches) {
    // Phones use a single static background; no masked surfaces are animated.
    current = { x: 0, y: 0 };
    scrollCurrent = 0;
    for (const layer of layers) layer.style.transform = 'none';
    return;
  }
  current.x += (target.x - current.x) * 0.07;
  current.y += (target.y - current.y) * 0.07;
  scrollCurrent += (scrollTarget - scrollCurrent) * 0.07;
  const strength = Number(intensity.value) / 100;
  for (const layer of layers) {
    const depth = Number(layer.dataset.depth);
    const x = current.x * 38 * depth * strength;
    const y = (current.y * 28 - scrollCurrent * 90) * depth * strength;
    const angle = (current.x * 0.65 + scrollCurrent * 1.5) * depth * strength;
    layer.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg) scale(1.025)`;
  }
  if (Math.abs(target.x - current.x) + Math.abs(target.y - current.y) + Math.abs(scrollTarget - scrollCurrent) > 0.001) requestRender();
}
function requestRender() { if (!frame) frame = requestAnimationFrame(render); }
stage.addEventListener('pointermove', event => {
  if (paused || mobileMotion.matches || event.pointerType === 'touch') return;
  target = { x: (event.clientX / innerWidth - 0.5) * 2, y: (event.clientY / innerHeight - 0.5) * 2 };
  requestRender();
});
function syncScroll() {
  if (mobileMotion.matches) return;
  scrollTarget = paused ? 0 : Math.max(0, Math.min(1, scrollY / scrollRange));
  requestRender();
}
window.addEventListener('scroll', syncScroll, { passive: true });
function measureScrollRange() {
  scrollRange = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  syncScroll();
}
window.addEventListener('resize', () => {
  // Browser toolbar changes height during scrolling; don't reframe the artwork.
  if (!mobileMotion.matches || innerWidth !== viewportWidth) {
    viewportWidth = innerWidth;
    measureScrollRange();
  }
});
window.addEventListener('load', measureScrollRange);
mobileMotion.addEventListener('change', () => { reset(); measureScrollRange(); });
function reset() { target = { x: 0, y: 0 }; requestRender(); }
stage.addEventListener('pointerleave', reset);
window.addEventListener('blur', reset);
intensity.addEventListener('input', requestRender);
function updateToggle() {
  toggle.textContent = paused ? 'Activar movimiento' : 'Pausar movimiento';
  toggle.setAttribute('aria-pressed', String(paused));
}
toggle.addEventListener('click', () => { paused = !paused; updateToggle(); reset(); syncScroll(); });
reduced.addEventListener('change', () => { paused = reduced.matches; updateToggle(); reset(); syncScroll(); });
document.querySelector('#clean').addEventListener('click', () => {
  stage.classList.add('clean');
  document.querySelector('#restore').hidden = false;
  document.querySelector('#restore').focus();
});
document.querySelector('#restore').addEventListener('click', () => {
  stage.classList.remove('clean');
  document.querySelector('#restore').hidden = true;
  document.querySelector('#clean').focus();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') document.querySelector('#restore').click(); });
updateToggle();
const flashDialog = document.querySelector('#flash-dialog');
const flashes = [
  { name: 'Serpiente', art: 'print-snake', description: 'Blackwork · Un símbolo de transformación.' },
  { name: 'Nocturna', art: 'print-moth', description: 'Dotwork · Para quienes encuentran belleza en la noche.' },
  { name: 'Amuleto', art: 'print-dagger', description: 'Línea fina · Delicadeza y fuerza en una misma pieza.' }
];
document.querySelectorAll('[data-flash]').forEach(button => {
  button.addEventListener('click', () => {
    const flash = flashes[Number(button.dataset.flash)];
    document.querySelector('#flash-title').textContent = flash.name;
    const detail = document.querySelector('#flash-detail');
    detail.className = 'flash-print ' + flash.art;
    detail.setAttribute('aria-label', flash.name + ', ilustración ampliada');
    document.querySelector('#flash-description').textContent = flash.description;
    flashDialog.showModal();
  });
});
flashDialog.addEventListener('click', event => {
  if (event.target === flashDialog) {
    const bounds = flashDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) flashDialog.close();
  }
});
syncScroll();
requestRender();
