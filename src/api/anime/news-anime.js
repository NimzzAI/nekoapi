const axios = require("axios");
const cheerio = require("cheerio");

async function animeNews() {
  try {
    const res = await axios.get("https://www.kaorinusantara.or.id/rubrik/aktual/anime");
    const $ = cheerio.load(res.data);
    const news = [];

    $(".td_module_10.td_module_wrap.td-animation-stack").each((i, el) => {
      const judul = $(el).find("h3").text().trim();
      const link = $(el).find("h3 a").attr("href");
      news.push({ judul, link });
    });

    return news;
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = function (app) {
  app.get("/search/anime-news", async (req, res) => {
    const result = await animeNews();
    if (Array.isArray(result)) {
      res.json({
        status: true,
        total: result.length,
        result
      });
    } else {
      res.status(500).json({
        status: false,
        msg: "Gagal ngambil berita",
        error: result.error
      });
    }
  });
};