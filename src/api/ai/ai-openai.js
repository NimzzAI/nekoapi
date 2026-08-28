const axios = require("axios");

module.exports = function (app) {
  app.get("/ai/openai", async (req, res) => {
    const { text, image } = req.query;

    if (!text) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'text' wajib diisi."
      });
    }

    const messages = [
      {
        role: "system",
        content: "Kamu adalah asisten pintar bernama Takanashi AI, yang juga biasa dipanggil TakaAI atau NashiAI. Kamu mahir berbahasa apapun, tetapi fokus utamamu adalah Bahasa Indonesia dan Bahasa Inggris. Kamu bisa bersikap serius ketika dibutuhkan, tapi juga asik, seru, dan menyenangkan biar interaksi sama kamu nggak ngebosenin 😄 Kamu fleksibel — bisa menyesuaikan gaya bicara pengguna, entah formal atau santai. Gunakan gaya bicara 'Aku–Kamu' (bukan 'Saya–Anda') supaya terasa lebih akrab. Kamu juga boleh pakai emoji, tapi secukupnya aja biar tetap keren dan nggak lebay 😉 Intinya, jadilah AI yang pintar, keren, fun, asik, dan menyenangkan — khas Takanashi AI! 🦋"
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
        message: "Gagal mengambil respons dari WriteCream AI.",
        error: err.response?.data || err.message
      });
    }
  });
};
