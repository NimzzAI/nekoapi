/*
 * NekoAPI
 * © Nimzz / NekoAPI
 * Endpoint: VTuberSpace - Indonesian VTuber News & Directory Engine
 * Source: https://vtuberspace.id
 */
import { Request, Response } from 'express';
import {
    getHome,
    getNews,
    getNewsDetail,
    getVtubers,
    searchVtuber,
    getVtuberDetail,
    getDebuts,
    getAgencies
} from '../../src/scrapers/vtuber';

export default async function handler(req: Request, res: Response) {
    try {
        const action = String(req.query.action || req.query.type || 'news').toLowerCase().trim();
        const q = String(req.query.q || req.query.search || req.query.nama || '').trim();
        const idOrSlug = String(req.query.id || req.query.slug || '').trim();

        // 1. Beranda / Home dashboard
        if (action === 'home') {
            const data = await getHome();
            return res.json(data);
        }

        // 2. Detail Berita
        if (action === 'news-detail' || (action === 'detail' && idOrSlug)) {
            const identifier = idOrSlug || q;
            if (!identifier) {
                return res.status(400).json({
                    creator: 'Nimzz',
                    status: false,
                    message: "Parameter 'id' atau 'slug' berita wajib disertakan."
                });
            }
            const data = await getNewsDetail(identifier);
            return res.json(data);
        }

        // 3. Pencarian VTuber atau Daftar VTuber
        if (action === 'search' || action === 'search-vtuber') {
            if (!q) {
                return res.status(400).json({
                    creator: 'Nimzz',
                    status: false,
                    message: "Parameter query 'q' atau nama VTuber wajib diisi."
                });
            }
            const limit = Number(req.query.limit) || 10;
            const data = await searchVtuber(q, limit);
            return res.json(data);
        }

        // 4. Detail Profil VTuber
        if (action === 'vtuber-detail' || action === 'profile') {
            const identifier = idOrSlug || q;
            if (!identifier) {
                return res.status(400).json({
                    creator: 'Nimzz',
                    status: false,
                    message: "Parameter 'id' atau 'slug' VTuber wajib disertakan."
                });
            }
            const data = await getVtuberDetail(identifier);
            return res.json(data);
        }

        // 5. Daftar Direktori VTuber
        if (action === 'vtubers' || action === 'directory' || action === 'talent') {
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.limit || req.query.pageSize) || 20;
            const gender = req.query.gender ? String(req.query.gender) : undefined;
            const agencyType = req.query.agency_type || req.query.agencyType ? String(req.query.agency_type || req.query.agencyType) : undefined;

            const data = await getVtubers({ page, pageSize, gender, agencyType });
            return res.json(data);
        }

        // 6. Roster Debut VTuber
        if (action === 'debuts') {
            const now = new Date();
            const year = req.query.year ? Number(req.query.year) : now.getFullYear();
            const month = req.query.month ? Number(req.query.month) : (now.getMonth() + 1);

            const data = await getDebuts(year, month, {
                page: req.query.page,
                pageSize: req.query.limit || req.query.pageSize,
                gender: req.query.gender,
                agencyType: req.query.agency_type || req.query.agencyType
            });
            return res.json(data);
        }

        // 7. Daftar Agensi
        if (action === 'agencies' || action === 'agency') {
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.limit || req.query.pageSize) || 100;
            const data = await getAgencies({ page, pageSize });
            return res.json(data);
        }

        // 8. Default: Daftar Berita VTuber
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.limit || req.query.pageSize) || 10;
        const sort = String(req.query.sort || 'latest').toLowerCase();
        const category = req.query.category ? String(req.query.category) : undefined;
        const tag = req.query.tag ? String(req.query.tag) : undefined;

        const data = await getNews({
            page,
            pageSize,
            sort,
            category,
            tag,
            search: q || undefined
        });

        return res.json(data);
    } catch (error: any) {
        return res.status(500).json({
            creator: 'Nimzz',
            status: false,
            message: error.message || 'Terjadi kesalahan saat memproses data VTuberSpace'
        });
    }
}
