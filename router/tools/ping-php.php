<?php
/**
 * Contoh endpoint pakai PHP. Loader NekoAPI menjalankan file ini lewat
 * `php ping-php.php` sebagai subprocess setiap ada request masuk.
 *
 * Kontrak wajib:
 *   - Input dibaca dari STDIN, berupa JSON: {"query": {...}, "body": {...}}
 *   - Output ditulis ke STDOUT, HARUS satu JSON valid (jadi response API)
 *   - Exit code 0 = sukses. Exit code != 0 = dianggap error.
 *
 * Catatan: endpoint .php hanya berjalan di server yang punya `php`
 * terinstal (VPS/PM2). Tidak berjalan di Vercel serverless — otomatis
 * dilewati dengan pesan yang jelas kalau runtime PHP tidak ada.
 *
 * Test manual:
 *   echo '{"query":{},"body":{}}' | php ping-php.php
 */

$raw = file_get_contents('php://stdin');
$input = json_decode($raw, true);

$query = $input['query'] ?? [];
$body = $input['body'] ?? [];

$response = [
    'status' => true,
    'result' => [
        'runtime' => 'PHP',
        'phpVersion' => phpversion(),
        'platform' => php_uname('s') . '/' . php_uname('m'),
        'timestamp' => gmdate('c')
    ]
];

echo json_encode($response);
