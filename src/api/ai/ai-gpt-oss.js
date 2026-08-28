const axios = require('axios');

module.exports = function (app) {
    app.get("/ai/gpt-oss", async (req, res) => {
        const { text } = req.query;

        // Validasi parameter
        if (!text) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'text' wajib diisi."
            });
        }

        if (typeof text !== "string" || text.trim().length === 0) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'text' harus berupa string yang tidak kosong."
            });
        }

        try {
            console.log("Mengirim request ke GPT OSS 120B API...");
            
            const apiUrl = `https://api.nekolabs.my.id/ai/cf/gpt-oss-120b?text=${encodeURIComponent(text.trim())}`;
            
            const { data } = await axios.get(apiUrl, {
                timeout: 30000,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
                }
            });

            // Validasi response
            if (!data) {
                return res.status(500).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Gagal mengambil respons dari GPT OSS 120B API.",
                    error: "Response kosong dari API"
                });
            }

            const result = data.result || data.response || data.content || data;

            res.json({
                status: true,
                creator: "Nimzz",
                result: result
            });

        } catch (error) {
            console.error("Error GPT OSS 120B API:", error.message);
            
            if (error.code === 'ECONNABORTED') {
                return res.status(408).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Request timeout - API terlalu lama merespons.",
                    error: "Timeout"
                });
            }
            
            if (error.response) {
                return res.status(error.response.status).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Gagal mengambil respons dari GPT OSS 120B API.",
                    error: error.response.data?.message || error.response.statusText
                });
            } else if (error.request) {
                return res.status(503).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak dapat terhubung ke GPT OSS 120B API.",
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