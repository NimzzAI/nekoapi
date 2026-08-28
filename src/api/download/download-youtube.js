const axios = require("axios");

async function downloadFromA2Z(url) {
  try {
    console.log("Memproses link:", url);

    const res = await axios.get("https://www.a2zconverter.com/api/files/new-proxy", {
      params: { url },
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://www.a2zconverter.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
    });

    return res.data;
  } catch (err) {
    console.error("Error:", err.message);
    throw err;
  }
}

module.exports = function (app) {
    
    app.get('/download/youtube', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                message: "Parameter 'url' wajib diisi."
            });
        }

        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.status(400).json({
                status: false,
                message: "URL harus berupa link YouTube yang valid."
            });
        }

        try {
            const result = await downloadFromA2Z(url);
            
            res.json({
                status: true,
                creator: "API",
                data: result
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                message: "Gagal mendownload dari YouTube.",
                error: error.message
            });
        }
    });
};