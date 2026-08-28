const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = function (app) {
    app.get("/search/lyrics", async (req, res) => {
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
            const response = await fetch(`https://r.jina.ai/https://www.google.com/search?q=lirik+lagu+${encodeURIComponent(q.trim())}&hl=en`, {
                headers: {
                    "x-return-format": "html",
                    "x-engine": "cf-browser-rendering"
                },
                timeout: 30000
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            const $ = cheerio.load(html);
            const lirik = [];
            const output = [];
            const result = {};

            $("div.PZPZlf").each((i, e) => {
                const penemu = $(e).find('div[jsname="U8S5sf"]').text().trim();
                if (!penemu) output.push($(e).text().trim());
            });

            $("div[jsname='U8S5sf']").each((i, el) => {
                let out = "";
                $(el).find("span[jsname='YS01Ge']").each((_, span) => {
                    out += $(span).text() + "\n";
                });
                lirik.push(out.trim());
            });

            result.lyrics = lirik.join("\n\n");
            result.title = output.shift();
            result.subtitle = output.shift();
            result.platform = output.filter(_ => !_.includes(":"));

            output.forEach(_ => {
                if (_.includes(":")) {
                    const [name, value] = _.split(":");
                    result[name.toLowerCase()] = value.trim();
                }
            });

            if (!result.lyrics || result.lyrics.trim().length === 0) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Lirik tidak ditemukan!"
                });
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: result
            });

        } catch (error) {
            console.error("Error Lyrics Search:", error.message);
            
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mengambil lirik.",
                error: error.message
            });
        }
    });
};
