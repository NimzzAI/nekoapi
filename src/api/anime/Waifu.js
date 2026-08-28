const axios = require("axios");

module.exports = function (app) {
  app.get("/anime/waifu", async (req, res) => {
    try {
      // Ambil data JSON dari API waifu.pics
      const { data } = await axios.get("https://api.waifu.pics/sfw/waifu");

      // Ambil gambar dari URL
      const imgRes = await axios.get(data.url, { responseType: "arraybuffer" });
      const image = Buffer.from(imgRes.data, "binary");

      // Kirim gambar langsung (binary)
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": image.length,
      });
      res.end(image);
    } catch (error) {
      console.error("Gagal mengambil waifu:", error.message);
      res.status(500).json({ status: false, error: error.message });
    }
  });
};