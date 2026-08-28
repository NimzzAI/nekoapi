const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://www.livechart.me/schedule';

const hariMapping = {
  Sun: 'Minggu',
  Mon: 'Senin',
  Tue: 'Selasa',
  Wed: 'Rabu',
  Thu: 'Kamis',
  Fri: 'Jumat',
  Sat: 'Sabtu'
};

async function scrapeSchedule() {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const scheduleData = [];

    $('.lc-timetable-day').each((_, element) => {
      const dayRaw = $(element).find('.lc-timetable-day__heading h2').text().trim();
      const day = hariMapping[dayRaw] || dayRaw;
      const date = $(element).find('.lc-timetable-day__heading .text-xl').text().trim();
      const animeList = [];

      $(element).find('.lc-timetable-anime-block').each((_, animeElement) => {
        const title = $(animeElement).find('.lc-tt-anime-title').text().trim();
        const episode = $(animeElement).find('.lc-tt-release-label .font-medium').text().trim();
        const category = $(animeElement).find('.lc-tt-release-label').text().replace(episode, '').trim();
        const time = $(animeElement).closest('.lc-timetable-timeslot').find('.lc-time span').text().trim();

        animeList.push({ title, episode, category, time });
      });

      scheduleData.push({ day, date, anime: animeList });
    });

    return scheduleData;
  } catch (err) {
    return { error: true, message: err.message };
  }
}

module.exports = function (app) {
  app.get('/anime/jadwalrilis', async (req, res) => {
    const result = await scrapeSchedule();
    if (result?.error) {
      return res.status(500).json({
        status: false,
        creator: 'Nimzz',
        message: 'Gagal mengambil jadwal rilis anime',
        error: result.message
      });
    }

    res.json({
      status: true,
      creator: 'Nimzz',
      result
    });
  });
};
