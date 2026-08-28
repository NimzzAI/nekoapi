const axios = require("axios");

module.exports = function (app) {
    async function fakecall(nama, durasi, avatar) {
        try {
            const url = `https://api.zenzxz.my.id/maker/fakecall?nama=${encodeURIComponent(nama)}&durasi=${encodeURIComponent(durasi)}&avatar=${encodeURIComponent(avatar)}`;
            const response = await axios.get(url, { 
                responseType: "arraybuffer" 
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    app.get('/maker/fakecall', async (req, res) => {
        const nama = req.query.name || req.query.nama;
        const durasi = req.query.durasi || req.query.durast;
        const avatar = req.query.avatar;

        if (!nama || !durasi || !avatar) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'name', 'durasi', dan 'avatar' wajib diisi"
            });
        }

        try {
            const imageBuffer = await fakecall(nama, durasi, avatar);
            
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Length', imageBuffer.length);
            res.setHeader('Content-Disposition', 'inline; filename="fakecall.png"');
            
            res.send(imageBuffer);
            
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "Nimzz", 
                message: "Gagal membuat fake call",
                error: error.message
            });
        }
    });
};