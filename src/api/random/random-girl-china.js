const axios = require('axios');

module.exports = function (app) {
    app.get("/random/girl/china", async (req, res) => {
        try {
            const apiUrl = "https://api.nekolabs.my.id/random/girl/china";
            
            const imageResponse = await axios.get(apiUrl, {
                responseType: 'stream',
                timeout: 30000,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
                }
            });

            res.setHeader('Content-Type', imageResponse.headers['content-type'] || 'image/jpeg');
            res.setHeader('Cache-Control', imageResponse.headers['cache-control'] || 'public, max-age=3600');
            
            if (imageResponse.headers['content-length']) {
                res.setHeader('Content-Length', imageResponse.headers['content-length']);
            }

            imageResponse.data.pipe(res);

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
                if (error.response.headers['content-type'] && error.response.headers['content-type'].includes('image')) {
                    res.setHeader('Content-Type', error.response.headers['content-type']);
                    return res.status(error.response.status).send(error.response.data);
                }
                
                return res.status(error.response.status).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Gagal mengambil data dari API.",
                    error: error.response.statusText
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