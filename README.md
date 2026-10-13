<p align="center">
  <img src="public/og-image.jpg" alt="NekoAPI Header Banner" width="100%" />
</p>

<div align="center">

# NekoAPI

High-performance, modular REST API framework built with Express.js, TypeScript, and native Rust backend compute engine.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Rust Engine](https://img.shields.io/badge/Rust_Engine-2021-DEA584?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Modular_Autoload-2B3A67?style=flat-square)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

</div>

---

## Overview

**NekoAPI** is an enterprise-grade REST API application designed for high throughput, extensibility, and maintainability. It features a decentralized file-based router loader, multi-language execution support (TypeScript, ESM, Rust, Go, and PHP), built-in scrapers, system benchmarking tools, and an interactive European-minimalist documentation portal.

Core architectural highlights:
- **Zero-Coupling Route Architecture**: Add, modify, or deprecate endpoints by editing JSON registries and router files without touching `index.ts`.
- **Native Rust Subsystem**: Built-in microsecond-precision hashing and mathematical compute engine with `.rs` compilation support.
- **Interactive Documentation Portal**: Live API test console equipped with custom option chips (*Pilihan Cepat*) for instant parameter validation without manual typing.
- **Polyglot Execution Pipeline**: Seamlessly routes requests between TypeScript modules, standalone ESM files, compiled Rust binaries, Go binaries, and PHP CLI processes.
- **Production-Ready Observability**: In-memory IP rate limiter, structured request logging, and real-time hardware telemetry at `/stats`.

---

## Architecture & Technology Stack

| Component | Specification | Description |
| :--- | :--- | :--- |
| **Runtime** | Node.js 22 LTS | Fast event-loop asynchronous execution environment. |
| **Language** | TypeScript 5.x | Strict static typing and compile-time verification. |
| **Server Framework** | Express.js 4.x | Lightweight, robust HTTP routing and middleware stack. |
| **Compute Engine** | Rust 2021 / Native Subsystem | Zero-cost abstractions, memory-safe hashing, and mathematical calculations. |
| **Scraper Engines** | Axios, Cheerio | Robust HTTP scraping pipeline with custom User-Agents and resilient error handling. |
| **Rate Limiter** | Token Window (In-Memory) | Sliding IP window protection with zero database dependency. |
| **Frontend UI** | Tailwind CSS & Pure Vanilla JS | Minimalist, ultra-responsive documentation console and server monitor. |

---

## Directory Structure

```text
.
├── index.ts                      # Express application entry point & page renderer
├── package.json                  # Dependencies, scripts, and build pipeline
├── tsconfig.json                 # TypeScript compiler configuration
├── README.md                     # Project documentation
│
├── public/                       # Static public assets
│   ├── favicon.png               # Browser tab icon (32x32)
│   ├── og-image.jpg              # OpenGraph 16:9 social preview banner (134 KB)
│   ├── og-image.png              # High-definition lossless cover image
│   ├── thumbnail.mp4             # Landing page video loop asset
│   │
│   ├── docs/                     # Interactive API documentation portal
│   │   ├── docs.html             # Documentation markup
│   │   ├── docs.css              # Custom styling & option chip button layout
│   │   └── docs.js               # Dynamic route loader & interactive test console
│   │
│   ├── landing/                  # Landing page dashboard
│   │   ├── landing.html
│   │   ├── landing.css
│   │   └── landing.js
│   │
│   └── stats/                    # Real-time system monitor & telemetry
│       ├── stats.html
│       ├── stats.css
│       └── stats.js
│
├── router/                       # Endpoint logic handlers
│   ├── search/
│   │   ├── lyrics.ts             # LRCLIB song lyrics & synced karaoke extractor
│   │   ├── vtuber.ts             # VTuberSpace Indonesian VTuber news & directory
│   │   ├── sekolah.ts            # Data Sekolah Seluruh Indonesia API handler
│   │   ├── pinterest.ts          # Pinterest media image search
│   │   └── yts.ts                # YouTube search scraper
│   │
│   ├── tools/
│   │   ├── rust_system.rs        # Native Rust compute engine source
│   │   ├── rust-system.ts        # High-performance Rust system benchmark endpoint
│   │   ├── base64.ts             # Base64 encoder/decoder
│   │   ├── hash.ts               # Multi-algorithm cryptographic hash generator
│   │   ├── shorturl.ts           # URL shortening utility
│   │   ├── ping-js.mjs           # ESM format demonstration handler
│   │   ├── sekolah.ts            # Alias endpoint for sekolah
│   │   ├── lyrics.ts             # Alias endpoint for lyrics
│   │   └── vtuber.ts             # Alias endpoint for vtuber
│   │
│   ├── download/
│   │   └── facebook.ts           # Facebook media downloader
│   │
│   ├── maker/
│   │   └── brat.ts               # Brat text image generator
│   │
│   └── random/
│       ├── blue_archive.ts       # Blue Archive character asset provider
│       └── quotes.ts             # Quote generator
│
└── src/
    ├── autoload.ts               # Multi-language dynamic route resolver & watcher
    ├── config.json               # Global metadata & site configuration
    ├── logger.ts                 # Terminal request logging with ANSI format
    │
    ├── scrapers/                 # Isolated scraper engines
    │   ├── lyrics.ts             # LRCLIB API client & LRC timestamp parser
    │   └── vtuber.ts             # VTuberSpace API client & normalizer
    │
    ├── endpoints/                # Declarative endpoint configuration registries
    │   ├── search.json
    │   ├── tools.json
    │   ├── download.json
    │   ├── maker.json
    │   └── random.json
    │
    └── middleware/
        ├── errorHandler.ts       # Centralized exception handling middleware
        └── rateLimit.ts          # IP-based sliding window rate limiter
```

---

## Endpoint Specifications

### 1. Search & Information

#### Data Sekolah Indonesia (`/api/search/sekolah`)
Queries comprehensive primary, secondary, and vocational school data across Indonesia based on the Kemendagri registry.
- **Method**: `GET`
- **Parameters**:
  - `nama` *(string)*: School name query (min. 3 characters, case-insensitive).
  - `bentuk_pendidikan` *(string)*: Educational tier filter (`SD`, `SMP`, `SMA`, `SMK`, `MA`, `MTS`, `TK`, `PKBM`).
  - `npsn` *(string)*: Unique National School Identification Number (e.g., `69901175`).
  - `akreditasi` *(string)*: Accreditation grade filter (`A`, `B`, `C`).
  - `kode_wilayah` *(string/int)*: Ministry regional code (e.g., `3171` for Central Jakarta).
  - `limit` *(integer)*: Maximum records per page (default: `10`, max: `100`).

#### Song Lyrics & Synced Karaoke (`/api/search/lyrics`)
Extracts comprehensive lyrics metadata, plain text lyrics, synced LRC timestamps, and pre-parsed line-by-line karaoke timings powered by LRCLIB.
- **Method**: `GET`
- **Parameters**:
  - `q` *(string, required)*: Song title or search query (e.g., `Bohemian Rhapsody`, `Komang`).
  - `artist` *(string)*: Artist or band name for strict matching (e.g., `Queen`, `Raim Laode`).
  - `type` *(string)*: Extraction mode (`get` for full synced lyrics, `search` for list, `id` for record ID lookup).
  - `id` *(integer)*: Direct LRCLIB record ID.

#### VTuberSpace News & Directory (`/api/search/vtuber`)
Direct integration with VTuberSpace Indonesia providing articles, talent profiles, debut calendars, and agency listings.
- **Method**: `GET`
- **Parameters**:
  - `action` *(string)*: Action mode (`news`, `home`, `news-detail`, `vtubers`, `search`, `profile`, `debuts`, `agencies`).
  - `q` *(string)*: Search query for VTuber names or article keywords.
  - `id` / `slug` *(string)*: Identifier for article details or talent profiles.
  - `category` *(string)*: News category filter.
  - `sort` *(string)*: Sort direction (`latest`, `popular`, `oldest`).
  - `gender` *(string)*: Talent gender filter (`Female`, `Male`).
  - `year` & `month` *(integer)*: Filter parameters for debut roster.
  - `limit` *(integer)*: Pagination page size (default: `10`).

#### YouTube Search (`/api/search/yts`)
- **Method**: `GET`
- **Parameters**: `q` *(string, required)* - YouTube search query.

#### Pinterest Search (`/api/search/pinterest`)
- **Method**: `GET`
- **Parameters**: `q` *(string, required)* - Image query.

---

### 2. Tools & Compute Engines

#### Rust System & Compute Engine (`/api/tools/rust-system`)
High-performance compute endpoint utilizing native Rust memory models and WebAssembly/Native JIT subsystems.
- **Method**: `GET`
- **Parameters**:
  - `mode` *(string)*: Calculation mode (`system`, `hash`, `primes`, `fibonacci`).
  - `text` *(string)*: Input string for 64-bit FNV-1a, 32-bit Murmur3, and CRC32 hashing.
  - `n` *(integer)*: Upper bound limit for prime counting or Fibonacci sequence calculation.
  - `iterations` *(integer)*: Benchmark iteration count (default: `50000`).

#### Base64 Converter (`/api/tools/base64`)
- **Method**: `GET`
- **Parameters**:
  - `text` *(string)*: Text string to transform.
  - `mode` *(string)*: Conversion direction (`encode`, `decode`).

#### Cryptographic Hash Generator (`/api/tools/hash`)
- **Method**: `GET`
- **Parameters**:
  - `text` *(string)*: Plaintext input.
  - `type` *(string)*: Algorithm (`all`, `md5`, `sha1`, `sha256`, `sha512`).

#### Short URL (`/api/tools/shorturl`)
- **Method**: `GET`
- **Parameters**:
  - `url` *(string, required)*: Target destination URL.
  - `alias` *(string)*: Custom slug.

---

### 3. Media & Generation

#### Facebook Downloader (`/api/download/facebook`)
- **Method**: `GET`
- **Parameters**: `url` *(string, required)* - Public Facebook post or video URL.

#### Brat Image Generator (`/api/maker/brat`)
- **Method**: `GET`
- **Parameters**: `text` *(string, required)* - Text rendered onto the signature aesthetic format.

---

## Interactive Documentation Feature: Quick Choice Chips

The `/docs` documentation interface provides an ergonomic testing experience for endpoints containing enumerated parameter values:

1. **Declarative Options Registry**: Configured in `src/endpoints/*.json` using the `"options": [...]` property.
2. **Custom Option Chips (*Pilihan Cepat*)**: Renders styled button pills next to each parameter input instead of plain text fields or native select menus.
3. **Bi-directional Input Synchronization**:
   - Clicking an option chip immediately populates the input field and triggers URL generation.
   - Re-clicking an active chip clears the selection.
   - Manually typing in the input automatically highlights the corresponding chip in real-time.

---

## Multi-Language Routing Pipeline

NekoAPI supports polyglot endpoint implementations without extra infrastructure. When an endpoint is called, the auto-loader resolves matching files based on priority:

```text
Request: /api/category/filename
                │
                ▼
   1. Check router/category/filename.ts   (TypeScript / Node.js)
   2. Check router/category/filename.js   (CommonJS JavaScript)
   3. Check router/category/filename.mjs  (ECMAScript Module)
   4. Check router/category/filename.rs   (Compiled Rust Binary via rustc)
   5. Check router/category/filename.go   (Compiled Go Binary via go build)
   6. Check router/category/filename.php  (PHP CLI Subprocess)
```

- **Rust (`.rs`)**: Automatically compiled once into an executable binary using `rustc -O -o filename.bin`. The binary is cached for subsequent invocations.
- **Go (`.go`)**: Compiled once into an executable binary using `go build -o filename.bin` and cached in-memory.
- **PHP (`.php`)**: Executed via standard `php` CLI with input passed through `stdin` (JSON format `{"query": {}, "body": {}}`) and output read from `stdout`.

---

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x or 22.x LTS
- npm 9.x or higher
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/nekoapi.git
   cd nekoapi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```

The local development server will be active at:
```text
http://localhost:3000
```

---

## Production Deployment

### Build Application
Compile all TypeScript source code into production JavaScript and synchronize asset directories:
```bash
npm run build
```

The output artifacts are emitted to:
```text
dist/
├── index.js
├── router/
├── src/
│   ├── config.json
│   └── endpoints/
└── public/
```

### Production Execution
Start the compiled application:
```bash
npm start
```

### Process Management with PM2
For dedicated servers (VPS / Bare Metal):
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name "nekoapi"
pm2 save
pm2 startup
```

---

## Rate Limiting Architecture

NekoAPI includes an integrated sliding-window rate limiter configured without external database requirements:

| Configuration Key | Standard Value | Description |
| :--- | :--- | :--- |
| **Max Requests** | `15 requests` | Maximum allowed request quota. |
| **Window Interval** | `1 second` | Duration of the evaluation window. |
| **Ban Duration** | `60 seconds` | Suspension penalty duration for violating clients. |
| **Storage Engine** | In-Memory Heap | High-speed memory storage with automatic stale bucket cleanup. |

When a client IP exceeds the quota, HTTP `429 Too Many Requests` is returned:
```json
{
  "status": false,
  "message": "Too many requests. You are temporarily banned"
}
```

---

## Configuration Reference

Configuration is managed in `src/config.json`:

```json
{
  "settings": {
    "creator": "Nimzz",
    "apiName": "NekoAPI",
    "description": "High-performance REST API service built with Node.js, Express, and Rust engine.",
    "apiVersion": "v1.2",
    "visitors": "0",
    "siteUrl": "https://ais-pre-qk4bvdxpsogfmtf4qbnbsd-28343948057.asia-southeast1.run.app",
    "favicon": "/favicon.png",
    "thumbnail": "/thumbnail.mp4",
    "ogImage": "/og-image.jpg"
  }
}
```

- `siteUrl`: Canonical public URL of the application.
- `ogImage`: Social preview card image (16:9 JPEG, compressed under 300 KB for WhatsApp/Telegram preview compliance).
- `thumbnail`: Media resource displayed on the landing page hero section.

---

## License

This project is licensed under the MIT License. Developed and maintained by **Nimzz**.
