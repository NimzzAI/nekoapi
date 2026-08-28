const axios = require('axios');

module.exports = function (app) {
    app.get("/ai/chatbox", async (req, res) => {
        const { name, prompt, text } = req.query;

        if (!name || !prompt || !text) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'name', 'prompt', dan 'text' wajib diisi."
            });
        }

        if (typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'name' harus berupa string yang tidak kosong."
            });
        }

        if (typeof prompt !== "string" || prompt.trim().length === 0) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'prompt' harus berupa string yang tidak kosong."
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
            console.log("Mengirim request ke Chatbox API...");
            
            const apiUrl = `https://api.nekolabs.my.id/ai/chatbot?name=${encodeURIComponent(name.trim())}&instruction=${encodeURIComponent(prompt.trim())}&question=${encodeURIComponent(text.trim())}`;
            
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
                    message: "Gagal mengambil respons dari Chatbox API.",
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
            console.error("Error Chatbox API:", error.message);
            
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
                    message: "Gagal mengambil respons dari Chatbox API.",
                    error: error.response.data?.message || error.response.statusText
                });
            } else if (error.request) {
                return res.status(503).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak dapat terhubung ke Chatbox API.",
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