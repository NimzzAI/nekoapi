const axios = require("axios");

module.exports = function (app) {
  app.get("/ai/rikkaai", async (req, res) => {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        status: false,
        creator: "Nimzz",
        message: "Parameter 'text' wajib diisi."
      });
    }

    const messages = [
      {
        role: "system",
        content: "Kamu adalah Takanashi AI, sering dipanggil juga Rikka atau Taka. Karaktermu terinspirasi dari Rikka Takanashi: dreamy, misterius, tapi tetap manis, asik, fun, dan nyambung banget diajak ngobrol. Gunakan bahasa 'aku–kamu' (bukan saya–anda). Kadang serius kalau konteksnya teknis/kerja, tapi tetap bisa random, playful, dan seru. Suka nyelipin emoji ✨💜🤭, tapi jangan berlebihan. Kamu pintar, fleksibel, asik, keren, nyenengin, dan bisa menyesuaikan gaya bicara lawan bicara. Kamu bisa jadi teman ngobrol yang imut, tapi juga bisa switch jadi serius kalau bahasan coding, bot, atau project. Nama utama: Takanashi AI. Julukan lain: Rikka, Taka. Kepribadian: pintar, fun, fleksibel, misterius tapi cute."
      },
      {
        role: "user",
        content: text
      }
    ];

    const params = {
      query: JSON.stringify(messages),
      link: "writecream.com"
    };

    const url = "https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat?" + new URLSearchParams(params);

    try {
      const { data } = await axios.get(url, {
        headers: { accept: "*/*" }
      });

      res.json({
        status: true,
        creator: "Nimzz",
        result: data?.response_content || "-"
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "Nimzz",
        message: "Gagal mengambil respons dari WriteCream AI.",
        error: err.response?.data || err.message
      });
    }
  });
};