const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

// Hum ek aisi streaming source site ko target kar rahe hain jahan Hindi dubbed content milta hai
const TARGET_SITE = 'https://flixhq.to'; 

// 1. Trending & Latest Hindi Dubbed Content Scraper
app.get('/api/trending', async (req, res) => {
    try {
        const html = await axios.get(`${TARGET_SITE}/home`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(html.data);
        let results = [];

        // Site ke film items ko scrape karna
        $('.flw-item').each((i, element) => {
            const title = $(element).find('.film-name a').text().trim();
            const poster = $(element).find('.film-poster img').attr('data-src') \vert{}\vert{}$(element).find('.film-poster img').attr('src');
            const link = $(element).find('.film-name a').attr('href');
            const type = link && link.includes('/tv/') ? 'tv' : 'movie';
            const id = link ? link.split('-').pop() : i.toString();

            if (title) {
                results.push({
                    id: id,
                    title: title,
                    name: title,
                    poster_path: poster,
                    media_type: type,
                    vote_average: 8.5
                });
            }
        });

        res.json({ results: results.length > 0 ? results : getFallbackData() });
    } catch (error) {
        res.json({ results: getFallbackData() });
    }
});

// 2. Search Scraper for Hindi Dubbed Movies & Seasons
app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.json({ results: [] });
    try {
        const html = await axios.get(`${TARGET_SITE}/search/${encodeURIComponent(query)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(html.data);
        let results = [];

        $('.flw-item').each((i, element) => {
            const title = $(element).find('.film-name a').text().trim();
            const poster = $(element).find('.film-poster img').attr('data-src') \vert{}\vert{}$(element).find('.film-poster img').attr('src');
            const link = $(element).find('.film-name a').attr('href');
            const type = link && link.includes('/tv/') ? 'tv' : 'movie';
            const id = link ? link.split('-').pop() : i.toString();

            if (title) {
                results.push({
                    id: id,
                    title: title,
                    name: title,
                    poster_path: poster,
                    media_type: type,
                    vote_average: 8.5
                });
            }
        });

        res.json({ results });
    } catch (error) {
        res.json({ results: [] });
    }
});

// Fallback data taake server khali na dikhe
function getFallbackData() {
    return [
        { id: '1', title: 'MobLand (Hindi Dubbed)', name: 'MobLand (Hindi Dubbed)', poster_path: '', media_type: 'tv' }
    ];
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Scraper Bot Running on port ${PORT}`);
});
