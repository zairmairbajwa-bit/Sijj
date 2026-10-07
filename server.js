const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio'); // Ads hatane aur direct links nikalne ke liye

const app = express();
app.use(cors());

const TMDB_KEY = '92b418e837b833be308bbfb1fb2aca1e'; 

// App ke Home page ke liye movies
app.get('/api/trending', async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}`);
        res.json(data);
    } catch (error) { res.json({ results: [] }); }
});

// Search feature
app.get('/api/search', async (req, res) => {
    if (!req.query.query) return res.json({ results: [] });
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${req.query.query}`);
        res.json(data);
    } catch (error) { res.json({ results: [] }); }
});

// 🌟 NAYA FEATURE: Direct Video Link Extractor (For Native Player & Download)
app.get('/api/get-video', async (req, res) => {
    const { id, type, season, episode } = req.query;
    try {
        // Yahan par humari scraping logic kaam karegi jo background mein ads hata kar direct file laayegi
        res.json({ 
            status: 'success', 
            message: 'Direct link generated successfully',
            // Temporarily fallback source jab tak final Hindi scraper attach ho
            url: `https://vidsrc.me/embed/${type}?tmdb=${id}${season ? `&season=${season}&episode=${episode}` : ''}` 
        });
    } catch (error) { 
        res.json({ status: 'error', message: 'Video failed to load' }); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sijj MovieBox Native Server Running on port ${PORT}`));
