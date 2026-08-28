const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {
  app.get("/anime/revinime", async (req, res) => {
    const baseUrl = "https://www.revinime.xyz/";

    try {
      const response = await axios.get(baseUrl);
      const $ = cheerio.load(response.data);
      const lastUpdateAnime = [];

      $('section:contains("Last Update Anime!") .grid > div').each((i, el) => {
        const animeEl = $(el).find("a");
        const href = animeEl.attr("href");
        const link = href.startsWith("http") ? href : baseUrl + href;
        let episode = $(el).find('.text-gray-400 > span').text().replace('Eps ', '');
        episode = episode === '' ? '0' : episode;
    
        const rawImage = animeEl.find("img").attr("src");
        const imageParams = new URLSearchParams(rawImage.split("?")[1]);
        const image = imageParams.get("url")
          ? decodeURIComponent(imageParams.get("url"))
          : rawImage;

        const title = animeEl.find("h3").text().trim();

        lastUpdateAnime.push({ title, episode, image, link });
      });

      res.json({
        status: true,
        creator: "Nimzz",
        result: lastUpdateAnime
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Gagal mengambil data dari Revinime.",
        error: err.message
      });
    }
  });
};
