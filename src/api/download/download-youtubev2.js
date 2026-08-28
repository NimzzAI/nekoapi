const axios = require("axios");
const crypto = require("crypto");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

function getRandomUserAgent() {
  const uaPath = path.join(__dirname, '../ai/ua.txt');
  const userAgents = fs.readFileSync(uaPath, 'utf8')
    .split('\n')
    .filter(ua => ua.trim() !== '');
  return userAgents[Math.floor(Math.random() * userAgents.length)].trim();
}

const savetube = {
  api: {
    base: "https://media.savetube.me/api",
    cdn: "/random-cdn",
    info: "/v2/info",
    download: "/download",
  },
  headers: {
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://yt.savetube.me",
    referer: "https://yt.savetube.me/",
    "user-agent": getRandomUserAgent(),
  },
  formats: ["144", "240", "360", "480", "720", "1080", "mp3"],
  crypto: {
    hexToBuffer: (hexString) => {
      const matches = hexString.match(/.{1,2}/g);
      return Buffer.from(matches.join(""), "hex");
    },
    decrypt: async (enc) => {
      const secretKey = "C5D58EF67A7584E4A29F6C35BBC4EB12";
      const data = Buffer.from(enc, "base64");
      const iv = data.slice(0, 16);
      const content = data.slice(16);
      const key = savetube.crypto.hexToBuffer(secretKey);
      const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
      let decrypted = decipher.update(content);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return JSON.parse(decrypted.toString());
    },
  },
  youtube: (url) => {
    if (!url) return null;
    const a = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    ];
    for (let b of a) {
      if (b.test(url)) return url.match(b)[1];
    }
    return null;
  },
  request: async (endpoint, data = {}, method = "post") => {
    const { data: response } = await axios({
      method,
      url: `${endpoint.startsWith("http") ? "" : savetube.api.base}${endpoint}`,
      data: method === "post" ? data : undefined,
      params: method === "get" ? data : undefined,
      headers: savetube.headers,
    });
    return {
      status: true,
      code: 200,
      data: response,
    };
  },
  getCDN: async () => {
    const response = await savetube.request(savetube.api.cdn, {}, "get");
    if (!response.status) throw new Error(response);
    return {
      status: true,
      code: 200,
      data: response.data.cdn,
    };
  },
  
  getAllFormats: async (link) => {
    if (!link) {
      return {
        status: false,
        code: 400,
        error: "Link YouTube wajib diisi",
      };
    }

    const id = savetube.youtube(link);
    if (!id) throw new Error("Link YouTube tidak valid");
    
    const cdnx = await savetube.getCDN();
    if (!cdnx.status) return cdnx;
    
    const cdn = cdnx.data;
    const result = await savetube.request(
      `https://${cdn}${savetube.api.info}`,
      {
        url: `https://www.youtube.com/watch?v=${id}`,
      },
    );
    
    if (!result.status) return result;
    const decrypted = await savetube.crypto.decrypt(result.data.data);

    const allDownloads = [];
    
    for (const format of savetube.formats) {
      try {
        const dl = await savetube.request(`https://${cdn}${savetube.api.download}`, {
          id: id,
          downloadType: format === "mp3" ? "audio" : "video",
          quality: format === "mp3" ? "128" : format,
          key: decrypted.key,
        });

        if (dl.status && dl.data.data && dl.data.data.downloadUrl) {
          allDownloads.push({
            type: format === "mp3" ? "audio" : "video",
            format: format === "mp3" ? "mp3" : "mp4",
            quality: format === "mp3" ? "128kbps" : format + 'p',
            download_url: dl.data.data.downloadUrl,
            size: dl.data.data.size || "Unknown"
          });
        }
      } catch (error) {
      }
    }

    return {
      status: true,
      code: 200,
      result: {
        title: decrypted.title,
        thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/0.jpg`,
        id: id,
        duration: decrypted.duration,
        available_formats: allDownloads,
        total_formats: allDownloads.length
      },
    };
  },

  downloadSpecific: async (link, format, quality) => {
    if (!link) {
      return {
        status: false,
        code: 400,
        error: "Link YouTube wajib diisi",
      };
    }

    const id = savetube.youtube(link);
    if (!id) throw new Error("Link YouTube tidak valid");
    
    const cdnx = await savetube.getCDN();
    if (!cdnx.status) return cdnx;
    
    const cdn = cdnx.data;
    const result = await savetube.request(
      `https://${cdn}${savetube.api.info}`,
      {
        url: `https://www.youtube.com/watch?v=${id}`,
      },
    );
    
    if (!result.status) return result;
    const decrypted = await savetube.crypto.decrypt(result.data.data);

    let downloadType, downloadQuality;
    
    if (format === 'mp3') {
      downloadType = 'audio';
      downloadQuality = '128';
    } else if (format === 'mp4') {
      downloadType = 'video';
      downloadQuality = quality || '720';
    } else {
      return {
        status: false,
        code: 400,
        error: "Format tidak valid. Gunakan 'mp3' atau 'mp4'"
      };
    }

    if (format === 'mp4' && !savetube.formats.includes(downloadQuality) && downloadQuality !== '128') {
      return {
        status: false,
        code: 400,
        error: `Quality tidak valid. Tersedia: ${savetube.formats.filter(f => f !== 'mp3').join(', ')}`
      };
    }

    try {
      const dl = await savetube.request(`https://${cdn}${savetube.api.download}`, {
        id: id,
        downloadType: downloadType,
        quality: downloadQuality,
        key: decrypted.key,
      });

      if (dl.status && dl.data.data && dl.data.data.downloadUrl) {
        return {
          status: true,
          code: 200,
          result: {
            title: decrypted.title,
            thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/0.jpg`,
            id: id,
            duration: decrypted.duration,
            download_info: {
              type: downloadType,
              format: format,
              quality: format === 'mp3' ? '128kbps' : downloadQuality + 'p',
              download_url: dl.data.data.downloadUrl,
              size: dl.data.data.size || "Unknown"
            }
          },
        };
      } else {
        return {
          status: false,
          code: 404,
          error: "Format atau quality tidak tersedia untuk video ini"
        };
      }
    } catch (error) {
      return {
        status: false,
        code: 500,
        error: `Gagal mendownload: ${error.message}`
      };
    }
  },

  searchVideos: async (query, limit = 10) => {
    if (!query) {
      return {
        status: false,
        code: 400,
        error: "Query pencarian wajib diisi"
      };
    }

    try {
      const searchResults = await yts(query);
      const videos = searchResults.videos.slice(0, limit).map(video => ({
        title: video.title,
        url: video.url,
        thumbnail: video.thumbnail,
        duration: video.duration.timestamp,
        views: video.views,
        uploaded: video.ago,
        channel: {
          name: video.author.name,
          url: video.author.url
        }
      }));

      return {
        status: true,
        code: 200,
        result: {
          query: query,
          total_results: searchResults.videos.length,
          returned_results: videos.length,
          videos: videos
        }
      };
    } catch (error) {
      return {
        status: false,
        code: 500,
        error: `Gagal mencari video: ${error.message}`
      };
    }
  }
};

module.exports = function (app) {
  // Endpoint Search YouTube V2
  app.get('/search/youtubev2', async (req, res) => {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        status: false,
        creator: "Nimzz",
        message: "Parameter 'query' wajib diisi"
      });
    }

    try {
      const results = await savetube.searchVideos(query);
      
      if (!results.status) {
        return res.status(results.code || 500).json({
          status: false,
          creator: "Nimzz",
          message: results.error
        });
      }

      res.status(200).json({
        status: true,
        creator: "Nimzz",
        api_version: "v2",
        result: results.result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Nimzz",
        message: `Error: ${error.message}`
      });
    }
  });

  // Endpoint Download YouTube V2 - Semua Resolusi dan Type
  app.get('/download/youtubeev2', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        status: false,
        creator: "Nimzz",
        message: "Parameter 'url' wajib diisi"
      });
    }

    try {
      const results = await savetube.getAllFormats(url);
      
      if (!results.status) {
        return res.status(results.code || 500).json({
          status: false,
          creator: "Nimzz",
          message: results.error
        });
      }

      res.status(200).json({
        status: true,
        creator: "Nimzz",
        api_version: "v2",
        result: results.result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Nimzz",
        message: `Error: ${error.message}`
      });
    }
  });

  // Endpoint Download YouTube MP3 V2
  app.get('/download/ytmp3v2', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        status: false,
        creator: "Nimzz",
        message: "Parameter 'url' wajib diisi"
      });
    }

    try {
      const results = await savetube.downloadSpecific(url, 'mp3');
      
      if (!results.status) {
        return res.status(results.code || 500).json({
          status: false,
          creator: "Nimzz",
          message: results.error
        });
      }

      res.status(200).json({
        status: true,
        creator: "Nimzz",
        api_version: "v2",
        result: results.result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Nimzz",
        message: `Error: ${error.message}`
      });
    }
  });
};