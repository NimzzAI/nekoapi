const axios = require("axios");

async function scrape() {
  const getRandomAyah = () => Math.floor(Math.random() * 6236) + 1;
  const response = await axios.get(
    `https://api.alquran.cloud/v1/ayah/${getRandomAyah()}/ar.alafasy`,
    {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    }
  );

  if (response.status === 200 && response.data && response.data.data) {
    return response.data.data;
  } else {
    throw new Error("Data not found");
  }
}

module.exports = function (app) {
  app.get("/games/tebaksurah", async (req, res) => {
    try {
      const data = await scrape();

      if (!data) {
        return res.status(500).json({
          status: false,
          creator: "Nimzz",
          message: "Gagal mengambil data surah.",
          error: "No result returned"
        });
      }

      res.json({
        status: true,
        creator: "Nimzz",
        result: {
          data: {
            number: data.number,
            text: data.text,
            surah: data.surah,
            numberInSurah: data.numberInSurah,
            audio: data.audio
          },
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
          message: "Gagal mengambil data surah dari API.",
          error: error.response.data?.message || error.response.statusText
        });
      } else if (error.request) {
        return res.status(503).json({
          status: false,
          creator: "Nimzz",
          message: "Tidak dapat terhubung ke Quran API.",
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