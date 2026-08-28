const axios = require('axios');

module.exports = function (app) {
    app.get("/random/anime-quote", async (req, res) => {
        try {
            const apiUrl = "https://api.nekolabs.my.id/random/anime-quote";
            
            const { data } = await axios.get(apiUrl, {
                timeout: 30000,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
                }
            });

            if (!data) {
                return res.status(500).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Data anime quote tidak valid atau kosong.",
                    error: "Invalid data format"
                });
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: data.result || data,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                return res.status(408).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Request timeout - Terlalu lama mengambil data.",
                    error: "Timeout"
                });
            }
            
            if (error.response) {
                return res.status(error.response.status).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Gagal mengambil data anime quote dari API.",
                    error: error.response.data?.message || error.response.statusText
                });
            } else if (error.request) {
                return res.status(503).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak dapat terhubung ke API.",
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