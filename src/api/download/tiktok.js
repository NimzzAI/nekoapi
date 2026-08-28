const axios = require("axios");

async function tiktokTikWM(url) {
  try {
    const params = new URLSearchParams();
    params.set("url", url);
    params.set("hd", "1");

    const response = await axios.post("https://tikwm.com/api/", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
        Cookie: "current_language=en",
      },
    });

    if (!response.data) throw new Error("No data found from TikWM");

    return response.data;
  } catch (error) {
    throw new Error(error.message || "Gagal mengambil data TikTok");
  }
}

module.exports = function (app) {
  app.get("/download/tiktok", async (req, res) => {
    const { url } = req.query;

    if (!url)
      return res.status(400).json({ status: false, error: "Url is required" });

    try {
      const result = await tiktokTikWM(url);

      res.status(200).json({
        status: true,
        result,
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};