const axios = require('axios');

module.exports = function (app) {
    app.get("/download/spotify", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                message: "Parameter 'url' wajib diisi (link lagu Spotify)"
            });
        }

        try {
            const encodedUrl = encodeURIComponent(url);
            const apiUrl = `https://api.nekolabs.web.id/downloader/spotify/v1?url=${encodedUrl}`;
            
            const response = await axios.get(apiUrl);
            const apiResult = response.data;

            res.json({
                status: true,
                creator: "Nimzz",
                result: apiResult.result
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                message: "Terjadi kesalahan saat memproses permintaan.",
                error: error.message
            });
        }
    });
};
