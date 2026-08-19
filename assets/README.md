# assets/

This folder is for **static files you commit to the codebase** — a real
logo file, a favicon, or images you want baked into the site permanently
(not through the Admin Portal).

Everything an admin uploads through the Admin Portal (photos, videos,
awareness documents) is stored separately, in the visitor's browser —
see the "How content storage actually works" section in the main
README.md before you rely on this folder vs. the Admin Portal.

Suggested subfolders as you need them:
- `assets/images/` — logo, static illustrations, og:image for link previews
- `assets/docs/` — any awareness PDFs you want permanently on the site
  regardless of browser storage (link to them directly from a download
  card by editing the Downloads Manager to use a URL you host here).
