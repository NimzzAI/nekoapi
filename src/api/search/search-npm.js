const fetch = require('node-fetch');

async function fetchJson(url) {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        throw new Error(`Failed to fetch: ${error.message}`);
    }
}

module.exports = function (app) {
    app.get('/search/npm', async (req, res) => {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'q' wajib diisi."
            });
        }

        if (typeof q !== "string" || q.trim().length === 0) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'q' harus berupa string yang tidak kosong."
            });
        }

        try {
            const data = await fetchJson(`https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(q.trim())}`);
            
            if (!data || !data.objects) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak ada package yang ditemukan."
                });
            }

            const hasil = data.objects.slice(0, 20).map(i => ({
                title: i.package.name + "@^" + i.package.version,
                description: i.package.description || "No description",
                download: i.downloads || 0,
                author: i.package.publisher?.username || "Unknown",
                update: i.package.date || "Unknown",
                links: i.package.links || {}
            }));

            res.json({
                status: true,
                creator: "Nimzz",
                result: hasil
            });
        } catch (error) {
            console.error("Error NPM Search:", error.message);
            
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mencari package di NPM.",
                error: error.message
            });
        }
    });
};