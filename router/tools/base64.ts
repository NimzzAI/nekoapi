import { Request, Response } from 'express';

export default async function base64Handler(req: Request, res: Response) {
    try {
        const text = String(req.query.text || req.body?.text || 'Hello NekoAPI!').trim();
        const mode = String(req.query.mode || req.body?.mode || 'encode').toLowerCase().trim();

        let result = '';
        if (mode === 'decode') {
            try {
                result = Buffer.from(text, 'base64').toString('utf-8');
            } catch {
                result = Buffer.from(text, 'utf-8').toString('base64');
            }
        } else {
            result = Buffer.from(text, 'utf-8').toString('base64');
        }

        return res.status(200).json({
            status: true,
            result: {
                input: text,
                mode: mode === 'decode' ? 'decode' : 'encode',
                output: result,
                timestamp: new Date().toISOString()
            }
        });
    } catch {
        return res.status(200).json({
            status: true,
            result: {
                input: 'NekoAPI',
                mode: 'encode',
                output: Buffer.from('NekoAPI').toString('base64'),
                timestamp: new Date().toISOString()
            }
        });
    }
}
