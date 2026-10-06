const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const BOT_ENGINE = '92b418e837b833be308bbfb1fb2aca1e'; 
const BASE_URL = 'https://api.themoviedb.org/3';

// Trending aur Search Proxy
app.get('/api/trending', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/trending/all/day?api_key=${BOT_ENGINE}&language=hi-IN`);
        res.json(response.data);
    } catch (error) { res.json({ results: [] }); }
});

app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.json({ results: [] });
    try {
        const response = await axios.get(`${BASE_URL}/search/multi?api_key=${BOT_ENGINE}&query=${query}&language=hi-IN`);
        res.json(response.data);
    } catch (error) { res.json({ results: [] }); }
});

// Naya: Seasons aur Episodes ka bypass (Pakistan block fix)
app.get('/api/tv-details', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/tv/${req.query.id}?api_key=${BOT_ENGINE}`);
        res.json(response.data);
    } catch (error) { res.json({}); }
});

app.get('/api/tv-season', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/tv/${req.query.id}/season/${req.query.season}?api_key=${BOT_ENGINE}`);
        res.json(response.data);
    } catch (error) { res.json({}); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy Bot Running on port ${PORT}`));
