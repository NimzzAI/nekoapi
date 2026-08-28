const axios = require('axios');

async function igStalk(usrname) {
  try {
    const h = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
      'Referer': 'https://story-viewer.co/'
    };
    
    const urlb = 'https://api.story-viewer.co';
    
    const ures = await axios.get(`${urlb}/user/${usrname}?sig=4=eX9raGd4Jm94eWZ/Oi4zPz44OzI8Mj0/OzAtMT`, {
      headers: h
    });
    const udata = ures.data;
    
    const hrest = await axios.get(`${urlb}/highlights/${udata.id}?sig=pOT01CSkxDSUdJCFMPHBcSExIcEx1XS0hCT0pPTUNDTkpMLUIzMT`, {
      headers: h
    });
    const hdata = hrest.data;
    
    const sres = await axios.get(`${urlb}/stories/${usrname}?sig=egtaaxpri5p/2xprC7p6D45+Lg5uXg4uzs4eXjLeEyMj`, {
      headers: h
    });
    const sdata = sres.data;
    
    const prest = await axios.get(`${urlb}/posts/${usrname}?sig=pAGjtbKyvaP8pK+joLT86ODo4+Hk5ujo5eHnLeA4Mj`, {
      headers: h
    });
    const pdata = prest.data;
    
    const fwres = await axios.get(`${urlb}/followers/${udata.id}?sig=4=eX9raGd4Jm94eWZ/Oi4zPz44OzI8Mj0/OzAtMT`, {
      headers: h
    });
    const fwdata = fwres.data;
    
    const flres = await axios.get(`${urlb}/following/${udata.id}?sig=pOT01CSkxDSUdJCFMPHBcSExIcEx1XS0hCT0pPTUNDTkpMLUIzMT`, {
      headers: h
    });
    const fldata = flres.data;
    
    const hasil = {
      profile: udata,
      followers: fwdata,
      following: fldata,
      highlights: hdata,
      stories: sdata,
      posts: pdata
    };
    
    return hasil;
  } catch (e) {
    throw new Error(`${e.message}`);
  }
}

async function downloadInstagramMedia(url) {
  try {
    const h = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
    };
    
    const response = await axios.get(`https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`, {
      headers: h
    });
    
    const mediaData = response.data;
    
    const downloadResult = {
      url: url,
      media_url: mediaData.thumbnail_url || mediaData.url,
      title: mediaData.title || 'Instagram Media',
      author: mediaData.author_name,
      author_url: mediaData.author_url
    };
    
    return downloadResult;
  } catch (e) {
    throw new Error(`Download failed: ${e.message}`);
  }
}

module.exports = function(app) {
    app.get('/stalk/instagram', async (req, res) => {
        const { username } = req.query;
        
        if (!username) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter username diperlukan",
                error: "Missing username parameter"
            });
        }

        try {
            const result = await igStalk(username);
            
            res.json({
                status: true,
                creator: "Nimzz",
                result: result,
                timestamp: new Date().toISOString()
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
                    message: "Gagal mengambil data Instagram.",
                    error: error.response.data?.message || error.response.statusText
                });
            } else if (error.request) {
                return res.status(503).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak dapat terhubung ke server Instagram.",
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

    app.get('/download/instagramv2', async (req, res) => {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "Nimzz",
                message: "Parameter url diperlukan",
                error: "Missing url parameter"
            });
        }

        try {
            const result = await downloadInstagramMedia(url);
            
            res.json({
                status: true,
                creator: "Nimzz",
                result: result,
                timestamp: new Date().toISOString()
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
                    message: "Gagal download media Instagram.",
                    error: error.response.data?.message || error.response.statusText
                });
            } else if (error.request) {
                return res.status(503).json({
                    status: false,
                    creator: "Nimzz",
                    message: "Tidak dapat terhubung ke server Instagram.",
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