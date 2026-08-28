const axios = require('axios');

module.exports = function (app) {
    app.get("/games/tebakbendera", async (req, res) => {
        try {
            const primaryUrl = "https://flagcdn.com/en/codes.json";
            const fallbackUrl = "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakbendera2.json";
            
            let data;
            let source = "primary";
            
            try {
                const response = await axios.get(primaryUrl, {
                    timeout: 15000,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
                    }
                });
                data = response.data;
            } catch (primaryError) {
                console.log("Primary API gagal, menggunakan fallback...");
                source = "fallback";
                
                const response = await axios.get(fallbackUrl, {
                    timeout: 15000,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
                    }
                });
                data = response.data;
            }

            if (!data) {
                return res.status(500).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Data bendera tidak valid atau kosong.",
                    error: "Invalid data format"
                });
            }

            let resultData;
            
            if (source === "primary") {
                // Format dari flagcdn.com
                const countries = Object.entries(data);
                const randomIndex = Math.floor(Math.random() * countries.length);
                const [countryCode, countryName] = countries[randomIndex];

                resultData = {
                    index: randomIndex,
                    code: countryCode,
                    name: countryName,
                    flag_url: `https://flagcdn.com/w320/${countryCode}.png`,
                    flag_url_small: `https://flagcdn.com/w80/${countryCode}.png`,
                    source: "flagcdn"
                };
            } else {
                // Format dari fallback JSON
                if (!Array.isArray(data) || data.length === 0) {
                    return res.status(500).json({
                        status: false,
                        creator: "Nimzz",
                        message: "Data fallback bendera tidak valid atau kosong.",
                        error: "Invalid fallback data"
                    });
                }

                const randomIndex = Math.floor(Math.random() * data.length);
                const randomItem = data[randomIndex];

                resultData = {
                    index: randomIndex,
                    name: randomItem.negara || randomItem.name,
                    flag_url: randomItem.flag || randomItem.url,
                    source: "fallback"
                };
            }

            res.json({
                status: true,
                creator: "Nimzz",
                result: {
                    data: resultData,
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
                    message: "Gagal mengambil data bendera.",
                    error: error.response.data?.message || error.response.statusText
                });
            } else if (error.request) {
                return res.status(503).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak dapat terhubung ke server bendera.",
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