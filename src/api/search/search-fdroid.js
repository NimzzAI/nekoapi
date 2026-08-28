const axios = require('axios');
const cheerio = require('cheerio');

const fdroid = {
    search: async (query) => {
        try {
            const response = await axios.get(`https://search.f-droid.org/?q=${encodeURIComponent(query)}&lang=id`, {
                timeout: 15000,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
                }
            });
            
            const html = response.data;
            const $ = cheerio.load(html);
            const apps = [];

            $('a.package-header').each((index, element) => {
                const appName = $(element).find('h4.package-name').text().trim();
                const appDesc = $(element).find('span.package-summary').text().trim();
                const appLink = $(element).attr('href');
                const appIcon = $(element).find('img.package-icon').attr('src');
                const appLicense = $(element).find('span.package-license').text().trim();

                if (appName && appLink) {
                    apps.push({
                        name: appName,
                        description: appDesc || "No description",
                        link: appLink.startsWith('http') ? appLink : `https://f-droid.org${appLink}`,
                        icon: appIcon || "",
                        license: appLicense || "Unknown"
                    });
                }
            });

            return apps;
        } catch (error) {
            console.error('Error fetching F-Droid apps:', error.message);
            throw error;
        }
    }
};

module.exports = function (app) {
    app.get('/search/fdroid', async (req, res) => {
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
            const results = await fdroid.search(q.trim());
            
            if (!results || results.length === 0) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak ada aplikasi yang ditemukan di F-Droid."
                });
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: results
            });
        } catch (error) {
            console.error("Error F-Droid Search:", error.message);
            
            if (error.code === 'ECONNABORTED') {
                return res.status(408).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Request timeout - F-Droid terlalu lama merespons.",
                    error: "Timeout"
                });
            }
            
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mencari aplikasi di F-Droid.",
                error: error.message
            });
        }
    });
};