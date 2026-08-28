const fetch = require("node-fetch");
const cheerio = require("cheerio");

async function scrapeDetail(url) {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        return {
            title: $("article.oh.a2 header h1.mb-6").text().trim(),
            synopsis: $("#synopsis > p").text().trim(),
            type: $("aside.s1 div.y6x11p:nth-child(2) span.dt a").text().trim(),
            status: $("aside.s1 div.y6x11p:nth-child(1) span.dt a").text().trim(),
            image: $("div.grid div.a1 figure img").attr("src"),
            chapterList: $("#download .index-list a")
                .map((i, el) => ({
                    title: $(el).text().trim(),
                    link: $(el).attr("href"),
                }))
                .get(),
        };
    } catch (error) {
        console.error("Scrape error:", error.message);
        return { error: error.message };
    }
}

module.exports = function (app) {
    app.get("/download/mikoroku", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'url' wajib diisi."
            });
        }

        if (typeof url !== "string" || url.trim().length === 0) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'url' harus berupa string yang tidak kosong."
            });
        }

        try {
            const result = await scrapeDetail(url.trim());
            
            if (result.error) {
                return res.status(500).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Gagal mengambil detail.",
                    error: result.error
                });
            }

            if (!result.title) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Detail tidak ditemukan."
                });
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: result
            });
        } catch (error) {
            console.error("Error Mikoroku Download:", error.message);
            
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal memproses download dari Mikoroku.",
                error: error.message
            });
        }
    });
};