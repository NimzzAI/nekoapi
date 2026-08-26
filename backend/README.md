# NekoAPI — Node.js backend

Express backend structured the same way as Takanashi-API: **one file per
endpoint**, auto-loaded from `src/api/<category>/` at boot. See the root
`README.md` for the full setup guide (including how this deploys as part of
one Vercel project via `../vercel.json`) — this file is a quick reference
for working inside this folder specifically.

## Deployment

This backend runs in two environments without any code changes:

- **As a Vercel Service** (recommended, see root `README.md` step 6): the
  root `vercel.json` mounts this folder at `/api` in the same Vercel project
  as the frontend. `module.exports = app` at the bottom of `index.js` is
  what Vercel's Express framework detection uses.
- **As a standalone VPS process** (see root `README.md` step 7): `npm start`
  runs `index.js` directly, which calls `app.listen()` and binds `PORT`.

`index.js` checks `process.env.VERCEL` to decide whether to call
`app.listen()` — set automatically by Vercel, so no configuration is needed
either way. It also strips a leading `/api` prefix from every incoming
request before route matching, since Vercel Services keeps that prefix on
the request but every route file below registers its path without it
(`app.get("/ping", ...)`, not `app.get("/api/ping", ...)`).

## Run it

```sh
npm install
cp ../.env.example .env   # fill in your own values
npm run dev                # nodemon
# or
npm start                  # node --no-deprecation index.js
```

On boot you'll see every route file it loaded, then the total count — that's
the fastest way to confirm a new endpoint file was picked up:

```
[nekoapi] loaded route: ai/chat.js
[nekoapi] loaded route: download/instagram.js
...
[nekoapi] 22 routes loaded
[nekoapi] listening on :8080
```

## Add a new endpoint

1. Pick (or create) a category folder under `src/api/`.
2. Create a file, e.g. `src/api/search/anilist.js`.
3. Export a function that registers the route on `app`:

```js
const { getJSON } = require("../../lib/http");
const { ok, fail } = require("../../lib/respond");

module.exports = function (app) {
  app.get("/search/anilist", async (req, res) => {
    const q = req.query.q;
    if (!q) return fail(res, "BAD_REQUEST", "q is required");
    try {
      const body = await getJSON("https://some-upstream.example/search", { params: { q } });
      ok(res, body);
    } catch {
      fail(res, "UPSTREAM_ERROR", "upstream did not respond");
    }
  });
};
```

4. Restart the server — it's auto-loaded, no router file to edit.
5. To make it show up in the docs and `/endpoints`, add an entry to
   `src/lib/catalog.js` (this backend) and to `ENDPOINTS` in
   `frontend/src/api/core/registry.ts` (docs UI + the edge mirror). Leaving
   it out of both keeps the route reachable but internal-only — that's how
   `telegram/status.js` and `telegram/send.js` work.

## Folder reference

| Path | What's in it |
| --- | --- |
| `index.js` | Express setup, security headers, CORS, rate limiting, request logging, the auto-loader, error handling |
| `src/branding.js` | Non-secret site metadata (name, owner, URL, version) |
| `src/lib/respond.js` | `ok(res, data)` / `fail(res, code, message)` — the response envelope every endpoint uses |
| `src/lib/http.js` | Shared `getJSON`/`postJSON` axios helpers |
| `src/lib/security.js` | Rate limiter, device fingerprint, IP masking |
| `src/lib/store.js` | In-memory stats/logs backing `/stats`, `/logs`, `/security` |
| `src/lib/telegram.js` | Telegram Bot API client used by `src/api/telegram/` |
| `src/lib/catalog.js` | The public endpoint list `/endpoints` reports call counts against |
| `src/api/<category>/*.js` | One file per endpoint — the actual routes |

## Environment variables

See `.env.example` at the repo root. Only `PORT`, `ALLOWED_ORIGINS`,
`TELEGRAM_BOT_TOKEN`, `DATABASE_URL` and `API_SECRET` apply here — branding
is in `src/branding.js`, not the environment.
