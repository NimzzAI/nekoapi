import { Request, Response } from 'express';
import { quotesDatabase } from '../quotes/quote';

export default async function randomHubHandler(req: Request, res: Response) {
    try {
        const randomQuote = quotesDatabase[Math.floor(Math.random() * quotesDatabase.length)];

        return res.json({
            status: true,
            category: 'random',
            description: 'NekoAPI Random Content Generator Hub',
            featured_quote: randomQuote,
            available_endpoints: [
                {
                    name: 'Random Waifu',
                    endpoint: '/api/waifu',
                    method: 'GET',
                    description: 'Acak gambar waifu anime resolusi tinggi'
                },
                {
                    name: 'Random Quote',
                    endpoint: '/api/quote',
                    method: 'GET',
                    description: 'Kutipan motivasi, anime, dan filsafat hidup acak'
                },
                {
                    name: 'Random Blue Archive',
                    endpoint: '/api/random/blue_archive',
                    method: 'GET',
                    description: 'Gambar karakter Blue Archive acak'
                }
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return res.status(500).json({
            status: false,
            category: 'random',
            message: error?.message || 'Gagal memproses random hub'
        });
    }
}
