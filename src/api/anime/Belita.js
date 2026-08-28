const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {
  app.get("/anime/beritaanime", async (req, res) => {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'id' wajib diisi."
      });
    }

    const url = `https://myanimelist.net/news/${id}`;

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const title = $("h1.title").text().trim();
      const date = $(".news-info-block .information").text().split('|')[0].replace('by', '').trim();
      const image = $('.content > div > img.userimg').attr('src') || null;
      const content = $(".content").text().trim();

      return res.json({
        status: true,
        creator: "Nimzz",
        result: {
          title,
          date,
          image,
          content
        }
      });
    } catch (e) {
      res.status(500).json({
        status: false,
        message: "Gagal mengambil detail berita.",
        error: e.message
      });
    }
  });
};
