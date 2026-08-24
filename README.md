# NekoAPI — REST API Neko

Owner: **Nimzz** · Version 1.0.0

NekoAPI is a security-first REST API platform with a live dashboard, request
logging, an interactive API Explorer, a Telegram connector and a Node.js
backend built in the same one-file-per-endpoint style as Takanashi-API.

## Repository layout

```
nekoapi/
├── frontend/                   React + TypeScript + Tailwind dashboard (TanStack Start)
│   ├── src/
│   │   ├── config.js            branding/metadata — name, owner, URL, favicon, hero image (not a secret, edit directly)
│   │   ├── api/                bundled edge API (workers runtime) — mirrors backend/ for Vercel deployments
│   │   │   ├── core/           respond, state, device, ratelimit, registry, zip
│   │   │   ├── handlers/       general, media, ops, ai, downloader, search
│   │   │   └── telegram/       Telegram connector (internal notifier)
│   │   ├── components/neko/    UI components (AppShell, AnnouncementPopup, viewers, primitives)
│   │   ├── lib/                site config, announcement config, API client
│   │   └── routes/             pages + workers routes (src/routes/api/public/$.ts)
│   ├── public/                 favicon.ico, robots.txt
│   ├── vercel.json             Vercel deployment configuration
│   ├── package.json / vite.config.ts / tsconfig.json
│   └── .env.example
├── backend/                    Node.js backend (VPS / server) — the only backend
│   ├── index.js                 Express app: middleware, auto-loader, error handling
│   ├── src/
│   │   ├── branding.js          non-secret site metadata (mirrors frontend/src/config.js)
│   │   ├── lib/                 respond, http, security, store, telegram, catalog — shared helpers
│   │   └── api/<category>/<name>.js   ONE FILE PER ENDPOINT, auto-loaded at boot (see below)
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

Note on structure: this project has two runnable API implementations. The
`workers` layer lives inside the frontend (`frontend/src/routes/api/public/$.ts`
+ `frontend/src/api/*`) because the edge runtime requires it there, and
`backend/` is the server implementation, meant to run on a VPS. Both
implement the exact same routes and response envelope, so the frontend works
identically against either one.

## How the backend is structured (one file = one endpoint)

`backend/index.js` scans `backend/src/api/<category>/` once at boot and
`require()`s every `.js` file it finds. Each file exports a single function
that receives the Express `app` and registers its own route:

```js
// backend/src/api/search/npm.js
module.exports = function (app) {
  app.get("/search/npm", async (req, res) => {
    // ...
  });
};
```

Adding a new endpoint means adding one new file under the right category
folder — nothing else in the codebase needs to change, no router file to
edit, no list to update. Delete the file to remove the endpoint. This is
the same structure Takanashi-API uses (`src/api/<category>/<name>.js`,
`module.exports = function(app) {...}`, auto-loaded from `index.js`).

Categories today: `general/`, `system/`, `information/`, `utility/`,
`media/`, `telegram/`, `ai/`, `download/`, `search/`. Shared code (response
envelope, HTTP client, rate limiter, in-memory store, Telegram connector,
the public catalog) lives once in `backend/src/lib/` and is `require()`d by
whichever endpoint files need it — endpoint files stay focused on their one
route.

## 1. Install dependencies

```sh
# frontend
cd frontend
npm install

# backend
cd ../backend
npm install
```

## 2. Setup .env and config.js

```sh
cp .env.example frontend/.env
cp .env.example backend/.env
```

Fill in your own secret/deployment values. `.env.example` never contains
real secrets; the Telegram bot token is read from `TELEGRAM_BOT_TOKEN` on the
server only and is never exposed to the browser.

Branding — site name, owner, tagline, description, URL, favicon, hero image —
is **not** an env var. Edit `frontend/src/config.js` (frontend) and
`backend/src/branding.js` (backend) directly. Keep the two in sync manually;
they're separate files on purpose since the frontend and backend are
deployed and built independently.

## 3. Run the frontend

```sh
cd frontend
npm run dev          # http://localhost:8080
```

The dashboard has no hardcoded host: it calls `VITE_API_BASE_URL` when set,
otherwise the same origin it is served from.

## 4. Run the backend

```sh
cd backend
npm run dev   # nodemon, :8080 by default, override with PORT
# or
npm start     # node --no-deprecation index.js
```

On boot the backend logs every route file it auto-loaded from `src/api/`,
then how many it found in total — a quick way to confirm a new endpoint file
was picked up.

## 5. Build for production

```sh
cd frontend && npm run build       # output in .output/
cd ../backend && npm install --omit=dev   # no build step — Node runs the source directly
```

## 6. Deploy the frontend to Vercel

1. Import the repository in Vercel and set **Root Directory** to `frontend`.
2. `vercel.json` already declares the build command, output directory and
   security headers — no further configuration is needed.
3. Add the environment variables in Vercel → Settings → Environment Variables:
   `VITE_API_BASE_URL` (only if the frontend calls an external Node backend —
   leave unset to use the bundled edge API on the same origin). Branding
   comes from `frontend/src/config.js`, committed in the repo, no Vercel env
   var needed for it.
4. Deploy.

## 7. Deploy the backend to a server

```sh
rsync -a --exclude node_modules backend/ user@server:/opt/nekoapi/
ssh user@server "cd /opt/nekoapi && npm install --omit=dev"
```

systemd unit:

```ini
[Unit]
Description=NekoAPI backend
After=network.target

[Service]
WorkingDirectory=/opt/nekoapi
EnvironmentFile=/opt/nekoapi/.env
ExecStart=/usr/bin/node --no-deprecation index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Put it behind nginx/Caddy with TLS on `api.your-domain.com`. A process
manager like `pm2` works too if you'd rather not write a systemd unit:
`pm2 start index.js --name nekoapi`.

## 8. Point the frontend at an external backend

Set `VITE_API_BASE_URL=https://api.your-domain.com` in the frontend
environment and add that frontend origin to the backend `ALLOWED_ORIGINS`.
Leaving `VITE_API_BASE_URL` empty keeps the bundled edge API on the same origin.
The current target is always visible on the Settings page.

## 9. Change the favicon

Replace `frontend/public/favicon.ico`. To point at a different file, set
`favicon: "/my-icon.png"` in `frontend/src/config.js` and drop the file into
`frontend/public/`.

## 10. Change the site URL

Set `url: "https://your-domain.com"` in `frontend/src/config.js` (and `url`
in `backend/src/branding.js` if the backend needs it). Canonical tags, Open
Graph URLs and every absolute link resolve through
`frontend/src/lib/site-config.ts`, so no other source file needs editing.

## Endpoints (20)

| Method | Path | Category | Description |
| --- | --- | --- | --- |
| GET | `/ping` | General | Health check |
| GET | `/status` | General | API, database and Telegram status |
| GET | `/system` | System | Runtime, CPU, memory, services |
| GET | `/stats` | System | Live counters, latency percentiles, samples |
| GET | `/ip` | Information | Masked caller network prefix |
| GET | `/device` | Information | Daily-rotating device fingerprint |
| GET | `/random` | Utility | uuid / int / bytes / string |
| GET | `/time` | Utility | Server clock, optional IANA timezone |
| GET | `/endpoints` | General | Endpoint catalog with call counts |
| GET | `/logs` | System | Filterable request log |
| GET | `/security` | System | Rate limiter and security posture |
| GET | `/image/avatar` | Media | Deterministic SVG identicon |
| GET | `/video/pack` | Media | Video packaged as a ZIP download |
| GET | `/ai/chat` | AI | Chat completion via the free Siputzx GPT-3 API |
| GET | `/download/tiktok` | Downloader | TikTok, no watermark, via tikwm.com |
| GET | `/download/youtube` | Downloader | YouTube download links via a2zconverter.com |
| GET | `/download/instagram` | Downloader | Instagram post/reel media via api.nekolabs.my.id |
| GET | `/search/anime` | Search | Anime title search via the official Jikan (MyAnimeList) API |
| GET | `/search/lyrics` | Search | Lyrics search via the free Lyrics.ovh API |
| GET | `/search/npm` | Search | npm registry search, live upstream |

`/telegram/status` and `/telegram/send` also exist and are fully functional,
but are intentionally **not** part of the public catalog above — they're the
internal notifier the bot uses to push logs, errors and daily/weekly/monthly
reports to the owner's Telegram, not a public-facing feature. They still
live under `backend/src/api/telegram/` like any other route, they're just
left out of `backend/src/lib/catalog.js` and `INTERNAL_ENDPOINTS` in
`frontend/src/api/core/registry.ts` on purpose so they never show up in
`/endpoints`, the docs, or the API Explorer.

## How AI / Downloader / Search endpoints work

One file, one HTTP call — the same structure as every endpoint in this
project, and the same structure Takanashi-API uses. Each file under
`backend/src/api/<category>/` validates its own input, calls one free
public upstream directly (`axios` in the Node backend, native `fetch` in
the TypeScript/edge mirror), and reshapes the response. No subprocess, no
shared "bridge" layer, no other language runtime required on the host —
`npm install && npm start` alone runs the whole backend.

```
backend/src/api/
├── ai/
│   └── chat.js          -> api.siputzx.my.id (free, no key)
├── download/
│   ├── tiktok.js         -> tikwm.com (free, no key)
│   ├── youtube.js        -> a2zconverter.com (free, no key)
│   └── instagram.js      -> api.nekolabs.my.id (free, no key)
└── search/
    ├── anime.js          -> api.jikan.moe/v4 (official Jikan API)
    ├── lyrics.js         -> api.lyrics.ovh (free, no key)
    └── npm.js            -> registry.npmjs.org (official)
```

`backend/src/lib/http.js` holds the two tiny shared helpers (`getJSON`,
`postJSON`) every endpoint file calls — not a bridge, just the HTTP client
setup so it isn't copy-pasted nine times. `frontend/src/api/handlers/{ai,downloader,search}.ts`
mirror the same upstream, params and error codes for the Vercel/edge
deployment, so the docs and the API Explorer behave identically regardless
of which backend answers the call.

All of the upstreams above are free and require no API key. If an upstream
ever changes its response shape or goes away, the fix is local: edit the one
file that calls it — nothing else in the codebase depends on it.

## Customizing the homepage image and the popup

Both are config-driven — no component code needs editing:

- **Homepage "About" image**: set `heroImage: "/hero.jpg"` in
  `frontend/src/config.js` (or any absolute URL) and drop the file into
  `frontend/public/`. Hidden automatically until you add one — never renders
  as a broken-image icon.
- **Announcement popup** shown on the docs page: edit
  `frontend/src/lib/announcement-config.ts` — image, title, body, buttons
  (label/link/icon/tone) and whether it re-shows after N hours. Set
  `enabled: false` to turn it off without deleting anything.

## Security

Rate limiting per identity and per endpoint with temporary blocking, strict
security headers, CORS allowlist, typed input validation, 16 KB body cap,
outbound timeouts, SSRF allowlist for upstream fetches, IP masking (/24, /48)
and privacy-conscious hashed device fingerprints.

## Built with

React, TypeScript, Vite, Tailwind CSS, Font Awesome, TanStack Start/Router/Query, Node.js, Express.
