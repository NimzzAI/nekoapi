const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
  const baseUrl = 'https://animekompi.run';

  // === HOME ===
  app.get('/anime/kompi/home', async (req, res) => {
    const page = req.query.page || 1;
    try {
      const { data } = await axios.get(`${baseUrl}/page/${page}/`);
      const $ = cheerio.load(data);

      const scrapedData = {
        slide: [],
        rilisanTerbaru: [],
        rekomendasiGenre: [],
      };

      $('.slidtop .loop .slide-item').each((_, el) => {
        scrapedData.slide.push({
          title: $(el).find('.title .ellipsis a').text().trim(),
          url: $(el).find('.title .ellipsis a').attr('href'),
          image: $(el).find('.poster a img').attr('data-lazy-src'),
          ringkasan: $(el).find('.excerpt .story').text().trim(),
          status: $(el).find('.cast .director strong').text().replace('Status:', '').trim(),
          tipe: $(el).find('.cast .actor strong').text().replace('Tipe:', '').trim()
        });
      });

      $('.listupd.normal .excstf .bs').each((_, el) => {
        scrapedData.rilisanTerbaru.push({
          title: $(el).find('.bsx a').attr('title'),
          url: $(el).find('.bsx a').attr('href'),
          image: $(el).find('.bsx a .limit img').attr('data-lazy-src'),
          episode: $(el).find('.bsx a .bt .epx').text()
        });
      });

      $('.series-gen .nav-tabs li a').each((_, el) => {
        const genre = $(el).text();
        const animeList = [];
        $(`.series-gen .listupd #series-${$(el).attr('href').substring(8)} .bs`).each((__, el2) => {
          animeList.push({
            title: $(el2).find('.bsx a').attr('title'),
            url: $(el2).find('.bsx a').attr('href'),
            image: $(el2).find('.bsx a .limit img').attr('data-lazy-src'),
            episode: $(el2).find('.bsx a .bt .epx').text()
          });
        });
        scrapedData.rekomendasiGenre.push({ genre, animeList });
      });

      res.json({ status: true, creator: 'Nimzz', result: scrapedData });
    } catch (err) {
      res.status(500).json({ status: false, creator: 'Nimzz', message: err.message });
    }
  });

  // === SEARCH ===
  app.get('/anime/kompi/search', async (req, res) => {
    const q = req.query.q;
    if (!q) return res.status(400).json({ status: false, creator: 'Nimzz', message: 'Parameter q wajib diisi' });

    try {
      const { data } = await axios.get(`${baseUrl}/?s=${encodeURIComponent(q)}`);
      const $ = cheerio.load(data);
      const searchResults = [];

      $('.listupd > .bs').each((_, el) => {
        searchResults.push({
          title: $(el).find('.bsx > a > .tt > h2').text(),
          link: $(el).find('.bsx > a').attr('href'),
          image: $(el).find('.bsx > a > .limit > img').attr('src')
        });
      });

      res.json({ status: true, creator: 'Nimzz', result: searchResults });
    } catch (err) {
      res.status(500).json({ status: false, creator: 'Nimzz', message: err.message });
    }
  });

  // === DETAIL ===
app.get('/anime/kompi/detail', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ status: false, creator: 'Nimzz', message: 'Parameter url wajib diisi' });

    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      const animeData = {
        title: $('.bigcontent .infox .entry-title').text(),
        alternativeTitle: $('.bigcontent .infox .ninfo .alter').text(),
        status: $('.bigcontent .infox .ninfo .info-content .spe span:contains("Status:")').text().replace('Status:', '').trim(),
        studio: $('.bigcontent .infox .ninfo .info-content .spe span:contains("Studio:") a').text(),
        releaseDate: $('.bigcontent .infox .ninfo .info-content .spe span:contains("Dirilis:") time').attr('datetime'),
        duration: $('.bigcontent .infox .ninfo .info-content .spe span:contains("Durasi:")').text().replace('Durasi:', '').trim(),
        season: $('.bigcontent .infox .ninfo .info-content .spe span:contains("Season:") a').text(),
        type: $('.bigcontent .infox .ninfo .info-content .spe span:contains("Tipe:")').text().replace('Tipe:', '').trim(),
        fansub: $('.bigcontent .infox .ninfo .info-content .spe span:contains("Fansub:")').text().replace('Fansub:', '').trim(),
        genres: $('.bigcontent .infox .ninfo .info-content .genxed a').map((_, el) => $(el).text()).get(),
        description: $('.bixbox.synp .entry-content').text().trim(),
        imageUrl: [{
          bigCover: $('.bigcover .ime img').attr('data-lazy-src'),
          cover: $('.bigcontent .thumbook .thumb img').attr('data-lazy-src')
        }],
        episodes: [],
        recommendations: []
      };

      $('.bxcl.epcheck .eplister ul li').each((_, el) => {
        animeData.episodes.push({
          number: $(el).find('.epl-num').text(),
          title: $(el).find('.epl-title').text(),
          url: $(el).find('a').attr('href'),
          date: $(el).find('.epl-date').text()
        });
      });

      $('.listupd .bs').each((_, el) => {
        animeData.recommendations.push({
          title: $(el).find('.tt h2').text(),
          url: $(el).find('a').attr('href'),
          image: $(el).find('.limit img').attr('data-lazy-src')
        });
      });

      res.json({ status: true, creator: 'Nimzz', result: animeData });
    } catch (err) {
      res.status(500).json({ status: false, creator: 'Nimzz', message: err.message });
    }
  });

  // === STREAM ===
  app.get('/anime/kompi/stream', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ status: false, creator: 'Nimzz', message: 'Parameter url wajib diisi' });

    try {
      const { data: html } = await axios.get(url);
      const $ = cheerio.load(html);

      const animeData = {
        title: $('h1.entry-title').text().trim() || null,
        image: cleanImage($('meta[property="og:image"]').attr('content')),
        episodeNumber: $('meta[itemprop="episodeNumber"]').attr('content') || null,
        tvspan: $('.epx').text().trim() || null,
        year: extractYear($('.year').text()) || null,
        description: $('.desc.mindes').text().trim() || null,
        rating: $('.rating strong').text().trim() || null,
        seriesLink: $("a[href*='/anime/']").attr('href') || null,
        genre: $('.infox .genxed a').map((_, el) => $(el).text().trim()).get(),
        streamingServers: [],
        downloadLinks: [],
        relatedAnime: [],
        complete: {
          status: getInfoText($, 'Status'),
          studio: getInfoText($, 'Studio'),
          dirilis: getInfoText($, 'Dirilis'),
          durasi: getInfoText($, 'Durasi'),
          tipe: getInfoText($, 'Tipe'),
          totalEpisode: getInfoText($, 'Total Episode')
        }
      };

      $('.mirror option').each((_, el) => {
        const server = $(el).text().trim();
        const base64 = $(el).attr('value');
        if (!base64) return;
        const decoded = Buffer.from(base64, 'base64').toString('utf-8');
        const srcMatch = decoded.match(/src="([^"]*)"/i);
        const link = srcMatch ? srcMatch[1].trim() : decoded.trim();
        animeData.streamingServers.push({ server, link });
      });

      $('.soraddlx').each((_, el) => {
        const quality = $(el).find('.sorattlx h3').text().trim() || $(el).find('strong').text().trim() || null;
        const links = $(el).find('.soraurlx a').map((_, a) => ({
          name: $(a).text().trim(),
          url: $(a).attr('href')
        })).get();
        animeData.downloadLinks.push({ quality, links });
      });


      $('#sidebar .serieslist ul li').each((_, el) => {
        animeData.relatedAnime.push({
          title: $(el).find('h4 a').text().trim() || null,
          link: $(el).find('a').attr('href') || null,
          image: cleanImage($(el).find('img').attr('data-lazy-src') || $(el).find('img').attr('src'))
        });
      });

      res.json({ status: true, creator: 'Nimzz', result: animeData });

    } catch (err) {
      res.status(500).json({ status: false, creator: 'Nimzz', message: err.message });
    }
  });

  function getInfoText($, label) {
    const text = $(`.single-info.bixbox .infox .info-content .spe span:contains('${label}:')`).text();
    return text ? text.replace(`${label}:`, '').trim() : null;
  }

  function cleanImage(src) {
    if (!src || src.startsWith('data:image/svg+xml')) return null;
    return src.trim();
  }

  function extractYear(text) {
    if (!text) return null;
    const match = text.match(/(\w+\s+\d{4}|\d{4})/);
    return match ? match[0].trim() : null;
  }
};
