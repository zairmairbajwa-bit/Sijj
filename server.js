const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const TMDB_API_KEY = 'cf2293b9c7dc4956214688e3c524d7fb';
const BASE_URL = 'https://api.themoviedb.org/3';

app.get('/api/trending', async (req, res) => {
    try {
        const response = await fetch(`${BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}&language=hi-IN`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Movies load nahi ho rahin' });
    }
});

app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.json({ results: [] });
    
    try {
        const response = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${query}&language=hi-IN`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Search fail ho gaya' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Asli Movie Server port ${PORT} par chal raha hai`);
});
