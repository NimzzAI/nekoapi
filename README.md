<div align="center">

# NekoAPI

**Simple, Fast, and Dynamic REST API Base built with Express & TypeScript.**

<p>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white" alt="PM2" />
  <img src="https://img.shields.io/badge/VPS_Ready-107C10?style=for-the-badge&logo=windows-terminal&logoColor=white" alt="VPS" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

</div>

---

## Introduction

**NekoAPI** adalah template dasar untuk membangun REST API menggunakan **Express.js** dan **TypeScript**.

Project ini dirancang dengan struktur modular sehingga endpoint dapat ditambahkan, dikelola, dan dikembangkan tanpa perlu mengubah file utama `index.ts`.

### What You Get

- Dynamic Router
- JSON-based endpoint configuration
- Automatic router loading
- Development hot reload
- Global error handler
- Request logger
- IP-based rate limiter
- Automatic API documentation
- Server statistics
- VPS support
- Vercel support

---

## Features

| Feature | Description |
| :--- | :--- |
| **TypeScript** | Static typing untuk membuat kode lebih aman dan mudah dirawat. |
| **Multi-Language Router** | Endpoint bisa ditulis pakai TypeScript, JavaScript (CommonJS/ESM), Go, atau PHP — dicampur bebas dalam satu project. |
| **Dynamic Routing** | Endpoint didaftarkan melalui file JSON. |
| **Auto Loader** | Router otomatis dimuat berdasarkan konfigurasi endpoint. |
| **Hot Reload** | Config, endpoint, dan router dapat dimuat ulang saat development. |
| **Rate Limiter** | Membatasi request berdasarkan IP tanpa database. |
| **Error Handler** | Menangani error endpoint secara terpusat. |
| **Request Logger** | Menampilkan IP, status code, dan URL request. |
| **Auto Docs** | Dokumentasi endpoint tersedia melalui `/docs`. |
| **Server Stats** | Informasi CPU, RAM, uptime, dan request melalui `/stats`. |
| **Modern UI** | Landing page dan documentation UI bawaan. |
| **Vercel Ready** | Dapat digunakan pada Vercel maupun VPS. |
| **VPS Ready** | Dapat dijalankan menggunakan Node.js atau PM2. |

---

## Rate Limiter

NekoAPI menggunakan **IP-based rate limiter** dan tidak membutuhkan database.

### Default Configuration

| Setting | Value |
| :--- | :--- |
| Request Limit | `15 requests` |
| Window | `1 second` |
| Ban Duration | `1 minute` |
| Storage | In-memory |
| Database | Not required |

Jika sebuah IP mengirim lebih dari **15 request dalam 1 detik**, IP tersebut akan mendapatkan HTTP `429 Too Many Requests` dan diblokir sementara selama **1 menit**.

### Response

```json
{
  "status": false,
  "message": "Too many requests. You are temporarily banned"
}
```

Rate limiter dipasang secara global sehingga berlaku untuk seluruh endpoint yang berada setelah middleware.

> **Note:** Rate limiter menggunakan memory process.
>
> Pada VPS dengan satu process, state berada pada process tersebut.
>
> Pada Vercel/serverless, state tidak dijamin persisten antar-instance. Oleh karena itu, rate limiter ini **bukan distributed rate limiter**.

---

## Project Structure

```text
.
├── index.ts
├── package.json
├── README.md
├── tsconfig.json
├── vercel.json
│
├── public
│   ├── favicon.png
│   ├── og-image.png
│   ├── thumbnail.mp4
│   │
│   ├── docs
│   │   ├── docs.css
│   │   ├── docs.html
│   │   └── docs.js
│   │
│   ├── landing
│   │   ├── landing.css
│   │   ├── landing.html
│   │   └── landing.js
│   │
│   └── stats
│       ├── stats.css
│       ├── stats.html
│       └── stats.js
│
├── router
│   ├── download
│   │   └── facebook.ts
│   │
│   ├── maker
│   │   └── brat.ts
│   │
│   ├── random
│   │   └── blue_archive.ts
│   │
│   ├── search
│   │   ├── pinterest.ts
│   │   └── yts.ts
│   │
│   └── tools
│       ├── shorturl.ts
│       ├── ping-js.mjs
│       ├── ping-go.go
│       └── ping-php.php
│
└── src
    ├── autoload.ts
    ├── config.json
    ├── logger.ts
    │
    ├── endpoints
    │   ├── download.json
    │   ├── maker.json
    │   ├── random.json
    │   ├── search.json
    │   └── tools.json
    │
    └── middleware
        ├── errorHandler.ts
        └── rateLimit.ts
```

---

## Build System

NekoAPI menggunakan **TypeScript** sebagai source code.

Saat project di-build, TypeScript akan dikompilasi menjadi JavaScript dan disimpan di folder `dist/`.

```text
Source Code
    │
    ▼
TypeScript
    │
    ▼
npm run build
    │
    ▼
dist/
    │
    ▼
JavaScript
    │
    ▼
Node.js
```

### Development

```bash
npm run dev
```

Development menjalankan source TypeScript secara langsung.

### Production

```bash
npm run build
npm start
```

Production menjalankan hasil compile dari folder `dist/`.

---

## Installation

### Requirements

Pastikan sudah menginstall:

- Node.js 18+
- npm
- Git

### 1. Clone Repository

```bash
git clone <url-repo-kamu>
cd nekoapi
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Server akan berjalan pada:

```text
http://localhost:3000
```

---

## Configuration

Konfigurasi utama berada di:

```text
src/config.json
```

Contoh:

```json
{
  "settings": {
    "creator": "Nimzz"
  },
  "tags": {}
}
```

### Endpoint Configuration

Konfigurasi endpoint dapat dipisahkan berdasarkan kategori di:

```text
src/endpoints/
```

Contoh:

```text
src/endpoints/search.json
src/endpoints/download.json
src/endpoints/tools.json
```

Setiap file konfigurasi akan otomatis dibaca oleh system loader.

---

## Adding a New Endpoint

Tidak perlu mengubah `index.ts` untuk menambahkan endpoint baru.

Cukup lakukan tiga langkah.

### Step 1 — Add Endpoint Configuration

Buat atau edit:

```text
src/endpoints/games.json
```

Contoh:

```json
[
  {
    "name": "Tebak Gambar",
    "endpoint": "/api/games/tebak",
    "filename": "tebak",
    "method": "GET",
    "params": [
      {
        "name": "level",
        "required": true,
        "description": "Game level"
      }
    ]
  }
]
```

### Step 2 — Create Router

Buat file:

```text
router/games/tebak.ts
```

Contoh:

```typescript
import { Request, Response } from "express";

export default async function tebakHandler(
  req: Request,
  res: Response
) {
  const level = String(req.query.level || "").trim();

  if (!level) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'level' diperlukan."
    });
  }

  return res.json({
    status: true,
    result: {
      level,
      message: `Kamu memilih level ${level}`
    }
  });
}
```

### Step 3 — Test

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

Endpoint akan otomatis tersedia:

```http
GET /api/games/tebak?level=1
```

---

## Multi-Language Endpoints

Router tidak cuma jalan dengan TypeScript. Loader mendeteksi file berdasarkan
`filename` di JSON endpoint dan mencarinya berurutan dengan ekstensi:
`.ts` → `.js` → `.mjs` → `.go` → `.php`. Bahasa apa pun bisa dicampur bebas
dalam satu folder kategori yang sama — `router/tools/` misalnya sudah berisi
contoh keempatnya sekaligus (`shorturl.ts`, `ping-js.mjs`, `ping-go.go`,
`ping-php.php`).

Konfigurasi endpoint (`src/endpoints/*.json`) tetap sama persis di semua
bahasa — yang berbeda cuma isi file router-nya.

### JavaScript (ES Module)

Gunakan ekstensi `.js` yang biasa (bekerja seperti sekarang, format
CommonJS) di project ini karena `package.json` tidak diset
`"type": "module"`. Untuk menulis pakai `import`/`export` murni, simpan
sebagai **`.mjs`** — loader akan meng-import-nya secara async otomatis.
Polanya identik dengan `.ts`, tinggal hilangkan tipe TypeScript-nya:

```javascript
// router/tools/contoh.mjs
import axios from 'axios';

export default async function contohHandler(req, res) {
    res.json({ status: true, result: 'halo dari ES module' });
}
```

### Go

Loader meng-compile file `.go` sekali (`go build`), hasil binary-nya
di-cache dan dipakai ulang untuk request berikutnya — bukan compile
ulang tiap request. Endpoint Go **wajib**:

- Baca input dari **stdin**, format JSON: `{"query": {...}, "body": {...}}`
- Tulis output ke **stdout**, satu JSON valid (jadi response API)
- `exit 0` kalau sukses, exit code lain dianggap error (stderr dibaca
  sebagai pesan error)

Lihat `router/tools/ping-go.go` untuk contoh lengkap. Test manual di luar
server:

```bash
go build -o ping-go.bin router/tools/ping-go.go
echo '{"query":{},"body":{}}' | ./ping-go.bin
```

Butuh `go` terinstal di server (`go version` harus jalan). Kalau tidak
ada, endpoint `.go` otomatis di-skip dengan response `501` yang jelas —
server tetap jalan normal, endpoint lain tidak terganggu.

### PHP

Sama seperti Go tapi tanpa compile — dijalankan langsung lewat
`php file.php` tiap request, dengan kontrak stdin/stdout yang sama persis
(lihat `router/tools/ping-php.php`):

```bash
echo '{"query":{},"body":{}}' | php router/tools/ping-php.php
```

Butuh `php` terinstal di server (`php --version` harus jalan). Sama seperti
Go, kalau tidak ada, endpoint di-skip otomatis dengan response `501`.

### Batasan di Vercel

Endpoint `.go` dan `.php` **tidak akan jalan** kalau di-deploy ke Vercel
serverless — runtime Go/PHP tidak tersedia di environment Node serverless
function, dan compile Go saat cold-start juga tidak didukung. Keduanya
cuma jalan di server yang kamu kontrol penuh prosesnya (VPS lewat PM2,
misalnya). TypeScript, `.js`, dan `.mjs` tetap jalan normal di Vercel
seperti biasa.

---

## Auto Loader

File:

```text
src/autoload.ts
```

bertanggung jawab untuk:

- Membaca konfigurasi endpoint
- Mencari file router
- Register route ke Express
- Reload konfigurasi
- Reload endpoint
- Reload router
- Membersihkan module cache saat development

### Route Mapping

Struktur route ditentukan berdasarkan:

```text
src/endpoints/category.json
        │
        ▼
router/category/filename.ts
```

Contoh:

```text
src/endpoints/search.json
        │
        ▼
router/search/yts.ts
```

Dengan struktur tersebut, penambahan endpoint dapat dilakukan tanpa memodifikasi file utama.

---

## Error Handler

Error endpoint ditangani secara terpusat menggunakan middleware error handler.

Router tidak perlu menggunakan `try/catch` untuk error yang tidak terduga.

Contoh:

```typescript
export default async function exampleHandler(
  req: Request,
  res: Response
) {
  const data = await someRequest();

  return res.json({
    status: true,
    result: data
  });
}
```

Jika terjadi error:

```text
Router
  │
  ▼
throw error
  │
  ▼
Auto Loader
  │
  ▼
Error Handler
  │
  ▼
HTTP 500
```

Pendekatan ini membuat kode endpoint lebih pendek dan konsisten.

---

## Request Logger

Request API dicatat melalui:

```text
src/logger.ts
```

### Log Format

```text
[IP] = [STATUS] URL
```

Contoh:

```text
[127.0.0.1] = [200] http://localhost:3000/api/search/yts?q=test
[127.0.0.1] = [429] http://localhost:3000/api/search/yts?q=test
[127.0.0.1] = [500] http://localhost:3000/api/search/yts?q=test
```

Status code menggunakan warna ANSI pada terminal.

---

## Server Statistics

Statistics tersedia melalui:

```text
/stats
```

Data JSON tersedia melalui:

```text
/stats/data
```

### Available Information

- Operating system
- CPU architecture
- Hostname
- Node.js version
- Server uptime
- RAM usage
- CPU model
- CPU speed
- CPU cores
- CPU load
- Recent API requests

---

## Documentation

Documentation UI tersedia melalui:

```text
/docs
```

Endpoint yang didaftarkan melalui:

```text
src/endpoints/*.json
```

dapat ditampilkan secara otomatis pada documentation UI.

---

## Available Pages

| Path | Description |
| :--- | :--- |
| `/` | Landing page |
| `/docs` | API documentation |
| `/stats` | Server statistics |
| `/stats/data` | Server statistics JSON |
| `/config` | API configuration |

---

## Production

### Build

```bash
npm run build
```

Kemudian jalankan:

```bash
npm start
```

Pastikan folder hasil build tersedia:

```text
dist/
├── index.js
├── src/
└── router/
```

---

## PM2

Untuk menjalankan API sebagai background process pada VPS, install PM2:

```bash
npm install -g pm2
```

Build project:

```bash
npm run build
```

Start application:

```bash
pm2 start dist/index.js --name "nekoapi"
```

Save process list:

```bash
pm2 save
```

Enable startup:

```bash
pm2 startup
```

Check status:

```bash
pm2 status
```

View logs:

```bash
pm2 logs nekoapi
```

Restart application:

```bash
pm2 restart nekoapi
```

---

## Vercel

NekoAPI dapat digunakan pada **Vercel**.

Pastikan file berikut tersedia pada root project:

```text
vercel.json
```

### Deployment

1. Push repository ke GitHub.
2. Import repository ke Vercel.
3. Deploy project.
4. Vercel akan menggunakan konfigurasi deployment yang tersedia.

> **Important:** Rate limiter berbasis memory tidak dirancang sebagai distributed rate limiter.
>
> Pada platform serverless seperti Vercel, beberapa instance dapat memiliki memory/state yang berbeda.

---

## NPM Scripts

### Development

```bash
npm run dev
```

Menjalankan server dalam mode development.

### Build

```bash
npm run build
```

Compile TypeScript menjadi JavaScript.

### Production

```bash
npm start
```

Menjalankan hasil build production.

### PM2

```bash
npm run pm2
```

Menjalankan server menggunakan konfigurasi PM2 jika script tersebut tersedia di `package.json`.

---

## Development Tips

Sebelum menjalankan production, selalu lakukan build:

```bash
npm run build
```

Jika terdapat error TypeScript, perbaiki error tersebut sebelum menjalankan production.

### Check Build Output

```bash
ls dist
```

### Check Routers

```bash
find dist/router -type f
```

---

## Troubleshooting

### Config File Not Found

Pastikan file berikut tersedia:

```text
src/config.json
```

### Route Tidak Muncul

Periksa:

```text
src/endpoints/
```

Pastikan `filename` sesuai dengan file router pada:

```text
router/<category>/<filename>.ts
```

Contoh:

```json
{
  "filename": "yts"
}
```

harus memiliki router:

```text
router/search/yts.ts
```

### Rate Limit Terkena 429

Jika sebuah IP melakukan lebih dari **15 request dalam 1 detik**, IP tersebut akan diblokir sementara selama **1 menit**.

Response:

```json
{
  "status": false,
  "message": "Too many requests. You are temporarily banned"
}
```

### Build Error

Jalankan:

```bash
npm run build
```

Kemudian periksa pesan error TypeScript yang muncul pada terminal.

---

## License

Project ini dapat digunakan sebagai base untuk membuat REST API pribadi maupun project publik.

Silakan sesuaikan endpoint, konfigurasi, dan tampilan sesuai kebutuhan project.

---

## Catatan Migrasi dari Template Asli

Saat template ini dirapikan jadi NekoAPI, satu endpoint sengaja **tidak dibawa**: `router/ai/kuroneko.ts`.
Endpoint itu bukan memanggil API resmi, melainkan meniru request browser ke endpoint internal
Gemini (`BardChatUi/batchexecute`) pakai cookie scraping untuk mengakalinya secara gratis tanpa API key resmi.
Kategori `ai` untuk sementara kosong — silakan isi dengan integrasi AI resmi (API key resmi dari provider) kalau dibutuhkan.

Dua gambar bawaan template (`src/danzz.jpg`, `src/thumbnail.jpg`) juga diganti dengan
`public/favicon.svg` dan `public/thumbnail.svg` buatan sendiri, karena keduanya artwork
anime milik pihak lain yang tidak terkait dengan project ini.

---

<div align="center">

Created by **Nimzz**

</div>
