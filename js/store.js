/* ==========================================================================
   STORE — IndexedDB data layer for The Rise CBO site.
   Everything here is client-side: content lives in each visitor's own
   browser. See README.md for what that means for a real deployment.
   ========================================================================== */

const Store = (() => {
  const DB_NAME = 'riseCboDB';
  const DB_VERSION = 1;
  const SESSION_KEY = 'rise_admin_session';
  const DEFAULT_STATS = { children: 150, women: 80, products: 500, library: 60 };

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('downloads')) db.createObjectStore('downloads', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('inquiries')) db.createObjectStore('inquiries', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
    return dbPromise;
  }

  function reqToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getAll(storeName) {
    const db = await openDB();
    const store = db.transaction(storeName, 'readonly').objectStore(storeName);
    return reqToPromise(store.getAll());
  }
  async function getOne(storeName, key) {
    const db = await openDB();
    const store = db.transaction(storeName, 'readonly').objectStore(storeName);
    return reqToPromise(store.get(key));
  }
  async function put(storeName, value) {
    const db = await openDB();
    const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
    await reqToPromise(store.put(value));
    return value;
  }
  async function remove(storeName, key) {
    const db = await openDB();
    const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
    await reqToPromise(store.delete(key));
  }
  async function clearStore(storeName) {
    const db = await openDB();
    const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
    await reqToPromise(store.clear());
  }

  function genId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }
  function sortByDateDesc(arr) {
    return arr.slice().sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  }

  /* ---------------- Hashing (Web Crypto with a non-secure-context fallback) ---------------- */
  async function sha256Hex(text) {
    try {
      if (window.crypto && window.crypto.subtle) {
        const enc = new TextEncoder().encode(text);
        const buf = await window.crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) { /* fall through */ }
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
      const ch = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  }

  /* ---------------- Auth ---------------- */
  function normalizeAdminEmail(value) {
    const email = String(value || '').toLowerCase().trim();
    if (!email) return '';
    return email.endsWith('.com') ? email.slice(0, -4) : email;
  }
  async function ensureDefaultAdmin() {
    const existing = await getOne('meta', 'adminAuth');
    const desiredEmail = 'obutindahoras19@gmail';
    if (existing) {
      if (normalizeAdminEmail(existing.email) !== normalizeAdminEmail(desiredEmail)) {
        await put('meta', { ...existing, email: desiredEmail });
      }
      return;
    }
    const passwordHash = await sha256Hex('9A5X4v??');
    await put('meta', { key: 'adminAuth', email: desiredEmail, passwordHash });
  }
  async function verifyLogin(email, password) {
    const auth = await getOne('meta', 'adminAuth');
    if (!auth) return false;
    const hash = await sha256Hex(password);
    return normalizeAdminEmail(auth.email) === normalizeAdminEmail(email) && auth.passwordHash === hash;
  }
  async function getAdminEmail() {
    const auth = await getOne('meta', 'adminAuth');
    return auth ? auth.email : 'obutindahoras19@gmail';
  }
  async function createAccount(email, password) {
    const trimmedEmail = String(email || '').trim();
    const trimmedPassword = String(password || '');
    if (!trimmedEmail || !trimmedPassword) throw new Error('Please complete all sign-up fields.');
    if (trimmedPassword.length < 8) throw new Error('Your password must be at least 8 characters long.');
    const auth = await getOne('meta', 'adminAuth');
    const desiredEmail = normalizeAdminEmail(trimmedEmail);
    if (!desiredEmail) throw new Error('Please enter a valid email address.');
    if (auth) {
      const currentEmail = normalizeAdminEmail(auth.email);
      const defaultEmail = normalizeAdminEmail('obutindahoras19@gmail');
      if (currentEmail !== desiredEmail && currentEmail !== defaultEmail) {
        throw new Error('An admin account already exists for another email address. Please sign in instead.');
      }
    }
    const passwordHash = await sha256Hex(trimmedPassword);
    const nextEmail = trimmedEmail.toLowerCase();
    await put('meta', { key: 'adminAuth', email: nextEmail, passwordHash });
    return true;
  }
  async function loginWithGoogle(email, remember) {
    const auth = await getOne('meta', 'adminAuth');
    if (!auth) return false;
    return normalizeAdminEmail(auth.email) === normalizeAdminEmail(email);
  }
  async function requestPasswordReset(email) {
    const auth = await getOne('meta', 'adminAuth');
    const normalizedEmail = normalizeAdminEmail(email);
    if (!auth || normalizeAdminEmail(auth.email) !== normalizedEmail) {
      throw new Error('No account is registered for that email address.');
    }
    const resetToken = `${Date.now().toString(36)}-${genId()}`;
    const resetRecord = { key: 'adminPasswordReset', email: auth.email, token: resetToken, expiresAt: Date.now() + 60 * 60 * 1000 };
    await put('meta', resetRecord);
    return { email: auth.email, token: resetToken };
  }
  async function resetPasswordWithToken(email, token, newPassword) {
    const auth = await getOne('meta', 'adminAuth');
    const resetRecord = await getOne('meta', 'adminPasswordReset');
    const normalizedEmail = normalizeAdminEmail(email);
    if (!auth || !resetRecord || normalizeAdminEmail(auth.email) !== normalizedEmail) {
      throw new Error('This reset request is invalid.');
    }
    if (resetRecord.email !== auth.email || resetRecord.token !== token) {
      throw new Error('The reset code does not match this email address.');
    }
    if (Date.now() > resetRecord.expiresAt) {
      throw new Error('This reset code has expired. Please request a new one.');
    }
    if (newPassword.length < 8) {
      throw new Error('Your new password must be at least 8 characters long.');
    }
    const newHash = await sha256Hex(newPassword);
    await put('meta', { ...auth, passwordHash: newHash });
    await remove('meta', 'adminPasswordReset');
    return true;
  }
  async function changePassword(currentPassword, newPassword) {
    const auth = await getOne('meta', 'adminAuth');
    const currentHash = await sha256Hex(currentPassword);
    if (!auth || auth.passwordHash !== currentHash) throw new Error('Current password is incorrect.');
    const newHash = await sha256Hex(newPassword);
    await put('meta', { ...auth, passwordHash: newHash });
  }
  function saveSession(email, remember) {
    const payload = JSON.stringify({ email, ts: Date.now() });
    if (remember) { localStorage.setItem(SESSION_KEY, payload); sessionStorage.removeItem(SESSION_KEY); }
    else { sessionStorage.setItem(SESSION_KEY, payload); localStorage.removeItem(SESSION_KEY); }
  }
  function getSession() {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  /* ---------------- Image resize (keeps localStorage/IndexedDB usage sane) ---------------- */
  function resizeImageFile(file, maxDim = 1600, quality = 0.82) {
    return new Promise((resolve) => {
      if (!file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        resolve(file);
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
          else { width = Math.round(width * (maxDim / height)); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  /* ---------------- Entity CRUD ---------------- */
  async function getPhotos() { return sortByDateDesc(await getAll('photos')); }
  async function addPhoto(data) {
    const rec = { id: genId(), dateAdded: new Date().toISOString(), ...data };
    return put('photos', rec);
  }
  async function updatePhoto(id, data) {
    const existing = await getOne('photos', id);
    return put('photos', { ...existing, ...data, id });
  }
  async function deletePhoto(id) { return remove('photos', id); }

  async function getVideos() { return sortByDateDesc(await getAll('videos')); }
  async function addVideo(data) {
    const rec = { id: genId(), dateAdded: new Date().toISOString(), ...data };
    return put('videos', rec);
  }
  async function updateVideo(id, data) {
    const existing = await getOne('videos', id);
    return put('videos', { ...existing, ...data, id });
  }
  async function deleteVideo(id) { return remove('videos', id); }

  async function getDownloads() { return sortByDateDesc(await getAll('downloads')); }
  async function addDownload(data) {
    const rec = { id: genId(), dateAdded: new Date().toISOString(), downloadCount: 0, ...data };
    return put('downloads', rec);
  }
  async function updateDownload(id, data) {
    const existing = await getOne('downloads', id);
    return put('downloads', { ...existing, ...data, id });
  }
  async function deleteDownload(id) { return remove('downloads', id); }
  async function incrementDownloadCount(id) {
    const existing = await getOne('downloads', id);
    if (!existing) return;
    existing.downloadCount = (existing.downloadCount || 0) + 1;
    return put('downloads', existing);
  }

  async function getInquiries() { return sortByDateDesc(await getAll('inquiries')); }
  async function addInquiry(data) {
    const rec = { id: genId(), dateSubmitted: new Date().toISOString(), status: 'new', ...data };
    return put('inquiries', rec);
  }
  async function updateInquiry(id, data) {
    const existing = await getOne('inquiries', id);
    return put('inquiries', { ...existing, ...data, id });
  }
  async function deleteInquiry(id) { return remove('inquiries', id); }

  async function getImpactStats() {
    const rec = await getOne('meta', 'impactStats');
    return rec ? rec.value : DEFAULT_STATS;
  }
  async function setImpactStats(stats) {
    await put('meta', { key: 'impactStats', value: stats });
  }

  async function getDashboardStats() {
    const [photos, videos, downloads, inquiries] = await Promise.all([
      getAll('photos'), getAll('videos'), getAll('downloads'), getAll('inquiries')
    ]);
    return {
      photoCount: photos.length,
      videoCount: videos.length,
      downloadCount: downloads.length,
      totalDownloadHits: downloads.reduce((sum, d) => sum + (d.downloadCount || 0), 0),
      pendingInquiries: inquiries.filter((i) => i.status === 'new').length
    };
  }

  /* ---------------- Backup / restore ---------------- */
  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  function dataURLToBlob(dataURL) {
    const [header, base64] = dataURL.split(',');
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  async function serializeBlobs(arr, field) {
    return Promise.all(arr.map(async (item) => {
      const copy = { ...item };
      if (copy[field] instanceof Blob) {
        copy[field] = { __blob: true, data: await blobToDataURL(copy[field]), type: copy[field].type };
      }
      return copy;
    }));
  }
  async function deserializeBlobs(arr, field) {
    return Promise.all((arr || []).map(async (item) => {
      const copy = { ...item };
      if (copy[field] && copy[field].__blob) copy[field] = dataURLToBlob(copy[field].data);
      return copy;
    }));
  }

  async function exportBackup() {
    const [photos, videos, downloads, inquiries, stats] = await Promise.all([
      getAll('photos'), getAll('videos'), getAll('downloads'), getAll('inquiries'), getImpactStats()
    ]);
    return {
      app: 'the-rise-cbo', version: 1, exportedAt: new Date().toISOString(),
      photos: await serializeBlobs(photos, 'imageBlob'),
      videos: await serializeBlobs(videos, 'videoBlob'),
      downloads: await serializeBlobs(downloads, 'fileBlob'),
      inquiries, impactStats: stats
    };
  }
  async function importBackup(backup) {
    const photos = await deserializeBlobs(backup.photos, 'imageBlob');
    const videos = await deserializeBlobs(backup.videos, 'videoBlob');
    const downloads = await deserializeBlobs(backup.downloads, 'fileBlob');
    await clearStore('photos'); for (const p of photos) await put('photos', p);
    await clearStore('videos'); for (const v of videos) await put('videos', v);
    await clearStore('downloads'); for (const d of downloads) await put('downloads', d);
    if (Array.isArray(backup.inquiries)) {
      await clearStore('inquiries'); for (const i of backup.inquiries) await put('inquiries', i);
    }
    if (backup.impactStats) await setImpactStats(backup.impactStats);
  }

  /* ---------------- Seed demo data ---------------- */
  function demoPhotos() {
    const cat = (title, category, icon, tone, desc, daysAgo) => ({
      id: genId(), title, category, description: desc,
      eventDate: '', imageSource: 'placeholder', imageBlob: null, imageUrl: null,
      placeholderIcon: icon, placeholderTone: tone,
      dateAdded: new Date(Date.now() - daysAgo * 86400000).toISOString()
    });
    return [
      cat('Homework Help Hour', 'Education', 'book', 'terracotta', 'Volunteers guide primary schoolers through daily assignments at the community library.', 2),
      cat('Reading Club Afternoon', 'Education', 'book', 'amber', 'Our weekly reading circle builds literacy and confidence one story at a time.', 6),
      cat('New School Term Supplies', 'Education', 'book', 'emerald', 'Sponsored backpacks and books handed out ahead of term opening.', 14),
      cat('Beadwork Training Session', 'Workshops', 'users', 'amber', 'Women learn beadwork techniques to sell at local markets.', 4),
      cat('Poultry Farming Basics', 'Workshops', 'users', 'terracotta', 'Hands-on poultry-keeping training for income generation.', 9),
      cat('Financial Literacy Circle', 'Workshops', 'users', 'clay', 'Young mothers learn budgeting and micro-savings group basics.', 20),
      cat('Saturday Football Coaching', 'Sports', 'trophy', 'emerald', 'Weekly coaching builds fitness, discipline and teamwork.', 3),
      cat('Kho Kho Community Match', 'Sports', 'trophy', 'clay', 'Community Kho Kho games bring youth together every term.', 11),
      cat('Chess Club Afternoon', 'Sports', 'trophy', 'terracotta', 'Strategic thinking and quiet focus, one match at a time.', 17),
      cat('Sanitary Pad Distribution Day', 'Community Drives', 'handshake', 'amber', 'Monthly distribution reaching underserved households.', 5),
      cat('Mental Health Awareness Walk', 'Community Drives', 'handshake', 'emerald', 'A community walk opening conversation on youth mental wellness.', 13),
      cat('Volunteer Orientation Day', 'Community Drives', 'handshake', 'terracotta', 'New volunteers meet the team and tour the safe space.', 25)
    ];
  }
  function demoVideos() {
    const v = (title, tags, desc, daysAgo) => ({
      id: genId(), title, tags, description: desc,
      videoSource: 'placeholder', videoUrl: null, videoBlob: null, thumbnailUrl: null,
      placeholderIcon: 'film', placeholderTone: tags[0] === 'sports' ? 'emerald' : (tags[0] === 'education' ? 'terracotta' : 'amber'),
      dateAdded: new Date(Date.now() - daysAgo * 86400000).toISOString()
    });
    return [
      v('Sports Day Highlights', ['sports', 'community'], 'A recap of our termly sports day activities.', 7),
      v('Meet the Homework Club', ['education', 'mentorship'], 'A short look at a typical afternoon at the library.', 15),
      v('Women\u2019s Beadwork Showcase', ['women empowerment', 'skills'], 'Participants show off pieces from a recent beadwork cohort.', 22)
    ];
  }
  function demoDownloads() {
    const d = (title, category, summary, body, daysAgo) => ({
      id: genId(), title, category, description: summary,
      resourceType: 'generated', fileBlob: null, fileName: null, guideBody: body,
      downloadCount: Math.floor(Math.random() * 40) + 5,
      dateAdded: new Date(Date.now() - daysAgo * 86400000).toISOString()
    });
    const srhr = `# Your Body, Your Rights
Sexual and reproductive health and rights (SRHR) means every young person has the right to accurate health information, respectful care, and the ability to make informed choices about their own body and future.

# Know the Basics
- Puberty and body changes are a normal part of growing up \u2014 everyone's timeline is different.
- Reproductive health includes physical, emotional and social wellbeing, not just the absence of illness.
- You have the right to ask questions and get honest answers from a trusted adult, teacher, or health worker.
- Consent matters in every relationship, at every age-appropriate stage of life.

# Looking After Your Mental Health
- Stress, worry, and low moods are common \u2014 noticing them early is a sign of strength, not weakness.
- Simple habits help: regular sleep, talking to someone you trust, staying active, and taking breaks from pressure.
- It is okay to ask for help. Reaching out is a healthy, responsible choice.

# When to Talk to Someone
Speak to a parent, guardian, teacher, or community health worker if you feel overwhelmed, notice changes in mood that last more than two weeks, or have questions about your body or relationships that you are unsure about.

# The Rise CBO Is Here
Our holiday mentorship camps and safe-space sessions give young people a place to ask questions, learn, and be heard \u2014 free of judgement. We also provide sanitary product support to households that need it.

# Where to Find Help Locally
Visit the Kahawa West Community Library during opening hours to speak with a Rise CBO mentor, or reach us through the Contact page for a confidential conversation.`;
    const poultry = `# Building a Sustainable Income
This handbook introduces two accessible starting points for young mothers in Kahawa West looking to build steady income: poultry farming and craft skills like beadwork and crochet.

# Getting Started with Poultry
- Start small \u2014 even 5 to 10 birds can generate income with the right care.
- Choose a breed suited to your space and local market demand (layers for eggs, broilers for meat).
- A clean, ventilated coop and consistent feeding schedule are the foundation of healthy flocks.
- Track your costs (feed, housing, health) against your sales from day one.

# Craft Skills That Sell
- Beadwork and crochet require low starting capital and can be done from home around childcare.
- Consistency in quality and design builds a repeat customer base at local markets.
- Selling through community networks and market days builds visibility before investing in a stall.

# Money Management Basics
- Separate personal spending from business spending, even informally.
- Join or start a table-banking or merry-go-round savings group with other women you trust.
- Set aside a small percentage of every sale as a reinvestment fund.

# You Don't Have to Start Alone
The Rise CBO's Women Empowerment program offers hands-on training in beadwork, poultry farming, crocheting, and financial literacy \u2014 plus a community of women building the same journey together.`;
    const library = `# Welcome to the Kahawa West Community Library
A safe, quiet space for children and youth to read, study, and get help with schoolwork \u2014 free to join for the local community.

# Opening Hours
Monday to Friday: 9:00 AM \u2013 5:00 PM
Saturday: 9:00 AM \u2013 1:00 PM
Closed Sundays and public holidays.

# Weekly Schedule
- Homework Help Hour: Weekday afternoons, 3:00 PM \u2013 5:00 PM
- Reading Club: Wednesdays, 4:00 PM
- Holiday Mentorship Sessions: During school holidays \u2014 check with a Rise CBO mentor for dates

# How to Join
Membership is free. Bring a parent or guardian on your first visit to register. Returning members simply sign in at the front desk.

# Tips for Parents: Supporting Reading at Home
- Set aside 15 minutes a day for reading together, even just before bed.
- Let your child choose books that interest them \u2014 enjoyment builds the habit.
- Ask simple questions about the story to build comprehension, not just recitation.
- Celebrate progress, not perfection.

# A Note from The Rise CBO
Education is one of our four pillars because we believe every child deserves a safe place to learn, grow, and be supported \u2014 regardless of circumstance. Sponsorship is available for school fees and supplies for families who need it; ask a mentor for details.`;
    return [
      d('SRHR & Mental Health Youth Guide', 'SRHR & Health', 'Plain-language basics on reproductive health, mental wellness and where to find support.', srhr, 8),
      d('Young Mothers\u2019 Entrepreneurship & Poultry Handbook', 'Women\u2019s Skills', 'Practical first steps into poultry farming, craft skills and money management.', poultry, 12),
      d('Community Library Timetable & Reading Guide', 'Education', 'Opening hours, weekly schedule and tips for parents to support reading at home.', library, 3)
    ];
  }
  function demoInquiries() {
    return [
      {
        id: genId(), type: 'volunteer', source: 'get-involved',
        name: 'Faith Wanjiru', email: 'faith.wanjiru@example.com', phone: '+254 712 345 678',
        interestArea: 'Coaching football on Saturdays',
        message: 'Hi, I used to play for my university team and would love to help coach the youth football sessions. I\u2019m free most Saturday mornings.',
        status: 'new', dateSubmitted: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        id: genId(), type: 'general', source: 'contact',
        name: 'David Otieno', email: 'david.otieno@example.com', phone: '',
        interestArea: '',
        message: 'Hello, I run a small stationery shop nearby and would like to know how I can donate exercise books to the library program. Please advise on drop-off times.',
        status: 'read', dateSubmitted: new Date(Date.now() - 4 * 86400000).toISOString()
      }
    ];
  }

  async function seedContent() {
    await clearStore('photos'); for (const p of demoPhotos()) await put('photos', p);
    await clearStore('videos'); for (const v of demoVideos()) await put('videos', v);
    await clearStore('downloads'); for (const dl of demoDownloads()) await put('downloads', dl);
    await setImpactStats(DEFAULT_STATS);
  }

  async function init() {
    await ensureDefaultAdmin();
    const seeded = await getOne('meta', 'seeded');
    if (!seeded) {
      await seedContent();
      for (const inq of demoInquiries()) await put('inquiries', inq);
      await put('meta', { key: 'seeded', value: true });
    }
  }

  /** Resets published content (photos/videos/downloads/impact stats) to the
   *  starter demo set. Inquiries and admin credentials are left untouched
   *  since those may hold real data by the time an admin uses this. */
  async function restoreDemoContent() {
    await seedContent();
  }

  return {
    init,
    getPhotos, addPhoto, updatePhoto, deletePhoto,
    getVideos, addVideo, updateVideo, deleteVideo,
    getDownloads, addDownload, updateDownload, deleteDownload, incrementDownloadCount,
    getInquiries, addInquiry, updateInquiry, deleteInquiry,
    getImpactStats, setImpactStats, getDashboardStats,
    verifyLogin, createAccount, loginWithGoogle, requestPasswordReset, resetPasswordWithToken,
    getAdminEmail, changePassword,
    saveSession, getSession, clearSession,
    resizeImageFile, exportBackup, importBackup, restoreDemoContent,
    genId
  };
})();

window.Store = Store;
