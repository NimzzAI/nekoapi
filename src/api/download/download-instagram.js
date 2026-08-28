const axios = require('axios');

async function igdl(url) {
    try {
        const encodedUrl = encodeURIComponent(url);
        const apiUrl = `https://api.nekolabs.my.id/downloader/instagram?url=${encodedUrl}`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://api.nekolabs.my.id/',
                'Origin': 'https://api.nekolabs.my.id'
            }
        });

        const result = response.data;

        if (!result.success) {
            throw new Error('Failed to download from Instagram API');
        }

        const metadata = result.result.metadata || {};
        const downloadUrls = result.result.downloadUrl || [];

        return {
            title: metadata.caption || 'Instagram Media',
            thumbnail: metadata.thumbnail || 'Thumbnail not found',
            downloadUrls: downloadUrls.length > 0 ? downloadUrls : ['Download URL not found'],
            username: metadata.username || 'Unknown',
            likes: metadata.like || 0,
            comments: metadata.comment || 0,
            is_video: metadata.isVideo || false,
            media_type: metadata.isVideo ? 'video' : 'image',
            timestamp: result.timestamp
        };
    } catch (error) {
        console.error('Error fetching Instagram data:', error.message);
        throw new Error(`Instagram download failed: ${error.message}`);
    }
}

module.exports = function (app) {
    app.get('/download/instagram', async (req, res) => {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'url' wajib diisi"
            });
        }

        if (!url.includes('instagram.com')) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "URL harus berupa link Instagram yang valid"
            });
        }

        try {
            const results = await igdl(url);
            res.status(200).json({
                status: true,
                creator: "Nimzz",
                result: results
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: error.message
            });
        }
    });
};