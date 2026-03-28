# DumpSpot

A civic reporting tool for public hazards. See garbage, sewage overflow, road encroachment, burning waste, debris — pin it on the map. No account, no login. A name, a location, a photo.

Built for India, works anywhere.

---

## What it does

Anyone can open DumpSpot and file a report in under a minute. Reports appear live on a shared map. Every pin is a real location with photos, coordinates, and a timestamp. The more reports, the more pressure on civic bodies to act.

No accounts. No bureaucracy. Just evidence.

---

## Features

**Map feed**

- Interactive map centered to your country on load — no permission asked, silent IP lookup
- Each report is a category pin (garbage, sewage, fire, debris etc) with a popup showing photo, location, reporter, timestamp
- Click any pin to open the full report
- Filter by state, area, or garbage category — map and list update simultaneously

**List feed**

- Chronological view: Today / Yesterday / This Week / older months
- Group headings alternate left and right
- Each row shows location, area, category chips, reporter name, local time
- Hover slides the row right with an underline crawl on the title

**Report form**

- Search location via autocomplete (OpenStreetMap Nominatim, no key required)
- After picking a location, a draggable pin map appears — drag or tap to exact spot
- DigiPin code shown live as pin moves (India only)
- Plus Code shown live as pin moves (global)
- Reverse geocode confirmation updates the location field as pin moves
- 9 garbage category cards, type of site tags, severity tags
- Notes field
- Upload up to 6 photos — compressed to WebP 1280px 82% quality in browser before upload
- State and area fields validated on blur — warns if you enter a city as a state or vice versa

**Spam protection**

- Text: abuse list (English + Hindi + Hinglish), gibberish detection, leet-speak bypass normalisation
- Images: blank/solid colour blocked, low-detail blocked, illustration/artwork detected and warned, face detection via face-api.js
- Warn-then-remove flow for images: first attempt warns, second attempt removes flagged photos automatically

**Detail page**

- Full report layout mirroring the form
- Dark Leaflet mini-map with pink area highlight circle
- Photos in a responsive grid
- Report ID, timestamp in viewer's local timezone (IST shown in brackets for non-India viewers)

**Timestamps**

- Stored as UTC, displayed in viewer's local timezone
- India viewers see IST
- Everyone else sees their local time with `[IST]` in brackets

---

## Pages

| Page   | Route                      | What it is                             |
| ------ | -------------------------- | -------------------------------------- |
| Feed   | default                    | Map + list toggle, filters, live count |
| Report | + Report tab               | Form to file a new report              |
| Detail | opens from pin or list row | Full report view with mini-map         |

---

## How it's built

No frontend framework. The UI stays static, but abuse-sensitive writes now pass through small Vercel serverless functions.

- `index.html` — all markup, page structure, script imports
- `style.css` — all styles, design tokens, layout, components
- `app.js` — all logic: map, list, form, upload, submit, spam checks, location encoding
- `config.js` — public client config only, gitignored, never pushed
- `build.js` — Node script run at deploy time, generates `config.js` from env vars
- `api/` — Vercel serverless functions for signed uploads, report submission, and moderation
- `package.json` — minimal runtime dependency for serverless Supabase access
- `vercel.json` — tells Vercel to run `node build.js` and serve the repo root

---

## Running locally

```bash
npm install
node build.js
vercel dev
```

Open the local Vercel URL. Make sure `config.js` has your real public credentials and your server env vars are available to Vercel dev.
If you keep your Supabase values in `.env.local`, `node build.js` will read them and generate `config.js` for you.

---

## Deploying

1. Push `index.html`, `style.css`, `app.js`, `build.js`, `vercel.json`, `favicon.svg` to GitHub
2. Connect the repo to Vercel
3. Set environment variables in Vercel → Project Settings → Environment Variables:
   - `DB_URL` or `NEXT_PUBLIC_SUPABASE_URL` — your database project URL
   - `DB_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — your public Supabase key
   - `SUPABASE_SERVICE_ROLE_KEY` — used only by the serverless functions
   - `TURNSTILE_SITE_KEY` — public site key for abuse challenges
   - `TURNSTILE_SECRET_KEY` — server-side Turnstile verification key
   - `MODERATION_SECRET` — shared secret for the no-UI moderation endpoint
   - `ABUSE_HASH_SALT` — optional dedicated salt for IP/device hashing
   - `LOCK_INSPECT_ENV` — `true` if you want the devtools lock on production
4. In Supabase SQL Editor, run [supabase/setup.sql](/Users/anirudhthakur/Himachalpotholes/hpdumpspots/supabase/setup.sql) to create the hardened tables, views, policies, moderation tables, and storage buckets
5. Deploy — Vercel runs `node build.js`, generates `config.js`, and serves the app

---

## Report ID

Every report gets `DS-YYYYMMDD-HHMMSS-XXXX` — date, time, 4-char hex. Immutable after creation. Shown on success screen and detail page.

---

## Abuse hardening

- Browser writes no longer go directly to `reports`, `report_photos`, or storage
- Photos upload to a private quarantine bucket through signed upload URLs
- Reports are validated and finalized on the server
- Suspicious reports are stored as `pending` and hidden from the public feed
- Public feed reads from a safe published-only view with masked reporter names

---

## What's not built yet

- No full moderation dashboard UI — use Supabase plus the moderation endpoint for v1
- No map clustering for dense report areas
- No editing or deleting reports after submit
- No push notifications for new reports near a location
