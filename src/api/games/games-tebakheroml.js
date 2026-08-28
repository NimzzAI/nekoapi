const axios = require("axios");
const cheerio = require("cheerio");

const characters = [
  "Aamon", "Assassin", "Jungler", "Akai", "Tank", "Aldous", "Fighter", "Alice", "Alpha", "Alucard",
  "Angela", "Support", "Roamer", "Argus", "EXP Laner", "Arlott", "Atlas", "Aulus", "Aurora", "Mage",
  "Badang", "Balmond", "Bane", "Barats", "Baxia", "Beatrix", "Marksman", "Gold Laner", "Belerick",
  "Benedetta", "Brody", "Bruno", "Carmilla", "Caecilion", "Mid Laner", "Chou", "Figter", "Cici",
  "Claude", "Clint", "Cyclops", "Diggie", "Dyrroth", "Edith", "Esmeralda", "Estes", "Eudora", "Fanny",
  "Faramis", "Floryn", "Franco", "Fredrinn", "Freya", "Gatotkaca", "Gloo", "Gord", "Granger", "Grock",
  "Guinevere", "Gusion", "Hanabi", "Hanzo", "Harith", "Harley", "Hayabusa", "Helcurt", "Hilda", "Hylos",
  "Irithel", "Ixia", "Jawhead", "Johnson", "Joy", "Asassin", "Julian", "Kadita", "Kagura", "Kaja",
  "Karina", "Karrie", "Khaleed", "Khufra", "Kimmy", "Lancelot", "Layla", "Leomord", "Lesley", "Ling",
  "Lolita", "Lunox", "Luo Yi", "Lylia", "Martis", "Masha", "Mathilda", "Melissa", "Minotaur", "Minsitthar",
  "Miya", "Moskov", "Nana", "Natalia", "Natan", "Novaria", "Odette", "Paquito", "Pharsa", "Phoveus",
  "Popol and Kupa", "Rafaela", "Roger", "Ruby", "Saber", "Selena", "Silvanna", "Sun", "Terizla", "Thamuz",
  "Tigreal", "Uranus", "Vale", "Valentina", "Valir", "Vexana", "Wanwan", "Xavier", "Yin", "Yu Zhong",
  "Yve", "Zhask", "Zilong"
];

async function scrapeHeroML() {
  const query = characters[Math.floor(Math.random() * characters.length)];
  const url = `https://mobile-legends.fandom.com/wiki/${query}/Audio/id`;
  const response = await axios.get(url, {
    timeout: 30000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });
  const $ = cheerio.load(response.data);
  const audioSrc = $("audio")
    .map((i, el) => $(el).attr("src"))
    .get();
  const randomAudio = audioSrc[Math.floor(Math.random() * audioSrc.length)];

  if (!randomAudio) {
    throw new Error(`No audio found for character: ${query}`);
  }

  return { name: query, audio: randomAudio };
}

module.exports = function (app) {
  app.get("/games/tebakheroml", async (req, res) => {
    try {
      const data = await scrapeHeroML();

      if (!data) {
        return res.status(500).json({
          status: false,
          creator: "Nimzz",
          message: "Gagal mengambil data hero ML.",
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
          message: "Gagal mengambil data hero ML.",
          error: error.response.data?.message || error.response.statusText
        });
      } else if (error.request) {
        return res.status(503).json({
          status: false,
          creator: "Nimzz",
          message: "Tidak dapat terhubung ke server.",
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