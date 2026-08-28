const axios = require("axios");
const cheerio = require("cheerio");

const baseUrl = "https://id.m.wikipedia.org";

async function fetchImageUrl(url) {
  const response = await axios.get(url, {
    timeout: 30000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });
  const html = response.data;
  const $ = cheerio.load(html);
  const src = $(
    "tr.mergedtoprow td.infobox-full-data.maptable div.ib-settlement-cols-row div.ib-settlement-cols-cell a.mw-file-description img.mw-file-element"
  ).attr("src");
  return src ? "https:" + src : null;
}

async function scrapeKabupaten() {
  const response = await axios.get(baseUrl + "/wiki/Daftar_kabupaten_di_Indonesia", {
    timeout: 30000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });
  const html = response.data;
  const $ = cheerio.load(html);
  const kabupatenList = $("td a[href^='/wiki/Kabupaten']")
    .map((_, element) => {
      const link = $(element).attr("href");
      const name = $(element).attr("title");
      return link && name ? { link: baseUrl + link, name: name } : null;
    })
    .get()
    .filter((item) => item !== null);

  if (kabupatenList.length === 0) {
    throw new Error("No kabupaten found");
  }

  const randomKabupaten = kabupatenList[Math.floor(Math.random() * kabupatenList.length)];
  const imageUrl = await fetchImageUrl(randomKabupaten.link);
  const judulBaru = randomKabupaten.name.replace("Kabupaten ", "");
  const ukuranBaru = imageUrl ? imageUrl.replace(/\/\d+px-/, "/1080px-") : null;

  return {
    link: randomKabupaten.link,
    title: judulBaru,
    url: ukuranBaru,
  };
}

module.exports = function (app) {
  app.get("/games/tebakkabupaten", async (req, res) => {
    try {
      const data = await scrapeKabupaten();

      if (!data) {
        return res.status(500).json({
          status: false,
          creator: "Nimzz",
          message: "Gagal mengambil data kabupaten.",
          error: "No result returned"
        });
      }

      res.json({
        status: true,
        creator: "Nimzz",
        result: {
          data: data,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return res.status(408).json({
          status: false,
          creator: "Nimzz",
          message: "Request timeout - Terlalu lama mengambil data.",
          error: "Timeout"
        });
      }
      
      if (error.response) {
        return res.status(error.response.status).json({
          status: false,
          creator: "Nimzz",
          message: "Gagal mengambil data kabupaten.",
          error: error.response.data?.message || error.response.statusText
        });
      } else if (error.request) {
        return res.status(503).json({
          status: false,
          creator: "Nimzz",
          message: "Tidak dapat terhubung ke Wikipedia.",
          error: "Network Error"
        });
      } else {
        return res.status(500).json({
          status: false,
          creator: "Nimzz",
          message: "Terjadi kesalahan internal.",
          error: error.message
        });
      }
    }
  });
};