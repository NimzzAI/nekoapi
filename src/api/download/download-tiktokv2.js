const cheerio = require("cheerio")
const axios = require("axios")

class ttdl {
    constructor() {
        this.bs = 'https://' + 'ssstik' + '.io';
        this.hr = {
            'origin': this.bs,
            'hx-request': 'true',
            'hx-current-url': this.bs + '/id',
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': 'Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0'
        };
    }
    
    n(i, j) { return { status: i, ...j } }
    u(p) { return new URLSearchParams(p) }
    
    async d() {
        const n = await axios.get(this.hr.origin, { headers: this.hr })
        const k = n.data.match(/s_tt = '(.*?)',/)?.[1]
        if (!n) return null
        return n
    }
    
    async download(url) {
        try {
            if (!url && !/tiktok.com/.test(url)) return this.n(!1, { msg: 'Please input tiktok url' })
            
            const tid = await this.d()
            if (!tid) return this.n(!1, { msg: "Failed to initialize" })
            
            const g = await axios.post(this.hr.origin + '/abc', this.u({
                id: url,
                locale: 'id',
                debug: 'ab=0&loc=ID&ip=127.0.0.1',
                tt: tid
            }), {
                params: { url: 'dl' },
                headers: {
                    ...this.hr,
                    'hx-target': 'target',
                    'hx-trigger': '_gcaptcha_pt',
                }
            })
            
            const $ = cheerio.load(g.data)
            
            const [name, pp, title, nowm, id, hx] = [
                $('.result_author').attr('alt'),
                $('.result_author').attr('src'),
                $('.maintext').text(),
                $('.without_watermark').attr('href'),
                $('input[name="tt"]').attr('value'),
                $('.without_watermark_hd').attr('data-directurl')
            ]

            const se = await axios.post(this.hr.origin + hx, this.u({
                tt: id
            }), {
                headers: {
                    ...this.hr,
                    'hx-trigger': 'hd_download',
                    'hx-target': 'hd_download',
                }
            })
            
            return this.n(!0, {
                name,
                pp,
                title,
                nowm,
                hd: se.headers['hx-redirect']
            })
        } catch(e) {
            return this.n(!1, { msg: e.message })
        }
    }
}

module.exports = function (app) {
    const tiktok = new ttdl();
    
    app.get('/download/tiktok/v2', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter 'url' wajib diisi."
            });
        }

        try {
            const results = await tiktok.download(url);
            
            if (!results.status) {
                return res.status(500).json({
                    status: false,
                    creator: "Nimzz",
                    message: results.msg
                });
            }

            res.status(200).json({
                status: true,
                creator: "Nimzz",
                result: results
            });
        } catch (error) {
            console.error('TikTok V2 Download Error:', error);
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: "Gagal memproses download TikTok.",
                error: error.message
            });
        }
    });
};