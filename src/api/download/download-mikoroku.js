// download-mikoroku.js
const fetch = require("node-fetch");
const cheerio = require("cheerio");

async function downloadChapter(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const downloadLinks = [];

    $("a.download-link, a[href*='download'], div.download-section a").each((i, el) => {
      const link = $(el).attr("href");
      const text = $(el).text().trim();
      
      if (link && (link.includes('download') || link.match(/\.(pdf|zip|rar|epub|mobi|txt)$/i))) {
        downloadLinks.push({
          provider: text || `Link ${i + 1}`,
          url: link.startsWith('http') ? link : `https://www.mikoroku.my.id${link}`,
          type: getFileType(link)
        });
      }
    });

    if (downloadLinks.length === 0) {
      $("article div.content a").each((i, el) => {
        const link = $(el).attr("href");
        const text = $(el).text().trim();
        
        if (link && link.match(/\.(pdf|zip|rar|epub|mobi|txt)$/i)) {
          downloadLinks.push({
            provider: text || `Download ${i + 1}`,
            url: link.startsWith('http') ? link : `https://www.mikoroku.my.id${link}`,
            type: getFileType(link)
          });
        }
      });
    }

    return {
      title: $("article.oh.a2 header h1.mb-6").text().trim() || $("h1.title").text().trim(),
      chapter: $("h2.chapter-title, .chapter-heading").text().trim() || "Main Chapter",
      downloadLinks: downloadLinks.length > 0 ? downloadLinks : [{ error: "No download links found" }]
    };
  } catch (error) {
    console.error("Download scrape error:", error.message);
    return { error: error.message };
  }
}


function getFileType(url) {
  if (url.includes('.pdf')) return 'PDF';
  if (url.includes('.zip')) return 'ZIP';
  if (url.includes('.rar')) return 'RAR';
  if (url.includes('.epub')) return 'EPUB';
  if (url.includes('.mobi')) return 'MOBI';
  if (url.includes('.txt')) return 'TEXT';
  return 'UNKNOWN';
}

module.exports = function(app) {
  app.get('/download/mikoroku', async (req, res) => {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ status: false, error: 'URL is required' });
    }
    try {
      const downloadData = await downloadChapter(url);
      res.status(200).json({
        status: true,
        result: downloadData
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });

  // Endpoint alternatif untuk download by chapter ID
  app.get('/download/mikoroku/chapter', async (req, res) => {
    const { chapterId } = req.query;
    if (!chapterId) {
      return res.status(400).json({ status: false, error: 'Chapter ID is required' });
    }
    try {
      const chapterUrl = `https://www.mikoroku.my.id/${chapterId}`;
      const downloadData = await downloadChapter(chapterUrl);
      res.status(200).json({
        status: true,
        result: downloadData
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
}
