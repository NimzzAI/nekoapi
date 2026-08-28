const axios = require("axios");
const FormData = require("form-data");

const ttSearch = async (query) => {
    try {
        let formData = new FormData();
        formData.append("keywords", query);
        formData.append("count", 15);
        formData.append("cursor", 0);
        formData.append("web", 1);
        formData.append("hd", 1);

        let headers = {
            headers: {
                ...formData.getHeaders()
            }
        };

        let { data } = await axios.post("https://tikwm.com/api/feed/search", formData, headers);

        if (!data || !data.data || !data.data.videos) {
            throw new Error("Response tidak valid dari API TikTok");
        }

        const baseURL = "https://tikwm.com";

        const videos = data.data.videos.map(video => {
            return {
                id: video.id,
                title: video.title,
                description: video.description,
                duration: video.duration,
                play: baseURL + video.play,
                wmplay: baseURL + video.wmplay,
                music: baseURL + video.music,
                cover: baseURL + video.cover,
                avatar: baseURL + video.avatar,
                author: video.author,
                statistics: video.statistics
            };
        });

        return videos;
    } catch (error) {
        console.error("Error TikTok Search:", error.message);
        throw error;
    }
};

module.exports = function(app) {
    app.get('/search/tiktok', async (req, res) => {
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
            const results = await ttSearch(q.trim());
            
            res.json({
                status: true,
                creator: "Nimzz",
                result: results
            });
        } catch (error) {
            console.error("Error TikTok Search API:", error.message);
            
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mencari video TikTok.",
                error: error.message
            });
        }
    });
};