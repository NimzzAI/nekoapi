const fetch = require("node-fetch");

async function MediaFire(url) {
    try {
        const res1 = await fetch("https://staging-mediafire-direct-url-ui-txd2.frontend.encr.app/api/mediafire/taskid", {
            method: "POST",
            headers: {
                "accept": "*/*",
                "content-type": "application/json",
                "accept-language": "id-ID"
            }
        });
        const data1 = await res1.json();
        const taskId = data1.taskId;
        const res2 = await fetch(`https://staging-mediafire-direct-url-ui-txd2.frontend.encr.app/api/mediafire/download/${taskId}`, {
            method: "POST",
            headers: {
                "accept": "*/*",
                "content-type": "application/json",
                "accept-language": "id-ID"
            },
            body: JSON.stringify({ url })
        });
        const data2 = await res2.json();
        return {
            fileName: data2.fileName,
            downloadUrl: data2.downloadUrl
        };
    } catch {
        return null;
    }
}

module.exports = function (app) {
    app.get('/download/mediafire', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'url' wajib diisi."
            });
        }

        try {
            const results = await MediaFire(url);
            
            if (!results) {
                return res.status(500).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Gagal mendapatkan link download MediaFire."
                });
            }

            res.status(200).json({
                status: true,
                creator: "Nimzz",
                result: results
            });
        } catch (error) {
            console.error('MediaFire Download Error:', error);
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal memproses download MediaFire.",
                error: error.message
            });
        }
    });
};