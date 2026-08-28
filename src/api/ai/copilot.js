const WebSocket = require('ws');
const axios = require('axios');

module.exports = function(app) {
    async function copilotChat(message, model = 'default') {
        const models = {
            default: 'chat',
            'think-deeper': 'reasoning',
            'gpt-5': 'smart'
        };

        if (!models[model]) throw new Error(`Available models: ${Object.keys(models).join(', ')}`);

        // Buat conversation baru
        const { data } = await axios.post('https://copilot.microsoft.com/c/api/conversations', null, {
            headers: {
                origin: 'https://copilot.microsoft.com',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });

        const conversationId = data.id;

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1`, {
                headers: {
                    origin: 'https://copilot.microsoft.com',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
                }
            });

            const response = { text: '', citations: [] };

            ws.on('open', () => {
                ws.send(JSON.stringify({
                    event: 'setOptions',
                    supportedFeatures: ['partial-generated-images'],
                    supportedCards: ['weather', 'local', 'image', 'sports', 'video', 'ads', 'safetyHelpline', 'quiz', 'finance', 'recipe'],
                    ads: { supportedTypes: ['text', 'product', 'multimedia', 'tourActivity', 'propertyPromotion'] }
                }));

                ws.send(JSON.stringify({
                    event: 'send',
                    mode: models[model],
                    conversationId,
                    content: [{ type: 'text', text: message }],
                    context: {}
                }));
            });

            ws.on('message', (chunk) => {
                try {
                    const parsed = JSON.parse(chunk.toString());

                    switch (parsed.event) {
                        case 'appendText':
                            response.text += parsed.text || '';
                            break;
                        case 'citation':
                            response.citations.push({
                                title: parsed.title,
                                icon: parsed.iconUrl,
                                url: parsed.url
                            });
                            break;
                        case 'done':
                            resolve(response);
                            ws.close();
                            break;
                        case 'error':
                            reject(new Error(parsed.message));
                            ws.close();
                            break;
                    }
                } catch (error) {
                    reject(error);
                }
            });

            ws.on('error', reject);
        });
    }

    // Route API
    app.get('/ai/copilot', async (req, res) => {
        const { message, model } = req.query;

        if (!message) {
            return res.status(400).json({
                status: false,
                error: "Pesan wajib diisi"
            });
        }

        try {
            const result = await copilotChat(message, model);
            res.json({ status: true, result });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};