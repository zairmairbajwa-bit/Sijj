const express = require('express');
const cors = require('cors');
const https = require('https');
const app = express();
app.use(cors());

const TMDB_API_KEY = 'cf2293b9c7dc4956214688e3c524d7fb';
const BASE_URL = 'https://api.themoviedb.org/3';

const fetchData = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } 
                catch (e) { resolve({ error: 'Parsing failed' }); }
            });
        }).on('error', (e) => reject({ error: e.message }));
    });
};

app.get('/api/trending', async (req, res) => {
    try {
        const data = await fetchData(`${BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`);
        res.json(data);
    } catch (error) {
        res.json({ error: 'Fetch failed', details: error });
    }
});

app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.json({ results: [] });
    try {
        const data = await fetchData(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${query}`);
        res.json(data);
    } catch (error) {
        res.json({ error: 'Fetch failed', details: error });
    }
});

app.listen(process.env.PORT || 3000, () => console.log('Server debugging API'));
