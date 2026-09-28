import { Request, Response } from 'express';

export default async function makerHubHandler(req: Request, res: Response) {
    try {
        return res.json({
            status: true,
            category: 'maker',
            service: 'NekoAPI Dynamic Image & Text Generation Hub',
            generators: [
                {
                    name: 'Brat Generator',
                    endpoint: '/api/maker/brat',
                    method: 'GET',
                    description: 'Membuat gambar tipografi album cover Brat khas lime green & blurred text',
                    sample_query: '/api/maker/brat?text=hello+world'
                }
            ],
            output_types: ['image/png', 'image/jpeg'],
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return res.status(500).json({
            status: false,
            category: 'maker',
            message: error?.message || 'Gagal memproses maker hub'
        });
    }
}
