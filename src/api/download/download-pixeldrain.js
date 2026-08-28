const fetch = require("node-fetch");

async function PixelDrain(url) {
    try {
        const urlMatch = url.match(/(?:pixeldrain\.com|pixeldrain\.net)\/(?:u\/|api\/file\/)([a-zA-Z0-9]+)/i);
        if (!urlMatch || !urlMatch[1]) throw new Error("URL tidak valid");

        const fileId = urlMatch[1];
        const baseUrl = url.includes("pixeldrain.net")
            ? "https://pixeldrain.net"
            : "https://pixeldrain.com";

        const infoUrl = `${baseUrl}/api/file/${fileId}/info`;
        const response = await fetch(infoUrl);
        const info = await response.json();

        if (!info || info.success === false) throw new Error("File tidak ditemukan");

        return {
            id: info.id || fileId,
            name: info.name || `pixeldrain_${fileId}`,
            size: formatSize(info.size),
            mime_type: info.mime_type || "application/octet-stream",
            views: info.views || 0,
            downloads: info.downloads || 0,
            date_upload: info.date_upload || "Tidak diketahui",
            date_last_view: info.date_last_view || "Tidak diketahui",
            thumbnail_href: info.thumbnail_href ? `${baseUrl}${info.thumbnail_href}` : null,
            viewUrl: `${baseUrl}/u/${fileId}`,
            downloadUrl: `${baseUrl}/api/file/${fileId}?download`
        };
    } catch (error) {
        console.error("PixelDrain Error:", error.message);
        return null;
    }
}

function formatSize(bytes) {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

module.exports = function (app) {
    app.get("/download/pixeldrain", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'url' wajib diisi."
            });
        }

        try {
            const result = await PixelDrain(url);

            if (!result) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "File tidak ditemukan atau tidak dapat diakses."
                });
            }

            res.status(200).json({
                status: true,
                creator: "Nimzz",
                result
            });
        } catch (error) {
            console.error("Pixeldrain Endpoint Error:", error);
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal memproses download Pixeldrain.",
                error: error.message
            });
        }
    });
};