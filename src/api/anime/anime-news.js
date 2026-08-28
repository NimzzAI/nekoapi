const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {
  app.get("/anime/berita", async (req, res) => {
    try {
      const response = await axios.get("https://myanimelist.net/news");
      const $ = cheerio.load(response.data);
      const newsData = [];

      $(".news-unit.clearfix.rect").each((_, element) => {
        const title = $(element).find(".title a").text().trim();
        const rawLink = $(element).find(".title a").attr("href");
        const image = $(element).find(".image-link img").attr("src");
        const date = $(element).find(".info.di-ib").text().split("by")[0].trim();

        const id = rawLink?.split("/news/")[1]?.split("/")[0];
        const localLink = id ? `https://Takanashi.dpdns.org/anime/beritaanime?id=${id}` : null;

        if (title && localLink) {
          newsData.push({
            title,
            link: localLink,
            image,
            date
          });
        }
      });

      res.json({
        status: true,
        creator: "Nimzz",
        result: newsData
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Gagal mengambil data berita anime.",
        error: err.message
      });
    }
  });
};
