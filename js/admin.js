/* ==========================================================================
   ADMIN — login/session, dashboard, content managers, inbox, settings.
   ========================================================================== */

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ---------------- Confirm dialog (generic) ---------------- */
let pendingConfirmAction = null;
function confirmAction(title, body, onConfirm, confirmLabel) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-body').textContent = body;
  document.getElementById('confirm-ok-btn').textContent = confirmLabel || 'Delete';
  pendingConfirmAction = onConfirm;
  App.openModal('modal-confirm');
}
document.getElementById('confirm-ok-btn').addEventListener('click', async () => {
  const action = pendingConfirmAction;
  pendingConfirmAction = null;
  App.closeModal(document.getElementById('modal-confirm'));
  if (action) await action();
});

/* ---------------- Auth ---------------- */
const DEFAULT_ADMIN_EMAIL = 'obutindahoras19@gmail';
function prefillDefaultAdminEmail() {
  const input = document.getElementById('admin-email');
  if (!input || input.value.trim()) return;
  input.value = DEFAULT_ADMIN_EMAIL;
}
async function checkAuthState() {
  const session = Store.getSession();
  const loginView = document.getElementById('admin-login-view');
  const dashView = document.getElementById('admin-dashboard-view');
  if (session) {
    loginView.hidden = true;
    dashView.hidden = false;
    await refreshAdminData();
  } else {
    loginView.hidden = false;
    dashView.hidden = true;
    prefillDefaultAdminEmail();
  }
}
document.addEventListener('store:ready', checkAuthState);

const loginForm = document.getElementById('form-admin-login');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('admin-login-error');
    errorEl.hidden = true;
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const remember = document.getElementById('admin-remember').checked;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const ok = await Store.verifyLogin(email, password);
      if (!ok) { errorEl.textContent = 'Incorrect email or password.'; errorEl.hidden = false; return; }
      Store.saveSession(email, remember);
      if (typeof loginForm.reset === 'function') loginForm.reset();
      App.showToast('Welcome back!', 'success');
      await checkAuthState();
    } catch (err) {
      console.error(err);
      errorEl.textContent = 'Something went wrong. Please try again.';
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function showAuthMessage(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('form-error', isError);
  el.classList.toggle('form-message', !isError);
  el.hidden = false;
}

function hideAuthMessage(el) {
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
}

function showForgotPasswordPanel() {
  const panel = document.getElementById('admin-forgot-panel');
  const resetPanel = document.getElementById('admin-reset-panel');
  const signupPanel = document.getElementById('admin-signup-panel');
  if (panel) panel.hidden = false;
  if (resetPanel) resetPanel.hidden = true;
  if (signupPanel) signupPanel.hidden = true;
}

function showSignupPanel() {
  const signupPanel = document.getElementById('admin-signup-panel');
  const forgotPanel = document.getElementById('admin-forgot-panel');
  const resetPanel = document.getElementById('admin-reset-panel');
  if (signupPanel) signupPanel.hidden = false;
  if (forgotPanel) forgotPanel.hidden = true;
  if (resetPanel) resetPanel.hidden = true;
}

function showResetPasswordPanel(email = '') {
  const panel = document.getElementById('admin-reset-panel');
  const forgotPanel = document.getElementById('admin-forgot-panel');
  if (panel) panel.hidden = false;
  if (forgotPanel) forgotPanel.hidden = true;
  if (email && document.getElementById('reset-email')) document.getElementById('reset-email').value = email;
}

function applyResetTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('reset');
  const email = params.get('email');
  if (!token || !email) return;
  showResetPasswordPanel(email);
  const tokenInput = document.getElementById('reset-token');
  if (tokenInput) tokenInput.value = token;
}

const forgotPasswordBtn = document.getElementById('admin-forgot-password');
if (forgotPasswordBtn) forgotPasswordBtn.addEventListener('click', showForgotPasswordPanel);

const signupToggleBtn = document.getElementById('admin-signup-toggle');
if (signupToggleBtn) signupToggleBtn.addEventListener('click', showSignupPanel);

const signupForm = document.getElementById('form-admin-signup');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('signup-status');
    hideAuthMessage(statusEl);
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
    if (password !== confirmPassword) {
      showAuthMessage(statusEl, 'The passwords do not match.', true);
      return;
    }
    submitBtn.disabled = true;
    try {
      await Store.createAccount(email, password);
      Store.saveSession(email, true);
      if (e.currentTarget && typeof e.currentTarget.reset === 'function') e.currentTarget.reset();
      App.showToast('Account created successfully.', 'success');
      await checkAuthState();
    } catch (err) {
      console.error(err);
      showAuthMessage(statusEl, err.message || 'We could not create your account.', true);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

const resetRequestForm = document.getElementById('form-admin-reset-request');
if (resetRequestForm) {
  resetRequestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('reset-request-status');
    hideAuthMessage(statusEl);
    const email = document.getElementById('reset-request-email').value.trim();
    const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const result = await Store.requestPasswordReset(email);
      const resetLink = `${window.location.origin}${window.location.pathname}?reset=${encodeURIComponent(result.token)}&email=${encodeURIComponent(result.email)}`;
      showAuthMessage(statusEl, `Reset instructions were prepared for ${result.email}. Use this link: ${resetLink}`, false);
      showResetPasswordPanel(result.email);
      const resetTokenInput = document.getElementById('reset-token');
      const resetEmailInput = document.getElementById('reset-email');
      if (resetTokenInput) resetTokenInput.value = result.token;
      if (resetEmailInput) resetEmailInput.value = result.email;
      App.showToast('Reset link created. Enter your new password below.', 'success');
    } catch (err) {
      console.error(err);
      showAuthMessage(statusEl, err.message || 'We could not create a reset link for that email.', true);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

const resetPasswordForm = document.getElementById('form-admin-password-reset');
if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('reset-password-status');
    hideAuthMessage(statusEl);
    const email = document.getElementById('reset-email').value.trim();
    const token = document.getElementById('reset-token').value.trim();
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;
    if (newPassword !== confirmPassword) {
      showAuthMessage(statusEl, 'The new passwords do not match.', true);
      return;
    }
    const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      await Store.resetPasswordWithToken(email, token, newPassword);
      showAuthMessage(statusEl, 'Password updated successfully. You can now sign in with your new password.', false);
      App.showToast('Password updated. Please sign in.', 'success');
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        const resetPanel = document.getElementById('admin-reset-panel');
        const forgotPanel = document.getElementById('admin-forgot-panel');
        if (resetPanel) resetPanel.hidden = true;
        if (forgotPanel) forgotPanel.hidden = true;
        const adminEmailInput = document.getElementById('admin-email');
        if (adminEmailInput) adminEmailInput.value = email;
        const adminPasswordInput = document.getElementById('admin-password');
        if (adminPasswordInput) adminPasswordInput.focus();
      }, 1000);
    } catch (err) {
      console.error(err);
      showAuthMessage(statusEl, err.message || 'Something went wrong while resetting your password.', true);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

const googleLoginForm = document.getElementById('form-google-login');
if (googleLoginForm) {
  googleLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('google-login-error');
    const email = document.getElementById('google-email').value.trim();
    const remember = document.getElementById('google-remember').checked;
    const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
    if (!errorEl) return;
    errorEl.hidden = true;
    submitBtn.disabled = true;
    try {
      const ok = await Store.loginWithGoogle(email, remember);
      if (!ok) {
        errorEl.textContent = 'This Google account is not linked to the admin portal.';
        errorEl.hidden = false;
        return;
      }
      Store.saveSession(email, remember);
      if (typeof googleLoginForm.reset === 'function') googleLoginForm.reset();
      const googleModal = document.getElementById('modal-google-login');
      if (googleModal) App.closeModal(googleModal);
      App.showToast('Signed in with Google.', 'success');
      await checkAuthState();
    } catch (err) {
      console.error(err);
      errorEl.textContent = 'Google sign-in is unavailable at the moment. Please try again.';
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });
}

const googleLoginBtn = document.getElementById('admin-google-btn');
if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => App.openModal('modal-google-login'));

document.getElementById('admin-password-toggle').addEventListener('click', () => {
  const input = document.getElementById('admin-password');
  const btn = document.getElementById('admin-password-toggle');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.innerHTML = App.iconSVG(show ? 'eye-off' : 'eye');
  btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});
document.getElementById('admin-logout-btn').addEventListener('click', () => {
  Store.clearSession();
  App.showToast('Logged out.', 'info');
  location.href = 'home.html';
});

applyResetTokenFromUrl();

/* ---------------- Admin nav / shell ---------------- */
function closeAdminSidebar() { document.querySelector('.admin-sidebar')?.classList.remove('is-open'); }
function setAdminView(view) {
  document.querySelectorAll('.admin-nav-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.adminView === view));
  document.querySelectorAll('.admin-view').forEach((v) => v.classList.toggle('is-active', v.id === `admin-view-${view}`));
  const titles = { dashboard: 'Dashboard', photos: 'Gallery Manager', videos: 'Video Manager', downloads: 'Downloads Manager', inbox: 'Inbox', settings: 'Settings' };
  document.getElementById('admin-view-title').textContent = titles[view] || view;
  closeAdminSidebar();
  window.scrollTo({ top: 0 });
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-admin-view]');
  if (btn) setAdminView(btn.dataset.adminView);
});
document.getElementById('admin-mobile-toggle').addEventListener('click', () => {
  document.querySelector('.admin-sidebar').classList.toggle('is-open');
});

/* ---------------- Dashboard ---------------- */
async function renderDashboard() {
  const stats = await Store.getDashboardStats();
  document.getElementById('stat-photos').textContent = stats.photoCount;
  document.getElementById('stat-videos').textContent = stats.videoCount;
  document.getElementById('stat-downloads').textContent = stats.downloadCount;
  document.getElementById('stat-download-count').textContent = stats.totalDownloadHits;
  document.getElementById('stat-inquiries').textContent = stats.pendingInquiries;
  const inboxCountEl = document.getElementById('inbox-nav-count');
  if (stats.pendingInquiries > 0) { inboxCountEl.hidden = false; inboxCountEl.textContent = stats.pendingInquiries; }
  else { inboxCountEl.hidden = true; }

  const recent = (await Store.getInquiries()).slice(0, 4);
  const wrap = document.getElementById('dashboard-recent-inquiries');
  wrap.innerHTML = recent.length ? recent.map(inquiryItemHTML).join('') : '<p class="admin-list-empty">No messages yet.</p>';
  bindInquiryActions(wrap);
}

/* ---------------- Photo manager ---------------- */
const photoForm = document.getElementById('form-add-photo');
const photoSourceType = document.getElementById('photo-source-type');
const photoUploadRow = document.getElementById('photo-upload-row');
const photoUrlRow = document.getElementById('photo-url-row');
photoSourceType.addEventListener('change', () => {
  const isUpload = photoSourceType.value === 'upload';
  photoUploadRow.hidden = !isUpload;
  photoUrlRow.hidden = isUpload;
});
let editingPhotoId = null;

function adminPhotoThumb(p) {
  if (p.imageSource === 'url' && p.imageUrl) return `<img src="${escapeAttr(p.imageUrl)}" alt="">`;
  if (p.imageSource === 'upload' && p.imageBlob) return `<img src="${URL.createObjectURL(p.imageBlob)}" alt="">`;
  return App.iconSVG(p.placeholderIcon || 'image');
}
function resetPhotoForm() {
  photoForm.reset();
  editingPhotoId = null;
  photoSourceType.value = 'upload';
  photoUploadRow.hidden = false;
  photoUrlRow.hidden = true;
  photoForm.querySelector('button[type="submit"]').innerHTML = `${App.iconSVG('upload')} Add Photo`;
}
async function editPhoto(id) {
  const item = (await Store.getPhotos()).find((p) => p.id === id);
  if (!item) return;
  editingPhotoId = id;
  document.getElementById('photo-title').value = item.title;
  document.getElementById('photo-category').value = item.category;
  document.getElementById('photo-date').value = item.eventDate || '';
  document.getElementById('photo-desc').value = item.description || '';
  if (item.imageSource === 'url') {
    photoSourceType.value = 'url'; photoUploadRow.hidden = true; photoUrlRow.hidden = false;
    document.getElementById('photo-url').value = item.imageUrl || '';
  } else {
    photoSourceType.value = 'upload'; photoUploadRow.hidden = false; photoUrlRow.hidden = true;
  }
  photoForm.querySelector('button[type="submit"]').innerHTML = `${App.iconSVG('check')} Update Photo`;
  photoForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function deletePhotoConfirm(id, title) {
  confirmAction('Delete this photo?', `\u201c${title}\u201d will be permanently removed from the gallery.`, async () => {
    await Store.deletePhoto(id);
    await renderAdminPhotos(); await renderDashboard();
    App.showToast('Photo deleted.', 'success');
  });
}
async function renderAdminPhotos() {
  const list = document.getElementById('admin-photos-list');
  const photos = await Store.getPhotos();
  if (!photos.length) { list.innerHTML = '<p class="admin-list-empty">No photos yet \u2014 add your first one above.</p>'; return; }
  list.innerHTML = photos.map((p) => `
    <div class="admin-list-item">
      <div class="ali-media" style="${p.imageSource === 'placeholder' ? `background:${toneGradient(p.placeholderTone)}` : ''}">${adminPhotoThumb(p)}</div>
      <div class="ali-info">
        <h4>${escapeHTML(p.title)}</h4>
        <div class="ali-meta"><span class="badge badge-slate">${escapeHTML(p.category)}</span><span class="plain">${formatDate(p.dateAdded)}</span></div>
      </div>
      <div class="ali-actions">
        <button type="button" class="btn-icon" data-edit-photo="${escapeAttr(p.id)}" aria-label="Edit ${escapeAttr(p.title)}">${App.iconSVG('edit')}</button>
        <button type="button" class="btn-icon" data-delete-photo="${escapeAttr(p.id)}" aria-label="Delete ${escapeAttr(p.title)}">${App.iconSVG('trash')}</button>
      </div>
    </div>`).join('');
  list.querySelectorAll('[data-edit-photo]').forEach((btn) => btn.addEventListener('click', () => editPhoto(btn.dataset.editPhoto)));
  list.querySelectorAll('[data-delete-photo]').forEach((btn) => {
    const item = photos.find((p) => p.id === btn.dataset.deletePhoto);
    btn.addEventListener('click', () => deletePhotoConfirm(btn.dataset.deletePhoto, item ? item.title : 'this item'));
  });
}
photoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('photo-form-error');
  errorEl.hidden = true;
  const title = document.getElementById('photo-title').value.trim();
  if (!title) { errorEl.textContent = 'Please add a title.'; errorEl.hidden = false; return; }
  const submitBtn = photoForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    let data = {
      title, category: document.getElementById('photo-category').value,
      eventDate: document.getElementById('photo-date').value,
      description: document.getElementById('photo-desc').value.trim()
    };
    if (photoSourceType.value === 'upload') {
      const file = document.getElementById('photo-file').files[0];
      if (file) {
        const resized = await Store.resizeImageFile(file);
        data = { ...data, imageSource: 'upload', imageBlob: resized, imageUrl: null, placeholderIcon: null, placeholderTone: null };
      } else if (!editingPhotoId) {
        errorEl.textContent = 'Please choose a file to upload.'; errorEl.hidden = false; submitBtn.disabled = false; return;
      }
    } else {
      const url = document.getElementById('photo-url').value.trim();
      if (!url) { errorEl.textContent = 'Please add an image URL.'; errorEl.hidden = false; submitBtn.disabled = false; return; }
      data = { ...data, imageSource: 'url', imageUrl: url, imageBlob: null, placeholderIcon: null, placeholderTone: null };
    }
    if (editingPhotoId) { await Store.updatePhoto(editingPhotoId, data); App.showToast('Photo updated.', 'success'); }
    else { await Store.addPhoto(data); App.showToast('Photo added.', 'success'); }
    resetPhotoForm();
    await renderAdminPhotos(); await renderDashboard();
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Something went wrong saving this photo.';
    errorEl.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------------- Video manager ---------------- */
const videoForm = document.getElementById('form-add-video');
const videoSourceType = document.getElementById('video-source-type');
const videoEmbedRow = document.getElementById('video-embed-row');
const videoUploadRow = document.getElementById('video-upload-row');
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
videoSourceType.addEventListener('change', () => {
  const isEmbed = videoSourceType.value === 'embed';
  videoEmbedRow.hidden = !isEmbed;
  videoUploadRow.hidden = isEmbed;
});
let editingVideoId = null;

function resetVideoForm() {
  videoForm.reset();
  editingVideoId = null;
  videoSourceType.value = 'embed';
  videoEmbedRow.hidden = false;
  videoUploadRow.hidden = true;
  videoForm.querySelector('button[type="submit"]').innerHTML = `${App.iconSVG('upload')} Add Video`;
}
async function editVideo(id) {
  const item = (await Store.getVideos()).find((v) => v.id === id);
  if (!item) return;
  editingVideoId = id;
  document.getElementById('video-title').value = item.title;
  document.getElementById('video-desc').value = item.description || '';
  document.getElementById('video-tags').value = (item.tags || []).join(', ');
  if (item.videoSource === 'upload') {
    videoSourceType.value = 'upload'; videoEmbedRow.hidden = true; videoUploadRow.hidden = false;
  } else {
    videoSourceType.value = 'embed'; videoEmbedRow.hidden = false; videoUploadRow.hidden = true;
    document.getElementById('video-embed-url').value = item.videoUrl || '';
  }
  videoForm.querySelector('button[type="submit"]').innerHTML = `${App.iconSVG('check')} Update Video`;
  videoForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function deleteVideoConfirm(id, title) {
  confirmAction('Delete this video?', `\u201c${title}\u201d will be permanently removed.`, async () => {
    await Store.deleteVideo(id);
    await renderAdminVideos(); await renderDashboard();
    App.showToast('Video deleted.', 'success');
  });
}
async function renderAdminVideos() {
  const list = document.getElementById('admin-videos-list');
  const videos = await Store.getVideos();
  if (!videos.length) { list.innerHTML = '<p class="admin-list-empty">No videos yet \u2014 add your first one above.</p>'; return; }
  list.innerHTML = videos.map((v) => `
    <div class="admin-list-item">
      <div class="ali-media" style="${v.videoSource !== 'upload' ? `background:${toneGradient(v.placeholderTone || 'terracotta')}` : ''}">${App.iconSVG('film')}</div>
      <div class="ali-info">
        <h4>${escapeHTML(v.title)}</h4>
        <div class="ali-meta"><span class="badge badge-slate">${v.videoSource === 'upload' ? 'Uploaded file' : v.videoSource === 'embed' ? 'Embed link' : 'Placeholder'}</span><span class="plain">${formatDate(v.dateAdded)}</span></div>
      </div>
      <div class="ali-actions">
        <button type="button" class="btn-icon" data-edit-video="${escapeAttr(v.id)}" aria-label="Edit ${escapeAttr(v.title)}">${App.iconSVG('edit')}</button>
        <button type="button" class="btn-icon" data-delete-video="${escapeAttr(v.id)}" aria-label="Delete ${escapeAttr(v.title)}">${App.iconSVG('trash')}</button>
      </div>
    </div>`).join('');
  list.querySelectorAll('[data-edit-video]').forEach((btn) => btn.addEventListener('click', () => editVideo(btn.dataset.editVideo)));
  list.querySelectorAll('[data-delete-video]').forEach((btn) => {
    const item = videos.find((v) => v.id === btn.dataset.deleteVideo);
    btn.addEventListener('click', () => deleteVideoConfirm(btn.dataset.deleteVideo, item ? item.title : 'this item'));
  });
}
videoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('video-form-error');
  errorEl.hidden = true;
  const title = document.getElementById('video-title').value.trim();
  if (!title) { errorEl.textContent = 'Please add a title.'; errorEl.hidden = false; return; }
  const submitBtn = videoForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    let data = {
      title,
      description: document.getElementById('video-desc').value.trim(),
      tags: document.getElementById('video-tags').value.split(',').map((t) => t.trim()).filter(Boolean)
    };
    if (videoSourceType.value === 'embed') {
      const url = document.getElementById('video-embed-url').value.trim();
      if (!url) { errorEl.textContent = 'Please add a video URL.'; errorEl.hidden = false; submitBtn.disabled = false; return; }
      data = { ...data, videoSource: 'embed', videoUrl: url, videoBlob: null, placeholderIcon: null, placeholderTone: null };
    } else {
      const file = document.getElementById('video-file').files[0];
      if (file) {
        if (file.size > MAX_VIDEO_BYTES) { errorEl.textContent = 'That file is over 40MB \u2014 try an embed link instead for large videos.'; errorEl.hidden = false; submitBtn.disabled = false; return; }
        data = { ...data, videoSource: 'upload', videoBlob: file, videoUrl: null, placeholderIcon: null, placeholderTone: null };
      } else if (!editingVideoId) {
        errorEl.textContent = 'Please choose a video file.'; errorEl.hidden = false; submitBtn.disabled = false; return;
      }
    }
    if (editingVideoId) { await Store.updateVideo(editingVideoId, data); App.showToast('Video updated.', 'success'); }
    else { await Store.addVideo(data); App.showToast('Video added.', 'success'); }
    resetVideoForm();
    await renderAdminVideos(); await renderDashboard();
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Something went wrong saving this video.';
    errorEl.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------------- Downloads manager ---------------- */
const downloadForm = document.getElementById('form-add-download');
const downloadSourceType = document.getElementById('download-source-type');
const downloadUploadRow = document.getElementById('download-upload-row');
const downloadGeneratedRow = document.getElementById('download-generated-row');
downloadSourceType.addEventListener('change', () => {
  const isUpload = downloadSourceType.value === 'upload';
  downloadUploadRow.hidden = !isUpload;
  downloadGeneratedRow.hidden = isUpload;
});
let editingDownloadId = null;

function resetDownloadForm() {
  downloadForm.reset();
  editingDownloadId = null;
  downloadSourceType.value = 'generated';
  downloadUploadRow.hidden = true;
  downloadGeneratedRow.hidden = false;
  downloadForm.querySelector('button[type="submit"]').innerHTML = `${App.iconSVG('upload')} Add Resource`;
}
async function editDownload(id) {
  const item = (await Store.getDownloads()).find((d) => d.id === id);
  if (!item) return;
  editingDownloadId = id;
  document.getElementById('download-title').value = item.title;
  document.getElementById('download-category').value = item.category;
  document.getElementById('download-summary').value = item.description || '';
  if (item.resourceType === 'upload') {
    downloadSourceType.value = 'upload'; downloadUploadRow.hidden = false; downloadGeneratedRow.hidden = true;
  } else {
    downloadSourceType.value = 'generated'; downloadUploadRow.hidden = true; downloadGeneratedRow.hidden = false;
    document.getElementById('download-body').value = item.guideBody || '';
  }
  downloadForm.querySelector('button[type="submit"]').innerHTML = `${App.iconSVG('check')} Update Resource`;
  downloadForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function deleteDownloadConfirm(id, title) {
  confirmAction('Delete this resource?', `\u201c${title}\u201d will be permanently removed.`, async () => {
    await Store.deleteDownload(id);
    await renderAdminDownloads(); await renderDashboard();
    App.showToast('Resource deleted.', 'success');
  });
}
async function renderAdminDownloads() {
  const list = document.getElementById('admin-downloads-list');
  const downloads = await Store.getDownloads();
  if (!downloads.length) { list.innerHTML = '<p class="admin-list-empty">No resources yet \u2014 add your first one above.</p>'; return; }
  list.innerHTML = downloads.map((d) => `
    <div class="admin-list-item">
      <div class="ali-media">${App.iconSVG('file-down')}</div>
      <div class="ali-info">
        <h4>${escapeHTML(d.title)}</h4>
        <div class="ali-meta"><span class="badge badge-amber">${escapeHTML(d.category)}</span><span class="plain">${d.downloadCount || 0} downloads</span><span class="plain">${formatDate(d.dateAdded)}</span></div>
      </div>
      <div class="ali-actions">
        <button type="button" class="btn-icon" data-edit-download="${escapeAttr(d.id)}" aria-label="Edit ${escapeAttr(d.title)}">${App.iconSVG('edit')}</button>
        <button type="button" class="btn-icon" data-delete-download="${escapeAttr(d.id)}" aria-label="Delete ${escapeAttr(d.title)}">${App.iconSVG('trash')}</button>
      </div>
    </div>`).join('');
  list.querySelectorAll('[data-edit-download]').forEach((btn) => btn.addEventListener('click', () => editDownload(btn.dataset.editDownload)));
  list.querySelectorAll('[data-delete-download]').forEach((btn) => {
    const item = downloads.find((d) => d.id === btn.dataset.deleteDownload);
    btn.addEventListener('click', () => deleteDownloadConfirm(btn.dataset.deleteDownload, item ? item.title : 'this item'));
  });
}
downloadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('download-form-error');
  errorEl.hidden = true;
  const title = document.getElementById('download-title').value.trim();
  if (!title) { errorEl.textContent = 'Please add a title.'; errorEl.hidden = false; return; }
  const submitBtn = downloadForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    let data = { title, category: document.getElementById('download-category').value, description: document.getElementById('download-summary').value.trim() };
    if (downloadSourceType.value === 'upload') {
      const file = document.getElementById('download-file').files[0];
      if (file) { data = { ...data, resourceType: 'upload', fileBlob: file, fileName: file.name, guideBody: null }; }
      else if (!editingDownloadId) { errorEl.textContent = 'Please choose a file to upload.'; errorEl.hidden = false; submitBtn.disabled = false; return; }
    } else {
      const body = document.getElementById('download-body').value.trim();
      if (!body) { errorEl.textContent = 'Please write some guide content.'; errorEl.hidden = false; submitBtn.disabled = false; return; }
      data = { ...data, resourceType: 'generated', guideBody: body, fileBlob: null, fileName: null };
    }
    if (editingDownloadId) { await Store.updateDownload(editingDownloadId, data); App.showToast('Resource updated.', 'success'); }
    else { await Store.addDownload(data); App.showToast('Resource added.', 'success'); }
    resetDownloadForm();
    await renderAdminDownloads(); await renderDashboard();
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Something went wrong saving this resource.';
    errorEl.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------------- Inbox ---------------- */
const TYPE_LABELS = { volunteer: 'Volunteer', donate: 'Donate', partner: 'Partner', general: 'General' };
function inquiryItemHTML(inq) {
  const badgeClass = inq.type === 'volunteer' ? 'badge-terracotta' : inq.type === 'donate' ? 'badge-amber' : inq.type === 'partner' ? '' : 'badge-slate';
  return `
    <div class="inquiry-item ${inq.status === 'new' ? 'is-unread' : ''}">
      <div class="inquiry-head">
        <div class="inquiry-who">
          <strong>${escapeHTML(inq.name)}</strong>
          <span class="badge ${badgeClass}">${escapeHTML(TYPE_LABELS[inq.type] || inq.type)}</span>
          ${inq.status === 'replied' ? '<span class="badge badge-slate">Replied</span>' : ''}
        </div>
        <span class="inquiry-date">${formatDate(inq.dateSubmitted)}</span>
      </div>
      <div class="inquiry-contact">
        <span>${escapeHTML(inq.email)}</span>
        ${inq.phone ? `<span>${escapeHTML(inq.phone)}</span>` : ''}
        ${inq.interestArea ? `<span>${escapeHTML(inq.interestArea)}</span>` : ''}
      </div>
      <p class="inquiry-message">${escapeHTML(inq.message)}</p>
      <div class="inquiry-actions">
        ${inq.status === 'new' ? `<button type="button" class="btn btn-outline btn-sm" data-mark-read="${escapeAttr(inq.id)}">${App.iconSVG('check')} Mark Read</button>` : ''}
        ${inq.status !== 'replied' ? `<button type="button" class="btn btn-secondary btn-sm" data-mark-replied="${escapeAttr(inq.id)}">${App.iconSVG('check-circle')} Mark Replied</button>` : ''}
        <button type="button" class="btn btn-danger btn-sm" data-delete-inquiry="${escapeAttr(inq.id)}">${App.iconSVG('trash')} Delete</button>
      </div>
    </div>`;
}
function bindInquiryActions(container) {
  container.querySelectorAll('[data-mark-read]').forEach((btn) => btn.addEventListener('click', async () => {
    await Store.updateInquiry(btn.dataset.markRead, { status: 'read' });
    await renderInbox(); await renderDashboard();
  }));
  container.querySelectorAll('[data-mark-replied]').forEach((btn) => btn.addEventListener('click', async () => {
    await Store.updateInquiry(btn.dataset.markReplied, { status: 'replied' });
    await renderInbox(); await renderDashboard();
  }));
  container.querySelectorAll('[data-delete-inquiry]').forEach((btn) => btn.addEventListener('click', () => {
    confirmAction('Delete this message?', 'This cannot be undone.', async () => {
      await Store.deleteInquiry(btn.dataset.deleteInquiry);
      await renderInbox(); await renderDashboard();
      App.showToast('Message deleted.', 'success');
    });
  }));
}
async function renderInbox() {
  const list = document.getElementById('admin-inbox-list');
  const filter = document.getElementById('inbox-filter').value;
  let inquiries = await Store.getInquiries();
  if (filter !== 'all') inquiries = inquiries.filter((i) => i.type === filter);
  list.innerHTML = inquiries.length ? inquiries.map(inquiryItemHTML).join('') : '<p class="admin-list-empty">No messages in this category.</p>';
  bindInquiryActions(list);
}
document.getElementById('inbox-filter').addEventListener('change', renderInbox);
function csvEscape(val) {
  const str = String(val == null ? '' : val);
  return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
}
document.getElementById('inbox-export-csv').addEventListener('click', async () => {
  const inquiries = await Store.getInquiries();
  const headers = ['Date', 'Type', 'Name', 'Email', 'Phone', 'Interest Area', 'Message', 'Status'];
  const rows = inquiries.map((i) => [formatDate(i.dateSubmitted), TYPE_LABELS[i.type] || i.type, i.name, i.email, i.phone, i.interestArea, i.message, i.status]);
  const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), 'rise-cbo-inquiries.csv');
  App.showToast('CSV exported.', 'success');
});
document.addEventListener('inquiry:added', () => { renderDashboard(); if (!document.getElementById('admin-dashboard-view').hidden) renderInbox(); });

/* ---------------- Settings ---------------- */
async function populateStatsForm() {
  const stats = await Store.getImpactStats();
  document.getElementById('stat-input-children').value = stats.children;
  document.getElementById('stat-input-women').value = stats.women;
  document.getElementById('stat-input-products').value = stats.products;
  document.getElementById('stat-input-library').value = stats.library;
}
document.getElementById('form-impact-stats').addEventListener('submit', async (e) => {
  e.preventDefault();
  const stats = {
    children: Number(document.getElementById('stat-input-children').value) || 0,
    women: Number(document.getElementById('stat-input-women').value) || 0,
    products: Number(document.getElementById('stat-input-products').value) || 0,
    library: Number(document.getElementById('stat-input-library').value) || 0
  };
  await Store.setImpactStats(stats);
  await applyImpactStats();
  App.showToast('Impact stats saved.', 'success');
});
document.getElementById('form-change-password').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('cp-error');
  errorEl.hidden = true;
  const current = document.getElementById('cp-current').value;
  const next = document.getElementById('cp-new').value;
  const confirmVal = document.getElementById('cp-confirm').value;
  if (next.length < 8) { errorEl.textContent = 'New password must be at least 8 characters.'; errorEl.hidden = false; return; }
  if (next !== confirmVal) { errorEl.textContent = 'New passwords do not match.'; errorEl.hidden = false; return; }
  try {
    await Store.changePassword(current, next);
    e.target.reset();
    App.showToast('Password updated.', 'success');
  } catch (err) {
    errorEl.textContent = err.message || 'Could not update password.';
    errorEl.hidden = false;
  }
});
document.getElementById('export-backup-btn').addEventListener('click', async () => {
  try {
    const backup = await Store.exportBackup();
    downloadBlob(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }), `rise-cbo-backup-${new Date().toISOString().slice(0, 10)}.json`);
    App.showToast('Backup exported.', 'success');
  } catch (err) {
    console.error(err);
    App.showToast('Could not export backup.', 'error');
  }
});
document.getElementById('import-backup-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    await Store.importBackup(backup);
    App.showToast('Backup restored.', 'success');
    await refreshAdminData();
    await applyImpactStats();
  } catch (err) {
    console.error(err);
    App.showToast('That file could not be read as a valid backup.', 'error');
  } finally {
    e.target.value = '';
  }
});
document.getElementById('reset-demo-btn').addEventListener('click', () => {
  confirmAction(
    'Restore demo content?',
    'Photos, videos, awareness resources and impact stats reset to the starter demo set. Your messages inbox and admin login are not affected.',
    async () => {
      await Store.restoreDemoContent();
      App.showToast('Demo content restored.', 'success');
      await refreshAdminData();
      await applyImpactStats();
    },
    'Restore Demo Data'
  );
});

/* ---------------- Aggregate refresh ---------------- */
async function refreshAdminData() {
  document.getElementById('admin-user-email').textContent = await Store.getAdminEmail();
  await Promise.all([renderDashboard(), renderAdminPhotos(), renderAdminVideos(), renderAdminDownloads(), renderInbox(), populateStatsForm()]);
}
