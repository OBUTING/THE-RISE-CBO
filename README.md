# The Rise CBO — Website & Admin Portal

A public website and Admin Portal for **The Rise CBO**, a community
organisation in Kahawa West, Nairobi. Plain HTML, CSS and JavaScript —
no build step, no framework, no server required to run it.

```
the-rise-cbo/
├── index.html           redirect stub → home.html (so "/" always works)
├── home.html            Home
├── about.html            About
├── programs.html         Programs
├── gallery.html           Gallery & downloads
├── contact.html           Contact
├── admin.html             Admin Portal (login + dashboard)
├── css/                  main.css (design system), components.css, admin.css
├── js/                   store.js, app.js, gallery.js, contact.js, admin.js
├── assets/               for static files you add yourself (see assets/README.md)
├── render.yaml            Render Blueprint — deploy in a couple of clicks
└── package.json           optional local-preview script
```

Each page is a real, standalone HTML file now (not a single-page app) —
the header, footer, and "Get Involved" modal are duplicated at the top
of every file, and each page loads only the JS it actually needs.

## Read this first: how content storage actually works

**Please read this before you tell anyone the admin portal is "live."**

This site has no backend/database — everything an admin adds (photos,
videos, awareness resources) is saved in that **specific browser's**
local storage (IndexedDB), on that one device.

That means:
- If you, as admin, add a photo on your laptop in Chrome, **it appears
  on your laptop in Chrome** — not for other visitors, not even for you
  in a different browser or on your phone.
- Clearing browser data, using private/incognito mode, or switching
  devices means starting from the demo content again.
- The Contact and Get Involved forms save messages the same way — to
  the browser of whoever is viewing the site at that moment, not to
  you. **A message submitted by a visitor on their own phone will not
  reach your Admin Inbox.**

This architecture is genuinely useful for demos, presentations, local
testing, or as a starting point — but as shipped, **it is not yet a way
to actually collect real volunteer/donation inquiries or publish real
photos live.** For that, you'd need real shared storage: a small
backend and database (options range from a lightweight service like
Supabase/Firebase to a custom API). Happy to help you build that next
step when you're ready — just ask.

## Running it locally

**Quickest check:** double-click `home.html` (not `index.html`, which
is just a one-line redirect) to open it in your browser. Browsing
works, but some browsers restrict IndexedDB on `file://` pages, so use
a local server (below) before testing the Admin Portal.

**With Python:**
```
cd the-rise-cbo
python -m http.server 5500
```
Then open `http://localhost:5500` — it'll redirect to `home.html`.

**With Node.js:**
```
cd the-rise-cbo
npm start
```

**VS Code:** install the "Live Server" extension, right-click
`home.html`, choose "Open with Live Server."

## Deploying to Render

Render deploys static sites from a connected **GitHub, GitLab, or
Bitbucket repository** — there's no direct zip-upload option. Here's
the fastest path:

1. **Push this folder to a new GitHub repo.**
   - With git installed: `git init`, `git add .`, `git commit -m "Initial site"`,
     then create an empty repo on GitHub and follow the "push an
     existing repository" instructions it shows you.
   - No git experience? Create a new repo at github.com, click
     "uploading an existing file," and drag in everything from this
     folder (unzip first — GitHub's web upload doesn't accept .zip
     files directly).
2. **On Render:** New → Blueprint → connect that repo. Render finds
   `render.yaml` automatically and sets everything up — no manual
   config needed.
3. Render gives you a URL like `https://the-rise-cbo.onrender.com`
   within a minute or two.

(If you'd rather configure it by hand instead of using the Blueprint:
New → Static Site → connect the repo → leave Build Command empty →
set Publish Directory to `.`.)

## Deploying elsewhere

**GitHub Pages:** Settings → Pages → Source → your branch → `/ (root)`.
**Netlify / Vercel:** these *do* support drag-and-drop — sign up, drag
the whole `the-rise-cbo` folder onto their dashboard, done.

Any static host works the same way: `index.html` redirects to
`home.html` automatically, so visiting the bare domain always lands on
the homepage regardless of which host you pick.

## Admin Portal

Go to `admin.html`, or click the lock icon in the header / "Admin
Portal" in the footer from any page.

**Default login (first run only):**
- Email: `admin@therisecbo.org`
- Password: `RiseKahawa2026!`

**Change this password immediately** once you're using this for
anything real — Admin → Settings → Change Password. Note the caveat
above: this login keeps casual visitors out of the dashboard, but
since everything runs in the browser, it is not equivalent to
server-side security. Don't store anything highly sensitive here.

From the dashboard you can:
- **Gallery Manager** — add photos (upload a file or paste an image
  URL), edit or delete them.
- **Video Manager** — add videos. **Embed link (YouTube/Vimeo/MP4 URL)
  is recommended** — browser storage isn't built for large video
  files. Direct upload is supported for small files (under 40MB).
- **Downloads Manager** — either upload a real PDF/document, or write
  plain text and the site will generate a formatted PDF automatically
  on download (this is how the three starter guides work).
- **Inbox** — messages from the Contact and Get Involved forms
  (subject to the storage caveat above), filterable, exportable to CSV.
- **Settings** — edit the homepage impact numbers, change your
  password, export/import a full JSON backup, or restore the starter
  demo content.

**Back up your data regularly** (Settings → Export Backup) — since it
all lives in one browser's storage, clearing site data or switching
computers means it's gone unless you've exported it.

## Customising

- **Colours & fonts** — all defined once as CSS variables at the top
  of `css/main.css` (`--terracotta`, `--emerald`, `--amber`, `--slate`,
  etc.) and in the `@import` line for Google Fonts.
- **Text content** — each page is its own plain-HTML file
  (`home.html`, `about.html`, etc.) — edit directly.
- **Header, footer, or the Get Involved modal** — these are repeated
  at the top/bottom of all six pages, so a change needs to be made in
  each file. If you're comfortable with a little scripting, treat
  `home.html`'s copy as the source of truth and propagate edits with a
  find-and-replace across files.
- **Starter/demo content** (the 12 seed photos, 3 seed videos, 3 guide
  PDFs) — edit the `demoPhotos()`, `demoVideos()`, `demoDownloads()`
  functions in `js/store.js`. These only load once, the very first
  time someone opens the site in a given browser (or after "Restore
  Demo Data" in Settings).
- **Contact details, map, WhatsApp number** — search across the
  `.html` files for `Kahawa West` / `therisecbo.org` / `254700000000`
  and replace with your real details.

## Which script loads where

To keep pages light, each only loads what it needs:

| Page | Scripts |
|---|---|
| home.html | store, app, gallery, contact |
| about.html | store, app, contact |
| programs.html | store, app, contact |
| gallery.html | store, app, gallery, contact |
| contact.html | store, app, contact |
| admin.html | store, app, admin |

`contact.js` is on every public page because the "Get Involved" button
in the header opens a modal that lives on every page. `gallery.js` is
only needed where photo/video/download grids actually render.

## Notes on what's simulated vs. real

- The **PDF downloads** for the three starter awareness guides are
  genuinely generated PDFs (via a small client-side PDF library),
  built from real starter content you can edit — not placeholders.
- The **12 starter photos and 3 starter videos** are intentionally
  placeholder cards (a coloured icon, not a stock photo standing in
  for real footage) — since no real photos of your programs were
  provided, nothing here pretends to document real events. Replace
  them with real photos/videos through the Gallery/Video Manager
  whenever you're ready.
- The two sample **Inbox messages** are clearly fictional, included so
  you can see what a real inquiry will look like.

## Accessibility & performance

Keyboard navigation, focus states, and `prefers-reduced-motion` are
all handled. Images lazy-load. No frameworks or build step — the whole
site is a handful of readable files, so it stays fast on modest
connections and is easy to hand off to another developer later.
