/* ==========================================================================
   APP — routing, icon system, modal/toast infrastructure, page motion.
   ========================================================================== */

/* ---------------- Icon set (hand-drawn, 24x24, stroke-based) ---------------- */
const ICON_PATHS = {
  menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  heart: '<path d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2.4 4.8 6 4.4c2-.2 3.6.8 6 3.3 2.4-2.5 4-3.5 6-3.3 3.6.4 5.5 3.8 4 7.3C19.5 16.4 12 21 12 21z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6 6-2z"/>',
  'arrow-right': '<line x1="4" y1="12" x2="20" y2="12"/><path d="M14 6l6 6-6 6"/>',
  'arrow-left': '<line x1="20" y1="12" x2="4" y2="12"/><path d="M10 6l-6 6 6 6"/>',
  book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5c-.8 0-1.5-.7-1.5-1.5v-13z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5v-13z"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 19c.7-3 3-4.8 6.2-4.8s5.5 1.8 6.2 4.8"/><circle cx="17" cy="8.5" r="2.6"/><path d="M15.5 14.4c2.6.3 4.4 2 5 4.6"/>',
  'heart-pulse': '<path d="M12 20.5s-6.8-4.2-9.1-8.5C1.3 8.9 3 5.9 6.2 5.5c1.8-.2 3.3.7 5.4 3 2.1-2.3 3.6-3.2 5.4-3 3.2.4 5 3.4 3.3 6.5-2.3 4.3-9.1 8.5-9.1 8.5z"/><path d="M6 12h2.5l1.5-3 2 6 1.5-3H16"/>',
  trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 5H4v1a4 4 0 0 0 4 4"/><path d="M17 5h3v1a4 4 0 0 1-4 4"/><line x1="12" y1="13" x2="12" y2="17"/><path d="M9 17h6l1 4H8l1-4z"/>',
  shield: '<path d="M12 3l7 3v6c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9V6l7-3z"/>',
  lightbulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2h5c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z"/>',
  link: '<circle cx="7" cy="17" r="2.6"/><circle cx="17" cy="7" r="2.6"/><line x1="9" y1="15" x2="15" y2="9"/>',
  scale: '<line x1="12" y1="3" x2="12" y2="21"/><line x1="5" y1="7" x2="19" y2="7"/><path d="M5 7l-3 6a3 3 0 0 0 6 0L5 7z"/><path d="M19 7l-3 6a3 3 0 0 0 6 0l-3-6z"/><path d="M8 21h8"/>',
  leaf: '<path d="M5 19C3 12 7 5 20 4c1 10-4 16-15 15z"/><path d="M5 19c3-5 7-8 12-10"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"/>',
  'alert-circle': '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/>',
  'trending-up': '<polyline points="3,17 9,11 13,15 21,6"/><polyline points="15,6 21,6 21,12"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.1 0L4 19"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="4" x2="9" y2="20"/>',
  download: '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 19h16"/>',
  upload: '<path d="M12 21V9"/><path d="M7 13l5-5 5 5"/><path d="M4 19h16"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
  phone: '<path d="M6 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2L20 15v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 6.2 2 2 0 0 1 6 3z"/>',
  'map-pin': '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.4"/>',
  'message-circle': '<path d="M4 12a8 8 0 1 1 3.5 6.6L4 20l1.4-3.6A7.9 7.9 0 0 1 4 12z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 16,14"/>',
  navigation: '<path d="M12 2l8 18-8-4-8 4 8-18z"/>',
  check: '<polyline points="4,13 9,18 20,6"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><polyline points="8,12.5 11,15.5 16,9"/>',
  send: '<path d="M4 11l16-7-6 16-3-6-7-3z"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  eye: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',
  'eye-off': '<path d="M3 3l18 18"/><path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6.5 0 10 6.5 10 6.5a15.6 15.6 0 0 1-3.4 4.2M6.6 6.6C4 8.3 2 12 2 12s3.5 6.5 10 6.5c1.4 0 2.7-.3 3.8-.8"/><path d="M9.5 9.8a2.6 2.6 0 0 0 3.7 3.7"/>',
  'log-in': '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/>',
  'log-out': '<path d="M14 7l-5 5 5 5"/><path d="M9 12h12"/><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/>',
  grid: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  inbox: '<path d="M3 12h5l1.5 3h5L16 12h5"/><path d="M5 5h14l2 7v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7l2-7z"/>',
  settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19.1 4.9l-2.1 2.1M7 15l-2.1 2.1M19.1 19.1L17 17M7 9L4.9 4.9"/>',
  'refresh-cw': '<path d="M4 12a8 8 0 0 1 14-5.3L20 8"/><polyline points="20,3 20,8 15,8"/><path d="M20 12a8 8 0 0 1-14 5.3L4 16"/><polyline points="4,21 4,16 9,16"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4.5 4-6.8 8-6.8s7 2.3 8 6.8"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  handshake: '<rect x="2" y="9" width="8" height="5" rx="2.5" transform="rotate(-8 6 11.5)"/><rect x="14" y="9" width="8" height="5" rx="2.5" transform="rotate(8 18 11.5)"/><circle cx="12" cy="11.3" r="2.6"/>',
  gift: '<rect x="3" y="9" width="18" height="4" rx="1"/><rect x="5" y="13" width="14" height="8" rx="1"/><line x1="12" y1="9" x2="12" y2="21"/><circle cx="9" cy="6" r="2.3"/><circle cx="15" cy="6" r="2.3"/>',
  'hand-heart': '<path d="M12 15.5c-2-1.3-5.5-3.7-5.5-6.8 0-2 1.5-3.4 3.3-3.1 1 .2 1.6.9 2.2 2 .6-1.1 1.2-1.8 2.2-2 1.8-.3 3.3 1.1 3.3 3.1 0 3.1-3.5 5.5-5.5 6.8z"/><path d="M5 18.5c1.5-1.8 4-2.8 7-2.8s5.5 1 7 2.8"/>',
  'file-down': '<path d="M8 3h6l4 4v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/><path d="M12 11v6"/><path d="M9.5 15l2.5 2.5 2.5-2.5"/>',
  'chevron-left': '<polyline points="15,4 7,12 15,20"/>',
  'chevron-right': '<polyline points="9,4 17,12 9,20"/>',
  'alert-triangle': '<path d="M12 4l9.5 16.5H2.5L12 4z"/><line x1="12" y1="10" x2="12" y2="14.5"/><circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  edit: '<path d="M4 17.5V20h2.5L18.4 8.1a1.8 1.8 0 0 0 0-2.5L18 5.1a1.8 1.8 0 0 0-2.5 0L4 17.5z"/><line x1="13.5" y1="7" x2="17" y2="10.5"/>',
  plus: '<line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/>'
};

function iconSVG(name) {
  const inner = ICON_PATHS[name];
  if (!inner) return '';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
function hydrateIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach((el) => {
    const name = el.getAttribute('data-icon');
    el.innerHTML = iconSVG(name);
  });
}

/* ---------------- Toasts ---------------- */
function showToast(message, type) {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'check';
  el.innerHTML = iconSVG(iconName) + '<span></span>';
  el.querySelector('span').textContent = message;
  region.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 260);
  }, 3800);
}

/* ---------------- Modals ---------------- */
let lastFocusedEl = null;
function openModal(id, triggerEl) {
  const modal = document.getElementById(id);
  if (!modal) return;
  lastFocusedEl = triggerEl || document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  const focusable = modal.querySelector('input, select, textarea, button, a[href]');
  if (focusable) focusable.focus();
  document.dispatchEvent(new CustomEvent('modal:opened', { detail: { modalId: id, triggerEl } }));
}
function closeModal(modalEl) {
  if (!modalEl || modalEl.hidden) return;
  const id = modalEl.id;
  modalEl.hidden = true;
  document.body.style.overflow = '';
  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
  document.dispatchEvent(new CustomEvent('modal:closed', { detail: { modalId: id } }));
}
document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open-modal]');
  if (opener) { openModal(opener.dataset.openModal, opener); return; }
  const closer = e.target.closest('[data-close-modal]');
  if (closer) { closeModal(closer.closest('.modal-overlay')); return; }
  if (e.target.classList && e.target.classList.contains('modal-overlay')) closeModal(e.target);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach((m) => { if (!m.hidden) closeModal(m); });
  }
});

/* ---------------- Program tabs (programs.html only; no-ops elsewhere) ---------------- */
function closeMobileNav() {
  const nav = document.getElementById('nav-mobile');
  const toggle = document.getElementById('nav-toggle');
  if (!nav) return;
  nav.hidden = true;
  nav.classList.remove('is-open');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}
function activateProgramTab(tab) {
  document.querySelectorAll('.program-tab').forEach((btn) => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('.program-panel').forEach((panel) => {
    const active = panel.id === `tab-${tab}`;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
}
document.querySelectorAll('.program-tab').forEach((btn) => {
  btn.addEventListener('click', () => activateProgramTab(btn.dataset.tab));
});
// Support deep links like programs.html#women from other pages' pillar cards.
(function initProgramTabFromHash() {
  const tabs = document.querySelectorAll('.program-tab');
  if (!tabs.length) return;
  const requested = (location.hash || '').replace('#', '');
  if (requested && document.getElementById(`tab-${requested}`)) activateProgramTab(requested);
})();

/* ---------------- Mobile nav ---------------- */
const navToggleBtn = document.getElementById('nav-toggle');
if (navToggleBtn) {
  navToggleBtn.addEventListener('click', () => {
    const nav = document.getElementById('nav-mobile');
    const isOpen = nav.classList.contains('is-open');
    if (isOpen) closeMobileNav();
    else { nav.hidden = false; nav.classList.add('is-open'); navToggleBtn.setAttribute('aria-expanded', 'true'); }
  });
}

/* ---------------- Bead-row signature motif ---------------- */
function fillBeadRow(el) {
  const width = el.clientWidth || (el.parentElement ? el.parentElement.clientWidth : 320) || 320;
  const count = Math.max(12, Math.ceil(width / 16));
  el.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) frag.appendChild(document.createElement('span'));
  el.appendChild(frag);
}
function initBeadRows() {
  document.querySelectorAll('.bead-row[data-beads]').forEach(fillBeadRow);
}
let beadResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(beadResizeTimer);
  beadResizeTimer = setTimeout(initBeadRows, 200);
});

/* ---------------- Hero illustration: ripples of mentorship ---------------- */
function renderHeroArt() {
  const el = document.getElementById('hero-art');
  if (!el) return;
  const size = 460;
  const cx = size / 2, cy = size / 2;
  const colors = ['#C1502E', '#E8A33D', '#0F6B4C', '#8B4A3D'];
  let dots = '';
  for (let r = 1; r <= 4; r++) {
    const radius = r * 46;
    const count = r * 6;
    const dotSize = Math.max(4.5, 11 - r * 1.5);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + r * 0.4;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.86;
      const color = colors[(r + i) % colors.length];
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${dotSize}" fill="${color}" opacity="${(0.92 - r * 0.1).toFixed(2)}" />`;
    }
  }
  el.innerHTML = `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Illustration of mentorship rippling outward through the community" class="hero-ripple">
    <circle cx="${cx}" cy="${cy}" r="30" fill="#3D362E" />
    <circle cx="${cx}" cy="${cy}" r="15" fill="#F8F1E4" />
    ${dots}
  </svg>`;
}

/* ---------------- Scroll reveal ---------------- */
function initScrollReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in-view')); return; }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((el) => obs.observe(el));
}

/* ---------------- Impact counters ---------------- */
function initImpactCounters() {
  const counters = document.querySelectorAll('.impact-number');
  if (!counters.length) return;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const duration = 1300;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };
  if (!('IntersectionObserver' in window)) { counters.forEach(animate); return; }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { animate(entry.target); obs.unobserve(entry.target); } });
  }, { threshold: 0.4 });
  counters.forEach((el) => obs.observe(el));
}
async function applyImpactStats() {
  const stats = await Store.getImpactStats();
  document.querySelectorAll('[data-stat-key]').forEach((el) => {
    const key = el.dataset.statKey;
    if (stats[key] != null) el.dataset.count = stats[key];
  });
}

/* ---------------- Init ---------------- */
document.addEventListener('DOMContentLoaded', async () => {
  hydrateIcons(document);
  renderHeroArt();
  initBeadRows();
  initScrollReveal();
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  try {
    await Store.init();
    await applyImpactStats();
    initImpactCounters();
    document.dispatchEvent(new CustomEvent('store:ready'));
  } catch (err) {
    console.error('Failed to initialize local database:', err);
    showToast('Could not load local data. Try a different browser or check storage settings.', 'error');
  }
});

window.App = { showToast, openModal, closeModal, hydrateIcons, iconSVG, activateProgramTab };
