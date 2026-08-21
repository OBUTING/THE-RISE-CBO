/* ==========================================================================
   GALLERY — photo grid + lightbox, video grid + modal, awareness downloads.
   ========================================================================== */

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}
function escapeAttr(str) { return escapeHTML(str).replace(/"/g, '&quot;'); }

const TONE_GRADIENTS = {
  terracotta: 'linear-gradient(135deg, #C1502E, #E8846A)',
  amber: 'linear-gradient(135deg, #C6852A, #F4C878)',
  emerald: 'linear-gradient(135deg, #0A4A34, #4B9B7F)',
  clay: 'linear-gradient(135deg, #8B4A3D, #C1502E)'
};
const PUBLIC_MEDIA_VISIBLE = false;
function toneGradient(tone) { return TONE_GRADIENTS[tone] || TONE_GRADIENTS.terracotta; }

/* ---------------- Photos + lightbox ---------------- */
function photoMediaInner(p) {
  if (p.imageSource === 'url' && p.imageUrl) return `<img src="${escapeAttr(p.imageUrl)}" alt="${escapeAttr(p.title)}" loading="lazy">`;
  if (p.imageSource === 'upload' && p.imageBlob) return `<img src="${URL.createObjectURL(p.imageBlob)}" alt="${escapeAttr(p.title)}" loading="lazy">`;
  return App.iconSVG(p.placeholderIcon || 'image');
}
async function renderPhotos() {
  const grid = document.getElementById('photo-grid');
  if (!grid) return;
  if (!PUBLIC_MEDIA_VISIBLE) {
    grid.innerHTML = '<p class="gallery-empty">Photos are managed privately by the admin.</p>';
    return;
  }
  const photos = await Store.getPhotos();
  if (!photos.length) { grid.innerHTML = '<p class="gallery-empty">No photos published yet \u2014 check back soon.</p>'; return; }
  grid.innerHTML = photos.map((p, i) => `
    <article class="photo-card" data-index="${i}" role="button" tabindex="0" aria-label="View photo: ${escapeAttr(p.title)}">
      <div class="photo-card-media" style="${p.imageSource === 'placeholder' ? `background:${toneGradient(p.placeholderTone)}` : ''}">
        ${photoMediaInner(p)}
        <span class="zoom-hint">${App.iconSVG('image')}</span>
      </div>
      <div class="photo-card-body">
        <h4>${escapeHTML(p.title)}</h4>
        <span class="badge badge-slate">${escapeHTML(p.category)}</span>
      </div>
    </article>`).join('');
  grid.querySelectorAll('.photo-card').forEach((card) => {
    const open = () => openLightbox(photos, Number(card.dataset.index));
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
}

let lightboxPhotos = [];
let lightboxIndex = 0;
function renderLightbox() {
  const item = lightboxPhotos[lightboxIndex];
  if (!item) return;
  const media = document.getElementById('lightbox-media');
  document.getElementById('lightbox-title').textContent = item.title;
  document.getElementById('lightbox-desc').textContent = item.description || '';
  media.removeAttribute('style');
  if (item.imageSource === 'url' && item.imageUrl) {
    media.innerHTML = `<img src="${escapeAttr(item.imageUrl)}" alt="${escapeAttr(item.title)}">`;
  } else if (item.imageSource === 'upload' && item.imageBlob) {
    media.innerHTML = `<img src="${URL.createObjectURL(item.imageBlob)}" alt="${escapeAttr(item.title)}">`;
  } else {
    media.style.background = toneGradient(item.placeholderTone);
    media.innerHTML = App.iconSVG(item.placeholderIcon || 'image');
  }
}
function openLightbox(photos, index) {
  lightboxPhotos = photos;
  lightboxIndex = index;
  renderLightbox();
  App.openModal('modal-lightbox');
}
const lightboxPrevBtn = document.getElementById('lightbox-prev');
const lightboxNextBtn = document.getElementById('lightbox-next');
if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', () => {
  if (!lightboxPhotos.length) return;
  lightboxIndex = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length;
  renderLightbox();
});
if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', () => {
  if (!lightboxPhotos.length) return;
  lightboxIndex = (lightboxIndex + 1) % lightboxPhotos.length;
  renderLightbox();
});

/* ---------------- Videos + modal ---------------- */
function toEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith('/embed/')) return url;
    }
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return `https://player.vimeo.com/video/${id}`;
    }
  } catch (e) { /* not a URL we recognise */ }
  return null;
}
async function renderVideos() {
  const grid = document.getElementById('video-grid');
  if (!grid) return;
  if (!PUBLIC_MEDIA_VISIBLE) {
    grid.innerHTML = '<p class="gallery-empty">Videos are managed privately by the admin.</p>';
    return;
  }
  const videos = await Store.getVideos();
  if (!videos.length) { grid.innerHTML = '<p class="gallery-empty">No videos published yet \u2014 check back soon.</p>'; return; }
  grid.innerHTML = videos.map((v, i) => `
    <article class="video-card" data-index="${i}" role="button" tabindex="0" aria-label="Play video: ${escapeAttr(v.title)}">
      <div class="video-thumb" style="${v.videoSource === 'placeholder' || !v.thumbnailUrl ? `background:${toneGradient(v.placeholderTone || 'terracotta')}` : ''}">
        ${v.thumbnailUrl ? `<img src="${escapeAttr(v.thumbnailUrl)}" alt="">` : ''}
        <span class="play-btn">${App.iconSVG('film')}</span>
      </div>
      <div class="video-card-body">
        <h4>${escapeHTML(v.title)}</h4>
        <p>${escapeHTML(v.description || '')}</p>
        <div class="video-tags">${(v.tags || []).map((t) => `<span class="badge badge-slate">${escapeHTML(t)}</span>`).join('')}</div>
      </div>
    </article>`).join('');
  grid.querySelectorAll('.video-card').forEach((card) => {
    const open = () => openVideoModal(videos[Number(card.dataset.index)]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
}
function openVideoModal(item) {
  const media = document.getElementById('video-modal-media');
  document.getElementById('video-modal-title').textContent = item.title;
  document.getElementById('video-modal-desc').textContent = item.description || '';
  media.innerHTML = '';
  if (item.videoSource === 'embed' && item.videoUrl) {
    const embed = toEmbedUrl(item.videoUrl);
    if (embed) {
      const iframe = document.createElement('iframe');
      iframe.src = embed;
      iframe.title = item.title;
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      media.appendChild(iframe);
    } else {
      const video = document.createElement('video');
      video.src = item.videoUrl; video.controls = true; video.autoplay = true;
      media.appendChild(video);
    }
  } else if (item.videoSource === 'upload' && item.videoBlob) {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(item.videoBlob);
    video.controls = true; video.autoplay = true;
    media.appendChild(video);
  } else {
    media.innerHTML = `<div class="video-placeholder">${App.iconSVG('film')}<p>Sample placeholder \u2014 the admin can add real footage from the Admin Portal.</p></div>`;
  }
  App.openModal('modal-video');
}
const videoModalEl = document.getElementById('modal-video');
if (videoModalEl) videoModalEl.addEventListener('click', (e) => {
  if (e.target.closest('[data-close-modal]') || e.target.classList.contains('modal-overlay')) {
    document.getElementById('video-modal-media').innerHTML = '';
  }
});

/* ---------------- Awareness downloads ---------------- */
function sanitizeFileName(name) {
  return (name || 'resource').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'resource';
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
let jsPDFLoadPromise = null;
function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
  if (jsPDFLoadPromise) return jsPDFLoadPromise;
  jsPDFLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the PDF library.'));
    document.head.appendChild(script);
  });
  return jsPDFLoadPromise;
}
function parseGuideBody(body) {
  return (body || '').split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    if (line.startsWith('# ')) return { type: 'h', text: line.slice(2) };
    if (line.startsWith('- ')) return { type: 'li', text: line.slice(2) };
    return { type: 'p', text: line };
  });
}
function downloadAsText(item) {
  const lines = parseGuideBody(item.guideBody).map((b) => (b.type === 'h' ? `\n${b.text.toUpperCase()}\n` : b.type === 'li' ? `\u2022 ${b.text}` : b.text));
  const text = `THE RISE CBO\nKahawa West, Nairobi\n\n${item.title}\n${'='.repeat(item.title.length)}\n\n${lines.join('\n')}\n`;
  const blob = new Blob([text], { type: 'text/plain' });
  downloadBlob(blob, sanitizeFileName(item.title) + '.txt');
}
async function generateGuidePDF(item) {
  await loadJsPDF();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - marginX * 2;
  const terracotta = [193, 80, 46], emerald = [15, 107, 76], slate = [61, 54, 46], muted = [140, 130, 118];

  doc.setFillColor(terracotta[0], terracotta[1], terracotta[2]);
  doc.rect(0, 0, pageWidth, 86, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('The Rise CBO', marginX, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Kahawa West, Nairobi \u2014 Awareness Resource', marginX, 60);

  let y = 118;
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  const titleLines = doc.splitTextToSize(item.title, maxWidth);
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 22 + 6;
  doc.setDrawColor(emerald[0], emerald[1], emerald[2]);
  doc.setLineWidth(1.6);
  doc.line(marginX, y, marginX + 60, y);
  y += 26;

  function ensureSpace(lineCount) {
    if (y + lineCount * 16 > pageHeight - 60) { doc.addPage(); y = 60; }
  }
  parseGuideBody(item.guideBody).forEach((b) => {
    if (b.type === 'h') {
      y += 8;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      const lines = doc.splitTextToSize(b.text, maxWidth);
      ensureSpace(lines.length);
      doc.setTextColor(terracotta[0], terracotta[1], terracotta[2]);
      doc.text(lines, marginX, y);
      y += lines.length * 17 + 4;
    } else if (b.type === 'li') {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
      const lines = doc.splitTextToSize('\u2022  ' + b.text, maxWidth - 10);
      ensureSpace(lines.length);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text(lines, marginX + 8, y);
      y += lines.length * 14.5 + 3;
    } else {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
      const lines = doc.splitTextToSize(b.text, maxWidth);
      ensureSpace(lines.length);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text(lines, marginX, y);
      y += lines.length * 14.5 + 6;
    }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text('The Rise CBO \u00b7 Kahawa West, Nairobi \u00b7 hello@therisecbo.org', marginX, pageHeight - 28);
    doc.text(String(i), pageWidth - marginX, pageHeight - 28, { align: 'right' });
  }
  doc.save(sanitizeFileName(item.title) + '.pdf');
}
function downloadCardHTML(d) {
  return `
    <article class="card download-card">
      <div class="download-card-top">
        <span class="download-icon">${App.iconSVG('file-down')}</span>
        <div>
          <h4>${escapeHTML(d.title)}</h4>
          <span class="badge badge-amber">${escapeHTML(d.category)}</span>
        </div>
      </div>
      <p>${escapeHTML(d.description || '')}</p>
      <div class="download-meta">
        <span>${d.downloadCount || 0} downloads</span>
        <button type="button" class="btn btn-secondary btn-sm" data-download-id="${escapeAttr(d.id)}">${App.iconSVG('download')} Download</button>
      </div>
    </article>`;
}
async function handleDownloadClick(item) {
  try {
    if (item.resourceType === 'upload' && item.fileBlob) {
      downloadBlob(item.fileBlob, item.fileName || sanitizeFileName(item.title));
    } else if (item.resourceType === 'generated') {
      try { await generateGuidePDF(item); } catch (pdfErr) { console.error(pdfErr); downloadAsText(item); }
    } else {
      downloadAsText(item);
    }
    await Store.incrementDownloadCount(item.id);
    renderDownloads();
    App.showToast('Download started \u2014 check your downloads folder.', 'success');
  } catch (err) {
    console.error(err);
    App.showToast('Could not prepare that download. Please try again.', 'error');
  }
}
async function renderDownloads() {
  const downloads = await Store.getDownloads();
  const targets = [
    { el: document.getElementById('downloads-grid'), items: downloads },
    { el: document.getElementById('home-downloads-row'), items: downloads.slice(0, 3) }
  ];
  targets.forEach(({ el, items }) => {
    if (!el) return;
    if (!PUBLIC_MEDIA_VISIBLE) {
      el.innerHTML = '<p class="gallery-empty">Resources are managed privately by the admin.</p>';
      return;
    }
    el.innerHTML = items.length ? items.map(downloadCardHTML).join('') : '<p class="gallery-empty">No resources published yet.</p>';
    el.querySelectorAll('[data-download-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = downloads.find((d) => d.id === btn.dataset.downloadId);
        if (item) handleDownloadClick(item);
      });
    });
  });
}

/* ---------------- Gallery filter tabs ---------------- */
function setGalleryFilter(filter) {
  document.querySelectorAll('.gallery-tab').forEach((btn) => {
    const active = btn.dataset.gtab === filter;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  const blocks = {
    photos: document.getElementById('gallery-block-photos'),
    videos: document.getElementById('gallery-block-videos'),
    downloads: document.getElementById('gallery-block-downloads')
  };
  Object.entries(blocks).forEach(([key, el]) => { if (el) el.hidden = !(filter === 'all' || filter === key); });
}
document.querySelectorAll('.gallery-tab').forEach((btn) => {
  btn.addEventListener('click', () => setGalleryFilter(btn.dataset.gtab));
});

async function refreshGallery() {
  await Promise.all([renderPhotos(), renderVideos(), renderDownloads()]);
}
document.addEventListener('store:ready', refreshGallery);

window.Gallery = { refresh: refreshGallery };
