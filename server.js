const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

// Bot ka apna internal engine (Aapko koi key manage nahi karni)
const BOT_ENGINE = '92b418e837b833be308bbfb1fb2aca1e'; 
const BASE_URL = 'https://api.themoviedb.org/3';

// 1. Home Page Bot - Sirf Hindi movies nikal kar layega
app.get('/api/trending', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/discover/movie?api_key=${BOT_ENGINE}&with_original_language=hi&sort_by=popularity.desc`);
        res.json(response.data);
    } catch (error) {
        res.json({ results: [] });
    }
});

// 2. Search Bot - Har kism ki movies aur seasons dhoondega
app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.json({ results: [] });
    
    try {
        const response = await axios.get(`${BASE_URL}/search/multi?api_key=${BOT_ENGINE}&query=${query}&language=hi-IN`);
        res.json(response.data);
    } catch (error) {
        res.json({ results: [] });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MovieBox Bot Server chal raha hai port ${PORT} par`);
});
