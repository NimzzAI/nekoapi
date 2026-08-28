const axios = require("axios");
const cheerio = require("cheerio");

async function PlayStore(search) {
    return new Promise(async (resolve, reject) => {
        try {
            const { data } = await axios.get(`https://play.google.com/store/search?q=${encodeURIComponent(search)}&c=apps`);
            const hasil = [];
            const $ = cheerio.load(data);
            
            $('.ULeU3b > .VfPpkd-WsjYwc.VfPpkd-WsjYwc-OWXEXe-INsAgc.KC1dQ.Usd1Ac.AaN0Dd.Y8RQXd > .VfPpkd-aGsRMb > .VfPpkd-EScbFb-JIbuQc.TAQqTe > a').each((i, u) => {
                const linkk = $(u).attr('href');
                const nama = $(u).find('.j2FCNc > .cXFu1 > .ubGTjb > .DdYX5').text();
                const developer = $(u).find('.j2FCNc > .cXFu1 > .ubGTjb > .wMUdtb').text();
                const rate = $(u).find('.j2FCNc > .cXFu1 > .ubGTjb > div').attr('aria-label');
                const rate2 = $(u).find('.j2FCNc > .cXFu1 > .ubGTjb > div > span.w2kbF').text();
                const link = `https://play.google.com${linkk}`;

                hasil.push({
                    link: link,
                    nama: nama || 'No name',
                    developer: developer || 'No Developer',
                    img: 'https://files.catbox.moe/dklg5y.jpg', 
                    rate: rate || 'No Rate',
                    rate2: rate2 || 'No Rate',
                    link_dev: `https://play.google.com/store/apps/developer?id=${developer ? developer.split(" ").join('+') : 'unknown'}`
                });
            });
            
            if (hasil.length === 0) {
                return resolve([]);
            }
            
            resolve(hasil.slice(0, Math.min(10, hasil.length)));
        } catch (err) {
            console.error("PlayStore Search Error:", err);
            reject(err);
        }
    });
}

module.exports = function (app) {
    app.get('/search/playstore', async (req, res) => {
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
            const results = await PlayStore(q.trim());
            
            if (!results || results.length === 0) {
                return res.status(404).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak ada aplikasi yang ditemukan."
                });
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: results
            });
        } catch (error) {
            console.error("Error PlayStore Search:", error.message);
            
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal mencari aplikasi di Play Store.",
                error: error.message
            });
        }
    });
};
