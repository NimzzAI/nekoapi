# NekoAPI

REST API multi-fitur — AI, downloader, anime, games, pencarian, dan lainnya — dikembangkan oleh **Nimzz**.

Project ini adalah hasil gabungan (`combo`) dua codebase: `base-api-main` dan `api-Takanashi-main`, dirapikan ulang jadi satu struktur, ditambah lapisan keamanan baru dan tampilan website minimalis bergaya Eropa.

---

## ✨ Fitur

- **108 endpoint** REST API, dikelompokkan flat per kategori (`ai`, `anime`, `download`, `image`, `news`, `games`, `maker`, `random`, `search`, `api`) — satu file per fitur, bukan folder-per-endpoint.
- **Rate limiting ganda**: per alamat IP *dan* per Device ID (header `X-Device-Id`), dengan pemblokiran sementara otomatis untuk pelanggar berulang.
- **Notifikasi & webhook Telegram**: alert real-time ke Telegram saat ada rate-limit, pemblokiran, atau error server; plus endpoint penerima webhook untuk integrasi bot admin ke depannya.
- **Site URL config terpusat** (`SITE_URL` di `.env`) — otomatis dipakai di meta tag `og:url`/canonical semua halaman, `robots.txt`, `sitemap.xml`, dan log webhook, tanpa perlu ubah kode saat pindah dari localhost ke domain produksi.
- **Dashboard real-time** (`/dashboard`) dan **dokumentasi endpoint interaktif** (`/docs`) dengan pencarian & filter kategori.
- Halaman **Ketentuan Layanan** dan **Kebijakan Privasi** siap pakai.
- Desain minimalis Eropa: kertas hangat, tinta nyaris hitam, satu aksen indigo, tipografi Fraunces + Inter + IBM Plex Mono, tanpa shadow/gradient.

---

## 🚀 Menjalankan

```bash
npm install
cp .env.example .env
# edit .env sesuai kebutuhan (lihat bagian Konfigurasi di bawah)
npm start
```

Server default jalan di `http://localhost:4000`. Buka `/`, `/docs`, atau `/dashboard` di browser.

> **Catatan**: proses pembuatan project ini dilakukan di sandbox tanpa akses internet, jadi `npm install` belum pernah dijalankan/dites di sisi saya. Semua file JavaScript sudah lolos syntax check (`node --check`), tapi tetap jalankan dan tes sendiri sebelum deploy ke produksi, terutama endpoint yang scraping ke situs pihak ketiga (kadang berubah struktur HTML-nya).

---

## ⚙️ Konfigurasi

Config dipecah jadi dua tempat sesuai sifatnya:

### `.env` — cuma yang wajib beda tiap deploy / rahasia

| Variabel | Fungsi |
|---|---|
| `PORT` | Port server (default `4000`) |
| `SITE_URL` | **Base URL publik project ini** (tanpa trailing slash). Dipakai di meta tag OG/canonical, `robots.txt`, `sitemap.xml`, dan contoh URL webhook. Ganti ke domain asli saat deploy, mis. `https://api.nimzz.dev` |
| `TELEGRAM_ENABLED` | `true`/`false` — aktifkan notifikasi Telegram |
| `TELEGRAM_BOT_TOKEN` | Token bot dari [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | ID chat/grup/channel tujuan notifikasi |
| `TELEGRAM_WEBHOOK_SECRET` | Secret path untuk endpoint penerima webhook (`/webhook/telegram/<secret>`) |

Lihat `.env.example` untuk nilai default lengkap.

### `src/config/settings.json` — sisanya, aman di-commit ke git

File biasa (bukan `.env`), isinya nilai yang jarang berubah dan bukan rahasia — jadi boleh ikut ke-commit supaya semua orang di tim pakai default yang sama:

| Key | Fungsi |
|---|---|
| `apiName`, `apiCreator`, `apiDescription` | Identitas API — muncul di response JSON, judul halaman, dan meta tag |
| `telegramLogAllRequests` | `true` kalau mau tiap request (bukan cuma error/rate-limit) dikirim ke Telegram — default `false` karena bisa spam |
| `rateLimit.windowMs` / `rateLimit.maxIp` / `rateLimit.maxDevice` | Jendela waktu & batas rate limit |
| `ban.threshold` / `ban.windowMs` / `ban.durationMs` | Eskalasi ke blokir sementara |

Mau ubah nama API atau angka rate limit? Tinggal edit file JSON ini, tidak perlu sentuh `.env`.

### Menyambungkan bot Telegram

1. Chat `@BotFather` di Telegram → `/newbot` → salin token ke `TELEGRAM_BOT_TOKEN`.
2. Tambahkan bot ke grup/channel tujuan, atau chat langsung, lalu ambil `chat_id`-nya (bisa lewat `getUpdates` atau bot seperti `@userinfobot`) → isi `TELEGRAM_CHAT_ID`.
3. Set `TELEGRAM_ENABLED=true`.
4. (Opsional) Kalau mau bot menerima update balik, set webhook Telegram ke:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<SITE_URL>/webhook/telegram/<TELEGRAM_WEBHOOK_SECRET>
   ```

---

## 🔒 Cara kerja keamanan

Setiap request masuk lewat `src/middleware/security.js` sebelum menyentuh endpoint manapun:

1. **Cek daftar blokir** — kalau IP atau Device ID sedang diblokir, langsung ditolak `429` beserta sisa waktu blokir.
2. **Rate limit IP** dan **rate limit Device ID** dicek terpisah (jendela waktu & batas diatur lewat `.env`).
3. Kalau limit terlampaui, request ditolak `429` dan pelanggaran dicatat. Setelah pelanggaran mencapai `BAN_THRESHOLD` dalam `BAN_WINDOW_MS`, klien diblokir sementara selama `BAN_DURATION_MS` — otomatis, tersimpan ke `data/blocked_clients.json` supaya bertahan lintas restart server.
4. Semua rate-limit dan blokir dikirim ke Telegram (kalau diaktifkan).

Device ID diambil dari header `X-Device-Id` yang dikirim client. Kalau client tidak mengirimnya, sistem pakai fallback hash dari IP + User-Agent supaya tetap bisa dilacak.

---

## 📁 Struktur folder

```
nekoapi/
├── index.js                  # entry point, wiring semua middleware & routes
├── src/
│   ├── api/                  # endpoint, flat per kategori
│   │   ├── ai/  anime/  download/  image/  news/
│   │   └── games/  maker/  random/  search/  api/
│   ├── config/
│   │   └── settings.json     # nama API, rate limit, ban — aman di-commit
│   ├── lib/
│   │   ├── config.js         # gabungin .env (rahasia) + settings.json (tuning)
│   │   ├── telegram.js       # notifier & queue Telegram
│   │   └── routeLoader.js    # loader dinamis + manifest endpoint
│   ├── middleware/
│   │   └── security.js       # rate limit IP + Device ID, sistem blokir
│   └── assets/                # aset statis internal
├── public/                   # website (index, docs, dashboard, terms, privacy, 404, 500)
├── data/                     # blocked_clients.json (auto-generated saat runtime)
├── .env.example
└── package.json
```

---

## ⚠️ Catatan penting soal isi project sumber

Saat menggabungkan `base-api-main` dan `api-Takanashi-main`, beberapa hal sengaja **tidak** dibawa ke NekoAPI:

- **22 file endpoint** dari `api-Takanashi-main` dikeluarkan karena berisi konten dewasa eksplisit (folder NSFW, pencarian ke situs hentai/doujin, Pixiv R18) dan endpoint bertema "loli" — di luar cakupan yang bisa dibantu.
- **Token rahasia yang ter-hardcode** di kode sumber asli (webhook Discord & bot token Telegram) sudah dihapus total dan diganti jadi environment variable kosong di `.env.example`. Isi sendiri dengan token milikmu — jangan pernah commit `.env` ke git.
- Beberapa file endpoint duplikat (route yang sama terdaftar dua kali di `api-Takanashi-main`, dan dua route yang tabrakan antara kedua project) sudah dirapikan supaya tidak ada konflik routing.
- Atribusi lisensi MIT dari kedua project sumber tetap dijaga di file `LICENSE`.

---

## 📄 Lisensi

MIT — lihat [`LICENSE`](./LICENSE). Menggabungkan kode dari `base-api-main` (Randy Yuan Kurnianto) dan `api-Takanashi-main`, keduanya MIT.
