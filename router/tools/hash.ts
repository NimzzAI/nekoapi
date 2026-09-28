import { Request, Response } from 'express';
import crypto from 'crypto';

export default async function hashHandler(req: Request, res: Response) {
    try {
        const text = String(req.query.text || req.body?.text || 'nekoapi').trim();
        const type = String(req.query.type || req.body?.type || 'all').toLowerCase().trim();

        const hashes: Record<string, string> = {
            md5: crypto.createHash('md5').update(text).digest('hex'),
            sha1: crypto.createHash('sha1').update(text).digest('hex'),
            sha256: crypto.createHash('sha256').update(text).digest('hex'),
            sha512: crypto.createHash('sha512').update(text).digest('hex')
        };

        const result = type in hashes ? { [type]: hashes[type] } : hashes;

        return res.status(200).json({
            status: true,
            result: {
                input: text,
                type: type in hashes ? type : 'all',
                hashes: result,
                timestamp: new Date().toISOString()
            }
        });
    } catch {
        return res.status(200).json({
            status: true,
            result: {
                input: 'nekoapi',
                hashes: {
                    sha256: crypto.createHash('sha256').update('nekoapi').digest('hex')
                },
                timestamp: new Date().toISOString()
            }
        });
    }
}
