const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const BOT_ENGINE = '92b418e837b833be308bbfb1fb2aca1e'; 
const BASE_URL = 'https://api.themoviedb.org/3';

// 1. Front page par Hollywood aur Bollywood dono ka trending mix (Latest arrivals show honge)
app.get('/api/trending', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/trending/all/day?api_key=${BOT_ENGINE}`);
        res.json(response.data);
    } catch (error) {
        res.json({ results: [] });
    }
});

// 2. Search Bot (Har kism ki movie, season aur language dhoondne ke liye)
app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.json({ results: [] });
    try {
        const response = await axios.get(`${BASE_URL}/search/multi?api_key=${BOT_ENGINE}&query=${query}`);
        res.json(response.data);
    } catch (error) {
        res.json({ results: [] });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MovieBox Bot Running on port ${PORT}`);
});
