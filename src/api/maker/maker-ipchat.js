const axios = require("axios");

async function fetchIqcImage(messageText) {
    const url = `https://brat.siputzx.my.id/iphone-quoted?messageText=${encodeURIComponent(messageText)}`;

    const resp = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; IQC-Proxy/1.0)"
        }
    });

    return {
        buffer: Buffer.from(resp.data),
        contentType: resp.headers && resp.headers["content-type"] ? resp.headers["content-type"] : "image/png"
    };
}

module.exports = function (app) {
    app.get("/maker/iqc", async (req, res) => {
        const messageText = req.query.text || req.query.messageText;

        if (!messageText) {
            return res.status(400).json({
                status: false,
                message: "Parameter 'text' wajib diisi"
            });
        }

        try {
            const { buffer, contentType } = await fetchIqcImage(messageText);
            res.writeHead(200, {
                "Content-Type": contentType,
                "Content-Length": buffer.length,
                "Cache-Control": "public, max-age=3600"
            });
            res.end(buffer);
        } catch (err) {
            const message = err && err.response
                ? `Upstream error: ${err.response.status} ${err.response.statusText}`
                : (err && err.message) ? err.message : "Unknown error";
            res.status(500).json({
                status: false,
                message: "Gagal mengambil IQC image",
                error: message
            });
        }
    });
};
