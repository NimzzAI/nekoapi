/*
 * NekoAPI
 * © Nimzz / NekoAPI
 * Endpoint: Song Lyrics & Synced Karaoke Extractor Engine
 * Source: LRCLIB (https://lrclib.net/api)
 */
import { Request, Response } from 'express';
import { getLyrics, searchSongs, getLyricsById } from '../../src/scrapers/lyrics';

export default async function handler(req: Request, res: Response) {
    try {
        const query = String(req.query.q || req.query.title || req.query.query || '').trim();
        const artist = String(req.query.artist || '').trim();
        const id = String(req.query.id || '').trim();
        const type = String(req.query.type || req.query.action || '').toLowerCase().trim();

        // 1. Ambil berdasarkan ID jika type='id' atau parameter 'id' disediakan
        if (type === 'id' || (id && !query)) {
            if (!id) {
                return res.status(400).json({
                    creator: 'Nimzz',
                    status: false,
                    message: "Parameter 'id' wajib diisi untuk pencarian berdasarkan ID lagu."
                });
            }
            const data = await getLyricsById(id);
            return res.json(data);
        }

        // 2. Ambil hanya daftar pencarian jika type='search'
        if (type === 'search') {
            if (!query) {
                return res.status(400).json({
                    creator: 'Nimzz',
                    status: false,
                    message: "Parameter 'q' atau 'title' wajib diisi untuk pencarian daftar lagu."
                });
            }
            const data = await searchSongs(query);
            return res.json(data);
        }

        // 3. Default: Ambil lirik lengkap + synced karaoke lines
        if (!query) {
            return res.status(400).json({
                creator: 'Nimzz',
                status: false,
                message: "Parameter judul lagu 'q' atau 'title' wajib disertakan. Contoh: /api/search/lyrics?q=Bohemian Rhapsody atau ?q=Komang&artist=Raim Laode"
            });
        }

        const data = await getLyrics(query, artist);
        return res.json(data);
    } catch (error: any) {
        return res.status(500).json({
            creator: 'Nimzz',
            status: false,
            message: error.message || 'Terjadi kesalahan saat memproses data lirik lagu'
        });
    }
}
