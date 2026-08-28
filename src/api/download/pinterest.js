const fetch = require('node-fetch');

module.exports = function(app) {

  async function pinterestDl(url) {
    if (!url.includes('pin.it') && !url.includes('pinterest.com')) {
      return {
        code: 400,
        message: 'URL harus dari Pinterest / pin.it'
      };
    }

    try {
      const res = await fetch(url, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" 
        },
        redirect: "follow"
      });
      const data = await res.text();

      const video = data.match(/"contentUrl":"(https:\/\/v1\.pinimg\.com\/videos\/[^"]+\.mp4)"/);
      const image =
        data.match(/"imageSpec_736x":\{"url":"(https:\/\/i\.pinimg\.com\/736x\/[^"]+)"/) ||
        data.match(/"imageSpec_564x":\{"url":"(https:\/\/i\.pinimg\.com\/564x\/[^"]+)"/);
      const title = data.match(/"name":"([^"]+)"/);
      const author = data.match(/"fullName":"([^"]+)".+?"username":"([^"]+)"/);

      return {
        code: 200,
        timestamp: Date.now(),
        data: {
          type: video ? "video" : "image",
          title: title?.[1] || "-",
          author: author?.[1] || "-",
          username: author?.[2] || "-",
          media: video?.[1] || image?.[1] || "-",
          pinterest_url: url
        }
      };
    } catch (e) {
      return {
        code: 500,
        timestamp: Date.now(),
        message: e.message
      };
    }
  }

  // Route API GET: /download/pinterest?url=<pinterest_url>
  app.get('/download/pinterest', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, error: 'Parameter URL wajib diisi' });

    const result = await pinterestDl(url);

    if (result.code === 200) {
      res.json({
        status: true,
        creator: 'Nimzz',
        result: result.data
      });
    } else if (result.code === 400) {
      res.status(400).json({
        status: false,
        creator: 'Nimzz',
        error: result.message
      });
    } else {
      res.status(500).json({
        status: false,
        creator: 'Nimzz',
        error: result.message || 'Gagal memproses request'
      });
    }
  });
}