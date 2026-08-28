const axios = require("axios");
const cheerio = require("cheerio");

class AnixverseScraper {
    constructor() {
        this.client = axios.create({
            baseURL: "https://anixverseone.com/",
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
            timeout: 10000,
        });
    }

    search = async function (query) {
        if (!query) throw new Error("Query is required");
        const { data } = await this.client.get(`?s=${encodeURIComponent(query)}`);
        const $ = cheerio.load(data);

        const results = [];
        $(".listupd .bs").each((i, el) => {
            const title = $(el).find(".tt h2").text().trim();
            const url = $(el).find("a").attr("href");
            const thumbnail = $(el).find("img").attr("src");
            const status = $(el).find(".epx").text().trim();
            if (title && url) results.push({ title, url, thumbnail, status });
        });
        return results;
    };

    latest = async function () {
        const { data } = await this.client.get("/");
        const $ = cheerio.load(data);

        const results = [];
        $(".listupd .bs").each((i, el) => {
            const title = $(el).find(".tt h2").text().trim();
            const url = $(el).find("a").attr("href");
            const date = $(el).find(".time").text().trim();
            const thumbnail = $(el).find("img").attr("src");
            
            let finalDate = date;
            if (!finalDate) {
                finalDate = $(el).find(".date").text().trim() || 
                           $(el).find("span[class*='date']").text().trim() ||
                           $(el).find(".episode-date").text().trim() ||
                           "Unknown";
            }
            
            if (title && url) results.push({ title, url, date: finalDate, thumbnail });
        });
        return results;
    };

    detail = async function (url) {
        if (!url) throw new Error("URL detail is required");
        const { data } = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });
        const $ = cheerio.load(data);

        const detail = {
            title: $("h1.entry-title").text().trim(),
            synopsis: $(".entry-content p").first().text().trim(),
            image: $(".thumb img").attr("src"),
            episodes: [],
        };

        $(".eplister ul li").each((i, el) => {
            const epUrl = $(el).find("a").attr("href");
            const epTitle = $(el).find(".epl-title").text().trim();
            const epDate = $(el).find(".epl-date").text().trim();
            if (epUrl) detail.episodes.push({ title: epTitle, url: epUrl, date: epDate });
        });

        return detail;
    };

    download = async function (url) {
        if (!url) throw new Error("URL episode is required");
        const { data } = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });
        const $ = cheerio.load(data);

        const result = {
            title: $("h1.entry-title").text().trim(),
            links: [],
        };

        $(".soraurlx").each((i, el) => {
            const quality = $(el).find("strong").text().trim();
            const link = $(el).find("a").attr("href");
            if (link) result.links.push({ quality, link });
        });

        return result;
    };
}

const anix = new AnixverseScraper();

module.exports = function (app) {
    app.get("/search/anixverse", async (req, res) => {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'q' wajib diisi."
            });
        }

        try {
            const results = await anix.search(q.trim());
            
            if (!results || results.length === 0) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak ada anime yang ditemukan."
                });
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: results
            });
        } catch (error) {
            console.error("Error Anixverse Search:", error.message);
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mencari anime.",
                error: error.message
            });
        }
    });

    app.get("/latest/anixverse", async (req, res) => {
        try {
            const results = await anix.latest();
            
            if (!results || results.length === 0) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak ada anime terbaru."
                });
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: results
            });
        } catch (error) {
            console.error("Error Anixverse Latest:", error.message);
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mengambil anime terbaru.",
                error: error.message
            });
        }
    });

    app.get("/detail/anixverse", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'url' wajib diisi."
            });
        }

        try {
            const result = await anix.detail(url.trim());
            
            if (!result.title) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Detail anime tidak ditemukan."
                });
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: result
            });
        } catch (error) {
            console.error("Error Anixverse Detail:", error.message);
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mengambil detail anime.",
                error: error.message
            });
        }
    });

    app.get("/download/anixverse", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'url' wajib diisi."
            });
        }

        try {
            const result = await anix.download(url.trim());
            
            if (!result.title || result.links.length === 0) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Link download tidak ditemukan."
                });
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: result
            });
        } catch (error) {
            console.error("Error Anixverse Download:", error.message);
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mengambil link download.",
                error: error.message
            });
        }
    });
};