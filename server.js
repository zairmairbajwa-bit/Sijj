const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

const TMDB_KEY = '92b418e837b833be308bbfb1fb2aca1e'; 

app.get('/api/trending', async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}`);
        res.json(data);
    } catch (error) { res.json({ results: [] }); }
});

app.get('/api/search', async (req, res) => {
    if (!req.query.query) return res.json({ results: [] });
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${req.query.query}`);
        res.json(data);
    } catch (error) { res.json({ results: [] }); }
});

app.get('/api/tv-details', async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/tv/${req.query.id}?api_key=${TMDB_KEY}`);
        res.json(data);
    } catch (error) { res.json({}); }
});

app.get('/api/tv-season', async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/tv/${req.query.id}/season/${req.query.season}?api_key=${TMDB_KEY}`);
        res.json(data);
    } catch (error) { res.json({}); }
});

// HINDI DUBBED SCRAPER & DOWNLOAD LINK GENERATOR
app.get('/api/get-video', async (req, res) => {
    const { title, year } = req.query;
    try {
        // Yeh backend bot Hindi sites (jaise Vegamovies/HDHub) ko background mein scrape karke link banayega.
        // Download ke liye hum seedha user ko final direct link de denge.
        const searchQuery = `${title} ${year} hindi dubbed download mp4`.replace(/ /g, '+');
        const downloadUrl = `https://www.google.com/search?q=${searchQuery}`; 
        
        // Asal scraping logic yahan run hogi jo direct .mp4 nikalegi (abhi proxy url set hai)
        res.redirect(downloadUrl);
    } catch (error) { 
        res.send("Download link fetch failed."); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sijj MovieBox Final Server Running on port ${PORT}`));
