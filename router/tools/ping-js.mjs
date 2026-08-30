// Contoh endpoint pakai ES Module murni (import/export), bukan CommonJS.
// Loader NekoAPI otomatis mendeteksi file berekstensi .mjs dan meng-import-nya
// secara async — kamu tetap tulis handler dengan pola yang sama seperti .ts.

import os from 'os';

export default async function pingJsHandler(req, res) {
    res.json({
        status: true,
        result: {
            runtime: 'JavaScript (ES Module)',
            node: process.version,
            platform: os.platform(),
            timestamp: new Date().toISOString()
        }
    });
}
