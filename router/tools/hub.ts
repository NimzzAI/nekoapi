import { Request, Response } from 'express';
import os from 'os';

export default async function toolsHubHandler(req: Request, res: Response) {
    try {
        const uptimeSeconds = os.uptime();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        return res.json({
            status: true,
            category: 'tools',
            service: 'NekoAPI Developer Utilities',
            server: {
                platform: os.platform(),
                node: process.version,
                arch: os.arch(),
                uptime_seconds: Math.floor(uptimeSeconds),
                memory_usage_mb: Math.round((totalMem - freeMem) / (1024 * 1024))
            },
            tools: [
                {
                    name: 'Short URL',
                    endpoint: '/api/tools/shorturl',
                    method: 'GET',
                    usage: '/api/tools/shorturl?url=https://example.com'
                },
                {
                    name: 'Ping JS ESM',
                    endpoint: '/api/tools/ping-js',
                    method: 'GET',
                    usage: '/api/tools/ping-js'
                }
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return res.status(500).json({
            status: false,
            category: 'tools',
            message: error?.message || 'Gagal memproses tools hub'
        });
    }
}
