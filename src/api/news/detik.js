const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {
    async function DetikNews() {
        try {
            const res = await axios.get(
                "https://www.detik.com/terpopuler?tag_from=framebar&_ga=2.250751302.1905924499.1623147163-1763618333.1613153099",
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Linux; Android 9; Redmi 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36"
                    }
                }
            );

            const $ = cheerio.load(res.data);
            const hasil = [];

            $("article").each((i, el) => {
                const berita = $(el)
                    .find("div > div > h3.media__title > a.media__link")
                    .text()
                    .trim();

                const berita_url = $(el).find("a.media__link").attr("href") || null;

                let berita_thumb = $(el).find("img").attr("src") || null;
                if (berita_thumb) berita_thumb = berita_thumb.replace("?w=220&q=90", "");

                const berita_diupload = $(el)
                    .find("div.media__date > span")
                    .attr("title") || null;

                if (berita) {
                    hasil.push({
                        berita,
                        berita_url,
                        berita_thumb,
                        berita_diupload
                    });
                }
            });

            return hasil;
        } catch (error) {
            return {
                code: 503,
                status: false,
                error: error.message || error
            };
        }
    }

    // 📌 ROUTE EXPRESS
    app.get("/news/detik", async (req, res) => {
        try {
            const data = await DetikNews();
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};