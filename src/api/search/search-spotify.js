const axios = require("axios");

const client_id = "3ac7d9b75ec644cb9ae627ee5db358e6";
const client_secret = "462c7edd060548f3b181dbf8d8c673dc";

let access_token = "";
let token_expiry = 0;

async function getSpotifyToken() {
    if (access_token && Date.now() < token_expiry) {
        return access_token;
    }

    try {
        const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
        const res = await axios.post(
            "https://accounts.spotify.com/api/token",
            "grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${basic}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout: 10000
            }
        );

        access_token = res.data.access_token;
        token_expiry = Date.now() + res.data.expires_in * 1000;
        return access_token;
    } catch (error) {
        console.error("Error getting Spotify token:", error.message);
        throw new Error("Gagal mendapatkan token akses Spotify");
    }
}

module.exports = function (app) {
    app.get("/search/spotify", async (req, res) => {
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
            const token = await getSpotifyToken();

            const searchRes = await axios.get(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(q.trim())}&type=track&limit=15`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 15000
                }
            );

            if (!searchRes.data || !searchRes.data.tracks || !searchRes.data.tracks.items) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak ada hasil yang ditemukan."
                });
            }

            const tracks = searchRes.data.tracks.items.map(item => ({
                title: item.name || "Unknown",
                artist: item.artists?.map(a => a.name).join(", ") || "Unknown",
                album: item.album?.name || "Unknown",
                link: item.external_urls?.spotify || "#",
                image: item.album?.images?.[0]?.url || "",
                duration_ms: item.duration_ms || 0,
                popularity: item.popularity || 0,
                release_date: item.album?.release_date || "Unknown",
                preview_url: item.preview_url || ""
            }));

            res.json({
                status: true,
                creator: "Nimzz",
                result: tracks
            });
        } catch (error) {
            console.error("Error Spotify Search:", error.message);
            
            if (error.response?.status === 401) {
                return res.status(401).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Token akses Spotify tidak valid.",
                    error: "Authentication Error"
                });
            }
            
            if (error.code === 'ECONNABORTED') {
                return res.status(408).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Request timeout - Spotify API terlalu lama merespons.",
                    error: "Timeout"
                });
            }
            
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mencari lagu di Spotify.",
                error: error.response?.data?.error?.message || error.message
            });
        }
    });
};
