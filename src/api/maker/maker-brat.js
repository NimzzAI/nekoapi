const axios = require("axios");

function createImageResponse(res, buffer, contentType = "image/png") {
    res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": buffer.length,
        "Cache-Control": "public, max-age=3600"
    });
    res.end(buffer);
}

async function generateBrat(text, isAnimated = false) {
    try {
        const cleanText = text.trim();
        if (!cleanText) throw new Error("Parameter 'text' wajib diisi");
        if (cleanText.length > 800) throw new Error("Text maksimal 800 karakter");
        const encodedText = encodeURIComponent(cleanText);
        const apiUrl = isAnimated
            ? `https://brat.siputzx.my.id/gif?text=${encodedText}`
            : `https://brat.siputzx.my.id/image?text=${encodedText}`;
        const response = await axios.get(apiUrl, {
            responseType: "arraybuffer",
            timeout: 30000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });
        return Buffer.from(response.data);
    } catch {
        throw new Error("Gagal menghubungi API eksternal");
    }
}

module.exports = function (app) {
    app.get("/maker/brat", async (req, res) => {
        const { text } = req.query;
        if (!text) {
            return res.status(400).json({
                status: false,
                message: "Parameter 'text' wajib diisi"
            });
        }
        try {
            const buffer = await generateBrat(text, false);
            createImageResponse(res, buffer, "image/png");
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message || "Terjadi kesalahan internal"
            });
        }
    });

    app.get("/maker/bratvid", async (req, res) => {
        const { text } = req.query;
        if (!text) {
            return res.status(400).json({
                status: false,
                message: "Parameter 'text' wajib diisi"
            });
        }
        try {
            const buffer = await generateBrat(text, true);
            createImageResponse(res, buffer, "image/gif");
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message || "Terjadi kesalahan internal"
            });
        }
    });
};