const axios = require("axios");

module.exports = function (app) {
  app.get("/ai/llama33", async (req, res) => {
    const { prompt, text } = req.query;

    // Validasi parameter
    if (!prompt || !text) {
      return res.status(400).json({
        status: false,
        creator: "Nimzz",
        message: "Parameter 'prompt' dan 'text' wajib diisi."
      });
    }

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({
        status: false,
        creator: "Nimzz",
        message: "Parameter 'prompt' harus berupa string yang tidak kosong."
      });
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        status: false,
        creator: "Nimzz",
        message: "Parameter 'text' harus berupa string yang tidak kosong."
      });
    }

    // Payload untuk DeepInfra API
    const payload = {
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [
        { 
          role: "system", 
          content: prompt.trim() 
        },
        { 
          role: "user", 
          content: text.trim() 
        }
      ],
      stream: false,
      max_tokens: 2048,
      temperature: 0.7
    };

    // Headers untuk request
    const headers = {
      "Content-Type": "application/json",
      "X-Deepinfra-Source": "web-page",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      "Referer": "https://deepinfra.com/chat"
    };

    try {
      console.log("Mengirim request ke Llama 3.3 API...");
      
      const response = await axios.post(
        "https://api.deepinfra.com/v1/openai/chat/completions",
        payload,
        { 
          headers,
          timeout: 30000 // 30 detik timeout
        }
      );

      // Validasi response
      if (!response.data || 
          !response.data.choices || 
          response.data.choices.length === 0 ||
          !response.data.choices[0].message ||
          !response.data.choices[0].message.content) {
        return res.status(500).json({
          status: false,
          creator: "Nimzz",
          message: "Gagal mengambil respons dari Llama 3.3 API.",
          error: "Response tidak valid dari API"
        });
      }

      const aiResponse = response.data.choices[0].message.content;

      // Success response - format sederhana
      res.json({
        status: true,
        creator: "Nimzz",
        result: aiResponse
      });

    } catch (err) {
      console.error("Error Llama 3.3 API:", err.message);
      
      // Handle berbagai jenis error
      if (err.code === 'ECONNABORTED') {
        return res.status(408).json({
          status: false,
          creator: "Nimzz",
          message: "Request timeout - API terlalu lama merespons.",
          error: "Timeout"
        });
      }
      
      if (err.response) {
        // Error dari DeepInfra API
        return res.status(err.response.status).json({
          status: false,
          creator: "Nimzz",
          message: "Gagal mengambil respons dari Llama 3.3 API.",
          error: err.response.data || err.response.statusText
        });
      } else if (err.request) {
        // Tidak ada response
        return res.status(503).json({
          status: false,
          creator: "Nimzz",
          message: "Tidak dapat terhubung ke Llama 3.3 API.",
          error: "Network Error"
        });
      } else {
        // Error lainnya
        return res.status(500).json({
          status: false,
          creator: "Nimzz",
          message: "Terjadi kesalahan internal.",
          error: err.message
        });
      }
    }
  });
};