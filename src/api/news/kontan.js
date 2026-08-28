const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

    async function Kontan() {
        try {
            const res = await axios.get("https://www.kontan.co.id/", {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Linux; Android 9; Redmi 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36",
                },
            });

            const $ = cheerio.load(res.data);
            const hasil = [];

            $("div.news-list > ul > li").each((i, el) => {
                const berita = $(el).find("div.box-news.fleft > a > h1").text().trim();
                const berita_url = $(el).find("a").attr("href");
                const berita_thumb = $(el).find("div.image-thumb img").attr("data-src");
                const berita_jenis = $(el).find("a.link-orange").text().trim();
                const berita_diupload = $(el)
                    .find("div.box-news.fleft")
                    .text()
                    .split(/[|]/g)
                    .slice(1)
                    .join("")
                    .trim();

                if (berita) {
                    hasil.push({
                        berita,
                        berita_url,
                        berita_thumb: berita_thumb || null,
                        berita_jenis: berita_jenis || null,
                        berita_diupload: berita_diupload || null,
                    });
                }
            });

            return hasil;
        } catch (error) {
            return {
                code: 503,
                status: false,
                error: error.message || error,
            };
        }
    }

    // 📌 ROUTE
    app.get("/news/kontan", async (req, res) => {
        try {
            const data = await Kontan();
            res.json(data);
        } catch (e) {
            res.status(500).json({
                status: false,
                error: e.message,
            });
        }
    });

};