const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const TMDB_API_KEY = 'cf2293b9c7dc4956214688e3c524d7fb';
const BASE_URL = 'https://api.themoviedb.org/3';

app.get('/api/trending', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}&language=hi-IN`);
        res.json(response.data);
    } catch (error) {
        res.json({ results: [] });
    }
});

app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.json({ results: [] });
    
    try {
        const response = await axios.get(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${query}&language=hi-IN`);
        res.json(response.data);
    } catch (error) {
        res.json({ results: [] });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is perfectly running on port ${PORT}`);
});
