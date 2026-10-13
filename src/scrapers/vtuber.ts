/**
 * ========================================================
 * Name: VTuberSpace Scraper & API Engine
 * Source: https://vtuberspace.id
 * ========================================================
 */
import axios from 'axios';

const BASE_URL = 'https://vtuberspace.id';
const API_BASE_URL = `${BASE_URL}/api/v1`;

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': `${BASE_URL}/`
};

export function toAbsoluteUrl(path: string | null | undefined): string | null {
    if (!path || typeof path !== 'string') return null;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('//')) return `https:${path}`;
    if (path.startsWith('/')) return `${BASE_URL}${path}`;
    return `${BASE_URL}/${path}`;
}

export function cleanVtuber(item: any): any {
    if (!item || typeof item !== 'object') return null;
    return {
        id: item.id,
        name: item.name,
        original_name: item.original_name || null,
        slug: item.slug,
        bio: item.bio || null,
        avatar: toAbsoluteUrl(item.avatar),
        banner: toAbsoluteUrl(item.banner),
        oshi_color: item.oshi_color || null,
        oshi_mark: item.oshi_mark || null,
        tgl_debut: item.tgl_debut || null,
        date_debut: item.date_debut || null,
        gender: item.female ? 'Female' : item.male ? 'Male' : null,
        artist: item.artist || null,
        rigging: item.rigging || null,
        link_perkenalan: item.link_perkenalan || null,
        link_youtube: item.link_youtube || null,
        social_links: item.social_links || {},
        email: item.email || null,
        agency: item.agency ? {
            id: item.agency.id,
            name: item.agency.name,
            slug: item.agency.slug,
            description: item.agency.description || null,
            logo: toAbsoluteUrl(item.agency.logo),
            banner: toAbsoluteUrl(item.agency.banner),
            is_indie: Boolean(item.agency.is_indie)
        } : null,
        images: Array.isArray(item.images)
            ? item.images.map((img: any) => ({
                id: img.id,
                title: img.title || null,
                url: toAbsoluteUrl(img.url)
            }))
            : []
    };
}

export function cleanNews(item: any): any {
    if (!item || typeof item !== 'object') return null;
    return {
        id: item.id,
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt || null,
        content: item.content || null,
        thumbnail: toAbsoluteUrl(item.thumbnail),
        status: item.status || null,
        published_at: item.published_at || null,
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
        is_featured: Boolean(item.is_featured),
        view_count: item.view_count || 0,
        like_count: item.like_count || 0,
        reading_time: item.reading_time || null,
        author: item.author ? {
            id: item.author.id,
            name: item.author.display_name,
            slug: item.author.slug,
            avatar: toAbsoluteUrl(item.author.avatar)
        } : null,
        categories: Array.isArray(item.categories)
            ? item.categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description || null }))
            : [],
        tags: Array.isArray(item.tags)
            ? item.tags.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug }))
            : [],
        related_vtubers: Array.isArray(item.related_vtubers)
            ? item.related_vtubers.map(cleanVtuber)
            : [],
        images: Array.isArray(item.images)
            ? item.images.map((img: any) => ({ id: img.id, name: img.name, url: toAbsoluteUrl(img.url) }))
            : []
    };
}

export async function getHome() {
    const [vtubersRes, postsRes, catsRes, tagsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/vtubers?page=1&page_size=1`, { headers: DEFAULT_HEADERS, timeout: 12000 }),
        axios.get(`${API_BASE_URL}/posts?page=1&page_size=100`, { headers: DEFAULT_HEADERS, timeout: 12000 }),
        axios.get(`${API_BASE_URL}/categories`, { headers: DEFAULT_HEADERS, timeout: 12000 }),
        axios.get(`${API_BASE_URL}/tags`, { headers: DEFAULT_HEADERS, timeout: 12000 })
    ]);

    const rawPosts = postsRes.data?.data || [];
    const cleaned = rawPosts.map(cleanNews);

    const featured = cleaned.filter((p: any) => p.is_featured).slice(0, 5);
    const popular = [...cleaned].sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);
    const latest = [...cleaned].slice(0, 10);

    const rawCats = catsRes.data?.data || [];
    const categoriesWithCount = rawCats.map((cat: any) => {
        const count = cleaned.filter((p: any) => p.categories.some((c: any) => c.slug === cat.slug)).length;
        return {
            ...cat,
            post_count: count
        };
    });

    return {
        creator: 'Nimzz',
        status: true,
        stats: vtubersRes.data?.stats || { total: 0, male: 0, female: 0, indie: 0, affiliated: 0 },
        featured_news: featured,
        popular_news: popular,
        latest_news: latest,
        categories: categoriesWithCount,
        tags: tagsRes.data?.data || []
    };
}

export async function getNews(options: any = {}) {
    const page = Number(options.page) || 1;
    const pageSize = Number(options.pageSize || options.limit) || 10;
    const sort = options.sort || 'latest';

    const res = await axios.get(`${API_BASE_URL}/posts?page=1&page_size=100`, {
        headers: DEFAULT_HEADERS,
        timeout: 12000
    });

    let list = (res.data?.data || []).map(cleanNews);

    if (options.category && options.category !== 'all' && options.category !== 'semua') {
        const targetCat = options.category.toLowerCase().trim();
        list = list.filter((p: any) => p.categories.some((c: any) => c.slug.toLowerCase() === targetCat || c.name.toLowerCase() === targetCat));
    }

    if (options.tag) {
        const targetTag = options.tag.toLowerCase().trim();
        list = list.filter((p: any) => p.tags.some((t: any) => t.slug.toLowerCase() === targetTag || t.name.toLowerCase() === targetTag));
    }

    if (options.featuredOnly) {
        list = list.filter((p: any) => p.is_featured);
    }

    if (options.search || options.q) {
        const q = String(options.search || options.q).toLowerCase().trim();
        list = list.filter((p: any) =>
            p.title.toLowerCase().includes(q) ||
            (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
            p.tags.some((t: any) => t.name.toLowerCase().includes(q))
        );
    }

    if (sort === 'popular') {
        list.sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0));
    } else if (sort === 'oldest') {
        list.sort((a: any, b: any) => new Date(a.published_at || 0).getTime() - new Date(b.published_at || 0).getTime());
    } else {
        list.sort((a: any, b: any) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());
    }

    const total = list.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = list.slice(startIndex, startIndex + pageSize);

    return {
        creator: 'Nimzz',
        status: true,
        filter: {
            category: options.category || 'all',
            tag: options.tag || null,
            sort,
            search: options.search || options.q || null
        },
        meta: {
            page,
            page_size: pageSize,
            total,
            total_page: totalPages
        },
        data: paginatedData
    };
}

export async function getNewsDetail(idOrSlug: string | number) {
    if (!idOrSlug) {
        throw new Error('News ID or slug is required');
    }

    if (/^\d+$/.test(String(idOrSlug).trim())) {
        const res = await axios.get(`${API_BASE_URL}/posts/${idOrSlug}`, {
            headers: DEFAULT_HEADERS,
            timeout: 12000
        });
        return {
            creator: 'Nimzz',
            status: true,
            data: cleanNews(res.data?.data)
        };
    }

    const targetSlug = String(idOrSlug).trim().toLowerCase();
    const listRes = await axios.get(`${API_BASE_URL}/posts?page=1&page_size=100`, {
        headers: DEFAULT_HEADERS,
        timeout: 12000
    });

    const found = (listRes.data?.data || []).find((p: any) => p.slug === targetSlug);
    if (found) {
        try {
            const detailRes = await axios.get(`${API_BASE_URL}/posts/${found.id}`, {
                headers: DEFAULT_HEADERS,
                timeout: 12000
            });
            return {
                creator: 'Nimzz',
                status: true,
                data: cleanNews(detailRes.data?.data)
            };
        } catch {
            return {
                creator: 'Nimzz',
                status: true,
                data: cleanNews(found)
            };
        }
    }

    throw new Error(`Berita VTuber dengan slug atau ID '${targetSlug}' tidak ditemukan`);
}

export async function getVtubers(options: any = {}) {
    const page = Number(options.page) || 1;
    const pageSize = Number(options.pageSize || options.limit) || 20;

    const params: Record<string, any> = {
        page: String(page),
        page_size: String(pageSize)
    };

    if (options.gender) {
        params.gender = options.gender;
    }

    if (options.agencyType || options.agency_type) {
        params.agency_type = options.agencyType || options.agency_type;
    }

    const res = await axios.get(`${API_BASE_URL}/vtubers`, {
        params,
        headers: DEFAULT_HEADERS,
        timeout: 12000
    });

    const rawList = Array.isArray(res.data?.data) ? res.data.data : [];

    return {
        creator: 'Nimzz',
        status: true,
        data: rawList.map(cleanVtuber),
        meta: res.data?.meta || { page, page_size: pageSize, total: rawList.length, total_page: 1 },
        stats: res.data?.stats || null
    };
}

export async function searchVtuber(query: string, limit = 10) {
    if (!query || typeof query !== 'string') {
        throw new Error('Search query is required');
    }

    const normalizedQuery = query.trim().replace(/-/g, ' ');
    const res = await axios.get(`${API_BASE_URL}/vtubers/search`, {
        params: {
            q: normalizedQuery,
            limit: String(limit)
        },
        headers: DEFAULT_HEADERS,
        timeout: 12000
    });

    const rawList = Array.isArray(res.data?.data) ? res.data.data : [];

    return {
        creator: 'Nimzz',
        status: true,
        query,
        total: rawList.length,
        data: rawList.map(cleanVtuber)
    };
}

export async function getVtuberDetail(idOrSlug: string | number) {
    if (!idOrSlug) {
        throw new Error('VTuber ID or slug is required');
    }

    if (/^\d+$/.test(String(idOrSlug).trim())) {
        const res = await axios.get(`${API_BASE_URL}/vtubers/${idOrSlug}`, {
            headers: DEFAULT_HEADERS,
            timeout: 12000
        });
        return {
            creator: 'Nimzz',
            status: true,
            data: cleanVtuber(res.data?.data)
        };
    }

    const targetSlug = String(idOrSlug).trim().toLowerCase();
    const searchRes = await searchVtuber(targetSlug, 10);
    const found = searchRes.data.find((v: any) => v.slug === targetSlug || v.name.toLowerCase() === targetSlug.replace(/-/g, ' '));

    if (found) {
        try {
            const detailRes = await axios.get(`${API_BASE_URL}/vtubers/${found.id}`, {
                headers: DEFAULT_HEADERS,
                timeout: 12000
            });
            return {
                creator: 'Nimzz',
                status: true,
                data: cleanVtuber(detailRes.data?.data)
            };
        } catch {
            return {
                creator: 'Nimzz',
                status: true,
                data: found
            };
        }
    }

    throw new Error(`Data VTuber dengan ID atau slug '${targetSlug}' tidak ditemukan`);
}

export async function getDebuts(year: string | number, month: string | number, options: any = {}) {
    if (!year || !month) {
        throw new Error('Year and month are required (e.g., year=2024, month=1)');
    }

    const y = String(year);
    const m = String(month).padStart(2, '0');
    const dateStr = `${y}-${m}-01`;

    const page = Number(options.page) || 1;
    const pageSize = Number(options.pageSize || options.limit) || 100;

    const params: Record<string, any> = {
        date_debut: dateStr,
        page: String(page),
        page_size: String(pageSize)
    };

    if (options.gender) params.gender = options.gender;
    if (options.agencyType || options.agency_type) params.agency_type = options.agencyType || options.agency_type;

    const res = await axios.get(`${API_BASE_URL}/vtubers`, {
        params,
        headers: DEFAULT_HEADERS,
        timeout: 12000
    });

    const rawList = Array.isArray(res.data?.data) ? res.data.data : [];
    const cleanedList = rawList.map(cleanVtuber);

    cleanedList.sort((a: any, b: any) => {
        const timeA = a.date_debut ? new Date(a.date_debut).getTime() : 0;
        const timeB = b.date_debut ? new Date(b.date_debut).getTime() : 0;
        return timeA - timeB;
    });

    return {
        creator: 'Nimzz',
        status: true,
        year: Number(year),
        month: Number(month),
        date_query: dateStr,
        total: res.data?.meta?.total || cleanedList.length,
        stats: res.data?.stats || null,
        meta: res.data?.meta || null,
        data: cleanedList
    };
}

export async function getAgencies(options: any = {}) {
    const page = Number(options.page) || 1;
    const pageSize = Number(options.pageSize || options.limit) || 100;

    const res = await axios.get(`${API_BASE_URL}/agencies`, {
        params: {
            page: String(page),
            page_size: String(pageSize)
        },
        headers: DEFAULT_HEADERS,
        timeout: 12000
    });

    const rawList = Array.isArray(res.data?.data) ? res.data.data : [];
    const cleaned = rawList.map((a: any) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        description: a.description || null,
        logo: toAbsoluteUrl(a.logo),
        banner: toAbsoluteUrl(a.banner),
        is_indie: Boolean(a.is_indie)
    }));

    return {
        creator: 'Nimzz',
        status: true,
        data: cleaned,
        meta: res.data?.meta || { page, page_size: pageSize, total: cleaned.length, total_page: 1 }
    };
}
