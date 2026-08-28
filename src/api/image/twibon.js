

const Jimp = require("jimp");
const axios = require("axios");

const FRAME_URL = "https://files.clugx.my.id/ehmVW.png";

module.exports = function(app) {
    // Fungsi utama Twibbon
    async function makeTwibbon(userPhotoPath) {
        try {
            const user = await Jimp.read(userPhotoPath);
            user.resize(1080, 1080);

            const frameResp = await axios.get(FRAME_URL, { responseType: "arraybuffer" });
            const frame = await Jimp.read(frameResp.data);
            frame.resize(1080, 1080);

            user.composite(frame, 0, 0);

            // Output buffer, bisa langsung dikirim ke client
            const buffer = await user.getBufferAsync(Jimp.MIME_PNG);
            return buffer;
        } catch (error) {
            throw error;
        }
    }

    // Endpoint Express
    app.get("/image/mpls", async (req, res) => {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).json({ status: false, message: "Parameter 'url' dibutuhkan" });

        try {
            const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
            const buffer = await makeTwibbon(Buffer.from(response.data));
            
            res.writeHead(200, {
                "Content-Type": "image/png",
                "Content-Length": buffer.length,
            });
            res.end(buffer);
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    });
};