const axios = require("axios");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

const sfile = {
    search: async (query, page = 1) => {
        let res = await fetch(`https://sfile.mobi/search.php?q=${encodeURIComponent(query)}&page=${page}`);
        let $ = cheerio.load(await res.text());
        let arr = [];
        
        $('div.list').each((idx, el) => {
            let title = $(el).find('a').text();
            let size = $(el).text().trim().split(' (')[1];
            let link = $(el).find('a').attr('href');
            
            if (link) {
                arr.push({ 
                    title: title || "Unknown", 
                    size: size ? size.replace(')', '') : "Unknown", 
                    link: link.startsWith('http') ? link : `https://sfile.mobi${link}`
                });
            }
        });
        
        return arr;
    }
};

module.exports = function (app) {
    app.get('/search/sfile', async (req, res) => {
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
            const results = await sfile.search(q.trim());
            
            if (!results || results.length === 0) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak ada hasil yang ditemukan."
                });
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: results
            });
        } catch (error) {
            console.error("Error SFile Search:", error.message);
            
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mencari file di SFile.",
                error: error.message
            });
        }
    });
};
