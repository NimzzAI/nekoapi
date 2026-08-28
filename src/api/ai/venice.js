const axios = require('axios');

module.exports = function(app) {

    async function venicechat(question) {
        try {
            if (!question) throw new Error('Question is required');

            const { data } = await axios.request({
                method: 'POST',
                url: 'https://outerface.venice.ai/api/inference/chat',
                headers: {
                    accept: '*/*',
                    'content-type': 'application/json',
                    origin: 'https://venice.ai',
                    referer: 'https://venice.ai/',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
                    'x-venice-version': 'interface@20250523.214528+393d253'
                },
                data: {
                    requestId: 'nekorinn',
                    modelId: 'dolphin-3.0-mistral-24b',
                    prompt: [
                        { content: question, role: 'user' }
                    ],
                    systemPrompt: '',
                    conversationType: 'text',
                    temperature: 0.8,
                    webEnabled: true,
                    topP: 0.9,
                    isCharacter: false,
                    clientProcessingTime: 15
                }
            });

            // Parsing chunks
            const chunks = data
                .split('\n')
                .filter(Boolean)
                .map(chunk => {
                    try { return JSON.parse(chunk); } 
                    catch { return null; }
                })
                .filter(Boolean);

            let result = chunks.map(chunk => chunk?.content ?? '').join('');

            // Bersihkan escape & whitespace berlebih
            result = result.replace(/\\"/g, '"')
                           .replace(/^"(.*)"$/, '$1')
                           .replace(/\\n/g, ' ')
                           .replace(/\\r/g, '')
                           .replace(/\\t/g, ' ')
                           .replace(/\s+/g, ' ')
                           .trim();

            return result;

        } catch (err) {
            throw new Error(err.message || 'Unknown error');
        }
    }

    // Route API
    app.get('/ai/venice', async (req, res) => {
        const { message } = req.query;

        if (!message) {
            return res.status(400).json({
                status: false,
                error: "Pesan wajib diisi"
            });
        }

        try {
            const result = await venicechat(message);
            res.json({
                status: true,
                creator: "Nimzz",
                result
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });
};