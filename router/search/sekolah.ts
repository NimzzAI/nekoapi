/*
 * NekoAPI
 * © Nimzz / NekoAPI
 * Endpoint: Data Sekolah Seluruh Indonesia
 * Reference: https://github.com/ikhsan-rfl/api-sekolah
 */
import { Request, Response } from 'express';
import axios from 'axios';

const UPSTREAM_URL = 'https://sekolah.devapi.id/sekolah';

export default async function handler(req: Request, res: Response) {
    try {
        const {
            nama,
            bentuk_pendidikan,
            npsn,
            negara,
            akreditasi,
            kode_wilayah,
            limit
        } = req.query;

        // Validasi: jika nama diberikan, harus minimal 3 karakter
        if (nama && typeof nama === 'string' && nama.trim().length > 0 && nama.trim().length < 3) {
            return res.status(400).json({
                creator: 'Nimzz',
                status: false,
                message: "Parameter 'nama' minimal harus 3 karakter (contoh: 'madani', 'SMA Negeri 1', 'bina insani')."
            });
        }

        // Set up parameter pencarian
        const params: Record<string, any> = {};

        if (nama && typeof nama === 'string' && nama.trim()) {
            params.nama = nama.trim();
        }
        if (bentuk_pendidikan && typeof bentuk_pendidikan === 'string' && bentuk_pendidikan.trim()) {
            params.bentuk_pendidikan = bentuk_pendidikan.trim().toUpperCase();
        }
        if (npsn && typeof npsn === 'string' && npsn.trim()) {
            params.npsn = npsn.trim();
        }
        if (negara && typeof negara === 'string' && negara.trim()) {
            params.negara = negara.trim();
        }
        if (akreditasi && typeof akreditasi === 'string' && akreditasi.trim()) {
            params.akreditasi = akreditasi.trim().toUpperCase();
        }
        if (kode_wilayah && String(kode_wilayah).trim()) {
            params.kode_wilayah = String(kode_wilayah).trim();
        }

        // Limit data (default: 10, max: 100)
        let parsedLimit = 10;
        if (limit) {
            const parsed = parseInt(String(limit), 10);
            if (!isNaN(parsed) && parsed > 0) {
                parsedLimit = Math.min(parsed, 100);
            }
        }
        params.limit = parsedLimit;

        // Request ke upstream API
        const response = await axios.get(UPSTREAM_URL, {
            params,
            headers: {
                'User-Agent': 'NekoAPI/1.2 (https://github.com/ikhsan-rfl/api-sekolah)',
                'Accept': 'application/json'
            },
            timeout: 12000
        });

        const data = response.data;

        if (data && data.success) {
            return res.status(200).json({
                creator: 'Nimzz',
                status: true,
                message: data.message || 'Berhasil mengambil data sekolah',
                query: params,
                total: Array.isArray(data.data) ? data.data.length : 0,
                limit: data.limit || parsedLimit,
                page: data.page || 1,
                last_updated: data.last_updated || null,
                result: data.data || []
            });
        }

        return res.status(response.status || 400).json({
            creator: 'Nimzz',
            status: false,
            message: data?.message || 'Data sekolah tidak ditemukan',
            result: []
        });
    } catch (error: any) {
        if (error.response) {
            return res.status(error.response.status || 500).json({
                creator: 'Nimzz',
                status: false,
                message: error.response.data?.message || 'Gagal menghubungi server data sekolah',
                error: error.message
            });
        }

        return res.status(500).json({
            creator: 'Nimzz',
            status: false,
            message: 'Terjadi kesalahan internal saat mengambil data sekolah',
            error: error.message
        });
    }
}
