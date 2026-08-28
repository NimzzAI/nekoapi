// random-neko-sfw.js
module.exports = function(app) {
    async function anim() {
        try {
            const data = await fetchJson(`https://api.waifu.pics/sfw/neko`)
            const response = await getBuffer(data.url)
            return response
        } catch (error) {
            throw error;
        }
    }
    app.get('/random/neko', async (req, res) => {
        try {
            const pedo = await anim();
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': pedo.length,
            });
            res.end(pedo);
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    });
};