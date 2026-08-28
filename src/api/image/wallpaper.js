const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    async function wallpaperFlare(query, limit = 5) {
        try {
            const response = await axios.get(`https://www.wallpaperflare.com/search?wallpaper=${encodeURIComponent(query)}`);
            const html = response.data;
            const $ = cheerio.load(html);
            const images = [];

            $('li[itemprop="associatedMedia"]').each((i, el) => {
                const imgUrl = $(el).find('img.lazy').attr('data-src');
                if (imgUrl) images.push(imgUrl);
            });

            if (images.length === 0) throw new Error('No wallpapers found');

            // Ambil random sesuai limit
            const shuffled = images.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, limit);
        } catch (error) {
            throw error;
        }
    }

    app.get('/image/wallpaper', async (req, res) => {
        const query = req.query.q || 'anime';       // default search
        const limit = parseInt(req.query.limit) || 5; // default 5 images
        try {
            const images = await wallpaperFlare(query, limit);
            res.status(200).json({
                status: true,
                images
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    });
};