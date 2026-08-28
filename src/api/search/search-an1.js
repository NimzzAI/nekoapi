const axios = require('axios');

async function searchAn1(query) {
    try {
        const apiUrl = `https://api.siputzx.my.id/api/apk/an1?search=${encodeURIComponent(query)}`;
        
        const { data } = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
            }
        });

        if (!data) {
            throw new Error("Response kosong dari AN1 API");
        }

        const result = data.result || data.data || data;
        return result;
    } catch (error) {
        console.error("Error AN1 Search:", error.message);
        throw error;
    }
}

module.exports = function (app) {
    app.get('/search/an1', async (req, res) => {
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
            const results = await searchAn1(q.trim());
            
            if (!results || (Array.isArray(results) && results.length === 0)) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak ada aplikasi yang ditemukan di AN1."
                });
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: results
            });
        } catch (error) {
            console.error("Error AN1 Search API:", error.message);
            
            if (error.code === 'ECONNABORTED') {
                return res.status(408).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Request timeout - AN1 API terlalu lama merespons.",
                    error: "Timeout"
                });
            }
            
            if (error.response) {
                return res.status(error.response.status).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Gagal mengambil data dari AN1 API.",
                    error: error.response.data?.message || error.response.statusText
                });
            } else if (error.request) {
                return res.status(503).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak dapat terhubung ke AN1 API.",
                    error: "Network Error"
                });
            } else {
                return res.status(500).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Terjadi kesalahan internal.",
                    error: error.message
                });
            }
        }
    });
};