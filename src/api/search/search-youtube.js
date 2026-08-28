const yts = require('yt-search');

module.exports = function(app) {
    app.get('/search/youtube', async (req, res) => {
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
            const ytResults = await yts.search(q.trim());
            
            if (!ytResults || !ytResults.videos) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak ada hasil yang ditemukan."
                });
            }

            const ytTracks = ytResults.videos.map(video => ({
                title: video.title,
                channel: video.author?.name || "Unknown",
                duration: video.duration?.timestamp || "00:00",
                imageUrl: video.thumbnail,
                link: video.url,
                views: video.views || "Unknown",
                uploaded: video.ago || "Unknown"
            }));

            res.json({
                status: true,
                creator: "Nimzz",
                result: ytTracks
            });
        } catch (error) {
            console.error("Error YouTube Search:", error.message);
            
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mencari video YouTube.",
                error: error.message
            });
        }
    });
};