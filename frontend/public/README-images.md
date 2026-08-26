# Gambar yang perlu kamu upload sendiri

Dua file ini dirujuk di kode tapi sengaja tidak disertakan (butuh gambar
milikmu sendiri, bukan placeholder generik):

| Taruh file di sini | Dipakai di | Dirujuk dari |
| --- | --- | --- |
| `public/hero.jpg` | Gambar "About" di homepage (`/`) | `src/config.js` → `heroImage` |
| `public/announcement.jpg` | Gambar di popup pengumuman (`/docs`) | `src/lib/announcement-config.ts` → `imageUrl` |

Cara pakai:
1. Simpan gambarmu dengan nama persis `hero.jpg` dan/atau `announcement.jpg`
   langsung di folder `public/` ini (folder tempat file ini berada).
2. Tidak perlu ubah kode apa pun — path-nya sudah otomatis terhubung.
3. Belum sempat upload? Tidak masalah — kalau file belum ada, gambar
   otomatis disembunyikan (tidak muncul ikon broken-image), homepage dan
   popup tetap tampil normal tanpa gambar.

Mau pakai nama file atau lokasi lain? Ubah `heroImage` di `src/config.js`
atau `imageUrl` di `src/lib/announcement-config.ts` sesuai path barunya.

Hapus file `README-images.md` ini kapan saja setelah gambarnya kamu upload —
murni catatan, tidak dibaca oleh kode.
