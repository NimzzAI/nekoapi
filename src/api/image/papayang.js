const axios = require("axios");

module.exports = function(app) {

    async function papAyang() {
        try {
            // Ambil daftar URL dari GitHub
            const { data } = await axios.get(
                "https://raw.githubusercontent.com/mamixx15/papayang/refs/heads/main/pap-ayang.json"
            );

            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error("No images found");
            }

            // Pilih random URL
            const randomUrl = data[Math.floor(Math.random() * data.length)];

            // Ambil gambar sebagai buffer
            const response = await axios.get(randomUrl, { responseType: "arraybuffer" });
            return Buffer.from(response.data);

        } catch (error) {
            throw error;
        }
    }

    app.get("/image/papayang", async (req, res) => {
        try {
            const buffer = await papAyang();
            res.writeHead(200, {
                "Content-Type": "image/png",
                "Content-Length": buffer.length
            });
            res.end(buffer);
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    });

};