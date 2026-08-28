const axios = require('axios');

module.exports = function (app) {
    app.get("/ai/gpt3", async (req, res) => {
        const { prompt, content } = req.query;

        if (!content) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'content' wajib diisi"
            });
        }

        try {
            const apiUrl = `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt || "You are a helpful assistant.")}&content=${encodeURIComponent(content)}`;
            
            const { data } = await axios.get(apiUrl);

            res.json({
                status: true,
                creator: "Nimzz",
                result: data.result || data
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mengambil respons dari GPT-3",
                error: error.response?.data?.message || error.message
            });
        }
    });
};