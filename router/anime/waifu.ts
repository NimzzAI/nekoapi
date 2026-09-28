import { Request, Response } from 'express';

const UA = () =>
    `${(global as any).namaBot || 'NimzzBot'} (https://nimzz.web.id)`;

interface NekosBestItem {
    url: string;
    artist_name?: string;
    source_url?: string;
    dimensions?: {
        width?: number;
        height?: number;
    };
}

interface NekosBestResponse {
    results?: NekosBestItem[];
}

export default async function waifuHandler(req: Request, res: Response) {
    try {
        const timeoutSignal = AbortSignal.timeout(10000);

        const response = await fetch('https://nekos.best/api/v2/waifu', {
            signal: timeoutSignal,
            headers: {
                'User-Agent': UA(),
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Upstream API responded with status ${response.status}`);
        }

        const data = (await response.json()) as NekosBestResponse;
        const result = data.results?.[0];

        if (!result?.url) {
            throw new Error('Image URL tidak ditemukan dari sumber upstream');
        }

        const imageUrl = result.url;
        const artist = result.artist_name || 'Unknown';
        const source = result.source_url || 'https://nekos.best';
        const width = result.dimensions?.width || 0;
        const height = result.dimensions?.height || 0;

        return res.json({
            status: true,
            category: 'waifu',
            url: imageUrl,
            artist,
            source,
            dimensions: {
                width,
                height
            },
            result: {
                url: imageUrl,
                artist,
                source,
                dimensions: {
                    width,
                    height
                }
            }
        });
    } catch (error: any) {
        const isTimeout = error?.name === 'TimeoutError' || error?.message?.includes('timeout');
        const errorMessage = isTimeout
            ? 'Upstream nekos.best request timed out (10s)'
            : (error?.message || 'Gagal memproses request waifu');

        return res.status(502).json({
            status: false,
            category: 'waifu',
            message: errorMessage,
            fallback: 'Upstream image service may be temporarily degraded, please try again shortly.'
        });
    }
}
