/**
 * ========================================================
 * Name: Get Lyrics - Song Lyrics & Synced Karaoke Extractor Engine
 * Author: Vamz Spectre / NekoAPI Integration
 * Source: https://vamxapi.my.id / https://lrclib.net/api
 * ========================================================
 */
import axios from 'axios';

const API_BASE = 'https://lrclib.net/api';
const USER_AGENT = 'VamxAPI/1.0 (https://vamxapi.my.id; contact@vamxapi.my.id)';

export interface ParsedLrcLine {
    time: string;
    timestamp: number;
    text: string;
}

/**
 * Parser format LRC (Timecoded Synced Lyrics) ke structured format
 * Mengonversi baris [00:15.20] Lyric line -> { time: "00:15.20", timestamp: 15.2, text: "Lyric line" }
 */
export function parseLRC(lrcText: string | null | undefined): ParsedLrcLine[] {
    if (!lrcText || typeof lrcText !== 'string') return [];
    const lines = lrcText.split('\n');
    const parsed: ParsedLrcLine[] = [];
    const regex = /^\[(\d{2}):(\d{2}(?:\.\d+)?)\]\s?(.*)$/;

    for (const line of lines) {
        const trimmed = line.trim();
        const match = trimmed.match(regex);
        if (match) {
            const min = parseInt(match[1], 10);
            const sec = parseFloat(match[2]);
            const timestamp = parseFloat((min * 60 + sec).toFixed(2));
            const text = match[3] ? match[3].trim() : '';
            parsed.push({
                time: `${match[1]}:${match[2]}`,
                timestamp,
                text
            });
        }
    }

    return parsed;
}

/**
 * 1. Cari Daftar Lagu Berdasarkan Judul, Artis, atau Kata Kunci
 */
export async function searchSongs(query: string) {
    const q = (query || '').trim();
    if (!q) {
        throw new Error('Parameter query pencarian lagu wajib diisi!');
    }

    const res = await axios.get(`${API_BASE}/search`, {
        params: { q },
        headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json'
        },
        timeout: 12000
    });

    const items = res.data;
    if (!Array.isArray(items) || items.length === 0) {
        return {
            status: false,
            creator: 'Nimzz',
            message: `Tidak ditemukan lagu dengan kata kunci: "${q}"`,
            results: []
        };
    }

    const results = items.map((item: any) => ({
        id: item.id,
        trackName: item.trackName,
        artistName: item.artistName,
        albumName: item.albumName || null,
        duration: item.duration || null,
        instrumental: Boolean(item.instrumental),
        hasSyncedLyrics: Boolean(item.syncedLyrics),
        hasPlainLyrics: Boolean(item.plainLyrics)
    }));

    return {
        status: true,
        creator: 'Nimzz',
        query: q,
        total: results.length,
        results
    };
}

/**
 * 2. Ambil Lirik Berdasarkan ID Rekaman LRCLIB
 */
export async function getLyricsById(id: string | number) {
    const cleanId = String(id || '').trim();
    if (!cleanId) {
        throw new Error('Parameter ID lagu wajib disertakan!');
    }

    try {
        const res = await axios.get(`${API_BASE}/get/${encodeURIComponent(cleanId)}`, {
            headers: {
                'User-Agent': USER_AGENT,
                Accept: 'application/json'
            },
            timeout: 12000
        });

        const data = res.data;
        const parsedSynced = data.syncedLyrics ? parseLRC(data.syncedLyrics) : [];

        return {
            status: true,
            creator: 'Nimzz',
            id: data.id,
            trackName: data.trackName,
            artistName: data.artistName,
            albumName: data.albumName || null,
            duration: data.duration || null,
            instrumental: Boolean(data.instrumental),
            plainLyrics: data.plainLyrics || null,
            syncedLyrics: data.syncedLyrics || null,
            lines: parsedSynced
        };
    } catch (err: any) {
        if (err.response && err.response.status === 404) {
            return {
                status: false,
                creator: 'Nimzz',
                message: `Lagu dengan ID ${cleanId} tidak ditemukan.`
            };
        }
        throw new Error(`Gagal mengambil lirik: ${err.message}`);
    }
}

/**
 * 3. Ambil Lirik Lagu Lengkap (Plain + Synced Karaoke + Structured Lines)
 */
export async function getLyrics(query: string, artist = '') {
    const cleanQuery = (query || '').trim();
    const cleanArtist = (artist || '').trim();

    if (!cleanQuery) {
        throw new Error('Judul lagu atau kata kunci pencarian wajib disertakan!');
    }

    // Jika nama lagu & artis keduanya disediakan, coba endpoint direct match
    if (cleanArtist) {
        try {
            const directRes = await axios.get(`${API_BASE}/get`, {
                params: {
                    track_name: cleanQuery,
                    artist_name: cleanArtist
                },
                headers: {
                    'User-Agent': USER_AGENT,
                    Accept: 'application/json'
                },
                timeout: 10000
            });

            const directData = directRes.data;
            if (directData && (directData.plainLyrics || directData.syncedLyrics)) {
                return {
                    status: true,
                    creator: 'Nimzz',
                    id: directData.id,
                    trackName: directData.trackName,
                    artistName: directData.artistName,
                    albumName: directData.albumName || null,
                    duration: directData.duration || null,
                    instrumental: Boolean(directData.instrumental),
                    hasSyncedLyrics: Boolean(directData.syncedLyrics),
                    plainLyrics: directData.plainLyrics || null,
                    syncedLyrics: directData.syncedLyrics || null,
                    lines: directData.syncedLyrics ? parseLRC(directData.syncedLyrics) : []
                };
            }
        } catch (_) {
            // Abaikan dan lanjut ke pencarian universal
        }
    }

    // Pencarian universal via query search
    const searchQuery = cleanArtist ? `${cleanQuery} ${cleanArtist}` : cleanQuery;
    const res = await axios.get(`${API_BASE}/search`, {
        params: { q: searchQuery },
        headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json'
        },
        timeout: 12000
    });

    const items = res.data;
    if (!Array.isArray(items) || items.length === 0) {
        return {
            status: false,
            creator: 'Nimzz',
            message: `Lirik tidak ditemukan untuk lagu: "${searchQuery}"`
        };
    }

    // Prioritaskan item yang memiliki syncedLyrics atau plainLyrics
    const bestMatch = items.find((i: any) => i.syncedLyrics || i.plainLyrics) || items[0];

    if (!bestMatch.plainLyrics && !bestMatch.syncedLyrics) {
        return {
            status: false,
            creator: 'Nimzz',
            message: `Tersedia data lagu (${bestMatch.trackName} - ${bestMatch.artistName}), namun lirik belum dipublikasikan atau instrumental.`
        };
    }

    const parsedLines = bestMatch.syncedLyrics ? parseLRC(bestMatch.syncedLyrics) : [];

    return {
        status: true,
        creator: 'Nimzz',
        id: bestMatch.id,
        trackName: bestMatch.trackName,
        artistName: bestMatch.artistName,
        albumName: bestMatch.albumName || null,
        duration: bestMatch.duration || null,
        instrumental: Boolean(bestMatch.instrumental),
        hasSyncedLyrics: Boolean(bestMatch.syncedLyrics),
        plainLyrics: bestMatch.plainLyrics || null,
        syncedLyrics: bestMatch.syncedLyrics || null,
        lines: parsedLines
    };
}
