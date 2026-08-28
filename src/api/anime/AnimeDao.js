const axios = require("axios");
const cheerio = require("cheerio");

class AnimeDao {
  static async getLatestAnime() {
    const { data } = await axios.get("https://animedao.lv/series/?status=&type=&order=update");
    const $ = cheerio.load(data);
    const results = [];
    $(".listupd article.bs").each((_, el) => {
      const element = $(el).find("a");
      const title = element.attr("title") || $(el).find("h2").text();
      const link = element.attr("href");
      const image = $(el).find("img").attr("src");
      const status = $(el).find(".epx").text();
      const sub = $(el).find(".sb").text();
      results.push({ title, link, image, status, sub });
    });
    return results;
  }

  static async hotSeries() {
    const { data } = await axios.get("https://animedao.lv/");
    const $ = cheerio.load(data);
    const results = [];
    $("article.bs").each((_, el) => {
      const title = $(el).find("h2").text().trim();
      const link = $(el).find("a").attr("href");
      const episode = $(el).find(".epx").text().trim();
      const subtitle = $(el).find(".sb").text().trim();
      const image = $(el).find("img").attr("src");
      const upload = $(el).find(".timeago").text().trim();
      const animeName = $(el).find(".tt").contents().first().text().trim();
      results.push({ title, animeName, episode, subtitle, image, link, upload });
    });
    return results;
  }

  static async searchAnime(query) {
    const { data } = await axios.get(`https://animedao.lv/?s=${encodeURIComponent(query)}`);
    const $ = cheerio.load(data);
    const results = [];
    $(".bixbox .listupd .bs").each((_, el) => {
      const title = $(el).find(".tt h2").text().trim();
      const link = $(el).find("a").attr("href");
      const image = $(el).find("img").attr("src");
      const status = $(el).find(".status").text().trim();
      const type = $(el).find(".typez").text().trim();
      results.push({ title, link, image, status, type });
    });
    return results;
  }

  static async scrapeAnimeData(url) {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const image = $("img.ts-post-image").attr("src");
    const title = $("h1.entry-title").text();
    const status = $('span:contains("Status:")').next().text();
    const studio = $('a[rel="tag"]').first().text();
    const released = $('span:contains("Released:")').next().text();
    const episodes = $('span:contains("Episodes:")').next().text();
    const description = $('.entry-content[itemprop="description"]').text().trim();
    const lastEpisodeLink = $(".lastend .inepcx a").attr("href");
    const lastEpisodeNumber = $(".lastend .inepcx a span.epcur").text();
    const episodesList = [];
    $(".eplister ul li").each((_, el) => {
      const episodeLink = $(el).find("a").attr("href");
      const episodeNumber = $(el).find(".epl-num").text();
      const episodeTitle = $(el).find(".epl-title").text();
      const episodeSub = $(el).find(".epl-sub span").text();
      const episodeDate = $(el).find(".epl-date").text();
      episodesList.push({ episodeNumber, episodeTitle, episodeLink, episodeSub, episodeDate });
    });
    return {
      image, title, status, studio, released, episodes, description,
      lastEpisode: { link: lastEpisodeLink, number: lastEpisodeNumber },
      episodesList
    };
  }
}

module.exports = function (app) {
  app.get("/anime/latest", async (_, res) => {
    try {
      const result = await AnimeDao.getLatestAnime();
      res.json({ status: true, result });
    } catch (e) {
      res.status(500).json({ status: false, message: e.message });
    }
  });

  app.get("/anime/hot", async (_, res) => {
    try {
      const result = await AnimeDao.hotSeries();
      res.json({ status: true, result });
    } catch (e) {
      res.status(500).json({ status: false, message: e.message });
    }
  });

  app.get("/anime/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, message: "Parameter 'q' (query) diperlukan!" });
    try {
      const result = await AnimeDao.searchAnime(q);
      res.json({ status: true, result });
    } catch (e) {
      res.status(500).json({ status: false, message: e.message });
    }
  });

  app.get("/anime/detail", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: "Parameter 'url' diperlukan!" });
    try {
      const result = await AnimeDao.scrapeAnimeData(url);
      res.json({ status: true, result });
    } catch (e) {
      res.status(500).json({ status: false, message: e.message });
    }
  });
};
