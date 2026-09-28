<div align="center">

# NekoAPI

**Modern, Fast, and Dynamic REST API Platform built with Express & TypeScript.**

<p>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Vercel_Ready-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node 22" />
  <img src="https://img.shields.io/badge/Status-100%25_Operational-10B981?style=for-the-badge" alt="Operational" />
</p>

</div>

---

## 📌 Introduction

**NekoAPI** adalah platform REST API berkecepatan tinggi yang dibangun di atas **Node.js, Express, dan TypeScript**. 

Project ini telah di-upgrade dengan arsitektur **Standalone Category Endpoints** — setiap kategori memiliki endpoint langsung yang dapat diakses dengan metode `GET` tanpa mengharuskan pengguna mengirim query parameter (Zero-Configuration).

### Fitur Utama

- ⚡ **Standalone Category Hubs**: Akses langsung kategori via `GET /api/<kategori>` tanpa perlu parameter query.
- 🎀 **Random Waifu Generator**: Endpoint resolusi tinggi `GET /api/waifu` bersumber langsung dari `nekos.best`.
- 💬 **Random Quotes Engine**: Kutipan motivasi, anime, cinta, dan filosofi hidup (`GET /api/quote`).
- 🛠️ **Developer Tools**: Pemendek URL, ping runtime, dan health diagnostics (`GET /api/tools`).
- 🔍 **Search & Downloader**: Pencarian multimedia YouTube, Pinterest, dan downloader Facebook.
- 🎨 **Modern Interactive Dashboard**: UI/UX baru yang bersih, minimalis, responsif, dark/light mode, dan dilengkapi konsol Live API Tester.
- 🛡️ **In-Memory Rate Limiter**: Proteksi brute-force berbasis IP tanpa ketergantungan database eksternal.
- 🚀 **Multi-Language Router**: Mendukung TypeScript, JavaScript (CommonJS/ESM), Go, dan PHP.
- ☁️ **Vercel & VPS Ready**: Dikonfigurasi untuk deployment serverless Vercel maupun process runner VPS (PM2).

---

## 🚀 Standalone Category Endpoints

Setiap kategori utama dapat langsung dipanggil dengan metode `GET` tanpa query parameter:

| Kategori | Standalone Endpoint | Method | Keterangan | Query Required? |
| :--- | :--- | :--- | :--- | :--- |
| **Anime** | `/api/waifu` | `GET` | Gambar anime waifu acak resolusi tinggi lengkap | ❌ Tidak (0 params) |
| **Quotes** | `/api/quote` | `GET` | Kutipan inspiratif, anime, cinta, dan filosofi | ❌ Tidak (0 params) |
| **Random** | `/api/random` | `GET` | Hub generator konten acak dan metadata | ❌ Tidak (0 params) |
| **Tools** | `/api/tools` | `GET` | Status sistem, metrik memori, dan daftar utilitas | ❌ Tidak (0 params) |
| **Search** | `/api/search` | `GET` | Status search engine, kapabilitas, & saran trending | ❌ Tidak (0 params) |
| **Download** | `/api/download` | `GET` | Status media downloader & platform yang didukung | ❌ Tidak (0 params) |
| **Maker** | `/api/maker` | `GET` | Layanan dynamic text-to-image generator | ❌ Tidak (0 params) |

---

## 📖 Endpoint Documentation & Examples

### 1. Anime — Random Waifu
Mengambil gambar waifu acak dari upstream `nekos.best` dengan proteksi timeout (10s) dan validasi response.

- **URL**: `GET /api/waifu`
- **Params**: Tidak ada

**Sample Response**:
```json
{
  "creator": "Nimzz",
  "status": true,
  "category": "waifu",
  "url": "https://nekos.best/api/v2/waifu/0501e2ff-081c-4b3d-9fd9-e46968ab22c4.png",
  "artist": "fu_u03",
  "source": "https://www.pixiv.net/en/artworks/98918817",
  "dimensions": {
    "width": 1280,
    "height": 1810
  },
  "result": {
    "url": "https://nekos.best/api/v2/waifu/0501e2ff-081c-4b3d-9fd9-e46968ab22c4.png",
    "artist": "fu_u03",
    "source": "https://www.pixiv.net/en/artworks/98918817",
    "dimensions": {
      "width": 1280,
      "height": 1810
    }
  }
}
```

---

### 2. Quotes — Random Quote
Mengambil kutipan acak. Mendukung filter opsional `category`, `lang`, atau `author`.

- **URL**: `GET /api/quote`
- **Optional Query**: `category` (motivation, anime, life, love, wisdom), `lang` (id, en), `author`

**Sample Response**:
```json
{
  "creator": "Nimzz",
  "status": true,
  "category": "quote",
  "quote": "Bermimpilah setinggi langit. Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang.",
  "author": "Ir. Soekarno",
  "topic": "motivation",
  "language": "id",
  "result": {
    "quote": "Bermimpilah setinggi langit. Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang.",
    "author": "Ir. Soekarno",
    "category": "motivation",
    "language": "id"
  },
  "total_available": 30
}
```

---

### 3. Random — Random Hub & Sub-endpoints
- `GET /api/random` — Hub konten acak
- `GET /api/random/blue_archive` — Gambar karakter Blue Archive acak
- `GET /api/random/quotes` — Versi legacy endpoint quote

**Sample Response (`/api/random`)**:
```json
{
  "creator": "Nimzz",
  "status": true,
  "category": "random",
  "description": "NekoAPI Random Content Generator Hub",
  "featured_quote": {
    "quote": "Aku tidak akan menarik kembali kata-kataku, karena itulah jalan ninjaku!",
    "author": "Naruto Uzumaki (Naruto)",
    "category": "anime",
    "language": "id"
  },
  "available_endpoints": [
    {
      "name": "Random Waifu",
      "endpoint": "/api/waifu",
      "method": "GET"
    },
    {
      "name": "Random Quote",
      "endpoint": "/api/quote",
      "method": "GET"
    }
  ]
}
```

---

### 4. Developer Tools
- `GET /api/tools` — Diagnostik status server, memori, & daftar tools
- `GET /api/tools/shorturl?url=https://example.com` — Pemendek URL TinyURL
- `GET /api/tools/ping-js` — Status runtime Node.js ESM

**Sample Response (`/api/tools`)**:
```json
{
  "creator": "Nimzz",
  "status": true,
  "category": "tools",
  "service": "NekoAPI Developer Utilities",
  "server": {
    "platform": "linux",
    "node": "v22.14.0",
    "arch": "x64",
    "uptime_seconds": 1284,
    "memory_usage_mb": 62
  },
  "tools": [
    { "name": "Short URL", "endpoint": "/api/tools/shorturl" },
    { "name": "Ping JS ESM", "endpoint": "/api/tools/ping-js" }
  ]
}
```

---

### 5. Media Search
- `GET /api/search` — Status layanan pencarian & trending queries
- `GET /api/search/yts?q=keyword` — Pencarian video YouTube
- `GET /api/search/pinterest?q=keyword` — Pencarian gambar Pinterest

**Sample Response (`/api/search/yts?q=lofi`)**:
```json
{
  "creator": "Nimzz",
  "status": true,
  "result": [
    {
      "title": "lofi hip hop radio 📚 - beats to relax/study to",
      "thumbnail": "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
      "duration": "LIVE",
      "uploaded": "Started streaming 2 days ago",
      "views": "28K watching",
      "url": "https://youtu.be/jfKfPfyJRdk",
      "videoId": "jfKfPfyJRdk"
    }
  ]
}
```

---

### 6. Media Downloader
- `GET /api/download` — Status downloader & format
- `GET /api/download/facebook?url=https://...` — Pengunduh video Facebook SD & HD

**Sample Response (`/api/download`)**:
```json
{
  "creator": "Nimzz",
  "status": true,
  "category": "download",
  "service": "NekoAPI Media Downloader Hub",
  "supported_platforms": [
    {
      "name": "Facebook Video",
      "endpoint": "/api/download/facebook",
      "features": ["SD Quality", "HD Quality"]
    }
  ]
}
```

---

### 7. Image Maker
- `GET /api/maker` — Status layanan dynamic image generator
- `GET /api/maker/brat?text=hello` — Brat typography generator (`image/png`)

---

## 💻 Integrasi Kode

### JavaScript (Fetch API)
```javascript
const response = await fetch('https://YOUR_DOMAIN/api/waifu');
const data = await response.json();
console.log(data.url);
```

### Python (Requests)
```python
import requests

res = requests.get('https://YOUR_DOMAIN/api/quote', timeout=10)
print(res.json())
```

### cURL
```bash
curl -X GET "https://YOUR_DOMAIN/api/waifu" -H "Accept: application/json"
```

---

## 🖥️ UI Dashboard & Live Tester

Buka halaman utama di `/` untuk menikmati dashboard interaktif baru:
1. **Interactive API Tester**: Pilih endpoint dan klik **Execute** untuk melihat response langsung tanpa reload.
2. **Visual Media Preview**: Gambar waifu, poster, dan gambar dinamis langsung dirender pada panel tester.
3. **Copy Helper**: Salin URL endpoint, snippet cURL, atau payload JSON dengan konfirmasi toast instan.
4. **Theme Switcher**: Beralih antara Dark Mode dan Light Mode dengan preferensi tersimpan di peramban.

---

## 🛠️ Instalasi & Menjalankan Project

### 1. Clone & Install
```bash
git clone https://github.com/NimzzAI/nekoapi.git
cd nekoapi
npm install
```

### 2. Jalankan Mode Development
```bash
npm run dev
```
Server berjalan di `http://0.0.0.0:3000`.

### 3. Build & Jalankan Mode Production
```bash
npm run build
npm start
```

### 4. Deploy ke Vercel
Project sudah dilengkapi file `vercel.json` yang dioptimasi untuk `@vercel/node`.
1. Hubungkan repository GitHub ke dashboard Vercel.
2. Pastikan framework preset dipilih **Other**.
3. Deploy — semua konfigurasi dan file router otomatis disertakan dalam bundle Vercel.

---

<div align="center">

Made with ❤️ by **Nimzz** • © 2026 NekoAPI

</div>
