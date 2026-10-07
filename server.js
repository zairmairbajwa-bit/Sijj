const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/get-hindi-link', async (req, res) => {
    const movieTitle = req.query.title;
    if (!movieTitle) return res.json({ error: "Movie ka naam zaroori hai" });

    try {
        // Nayi command: Bot ab strictly 'hindi' keyword ke sath search karega
        const searchUrl = `https://archive.org/advancedsearch.php?q=(${encodeURIComponent(movieTitle)}+hindi)+AND+mediatype:(movies)&fl[]=identifier,title&sort[]=downloads+desc&rows=5&output=json`;
        
        const { data } = await axios.get(searchUrl);
        
        if (!data.response || data.response.docs.length === 0) {
             return res.json({ status: "Failed", message: "Yeh movie abhi Hindi database mein nahi hai." });
        }

        const movieId = data.response.docs[0].identifier;
        const filesUrl = `https://archive.org/metadata/${movieId}`;
        const filesData = await axios.get(filesUrl);
        
        let mp4File = filesData.data.files.find(file => file.name.endsWith('.mp4'));
        
        if(mp4File) {
            const directLink = `https://archive.org/download/${movieId}/${mp4File.name}`;
            res.json({ status: "Success", title: movieTitle, direct_mp4_link: directLink });
        } else {
             res.json({ status: "Failed", message: "Movie mili par MP4 format mein nahi hai." });
        }
    } catch (error) {
        res.json({ status: "Error", message: "Server connection fail ho gaya" });
    }
});

// TMDB wale purane routes UI ke liye
const TMDB_KEY = '92b418e837b833be308bbfb1fb2aca1e'; 
app.get('/api/trending', async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}`);
        res.json(data);
    } catch (e) { res.json({ results: [] }); }
});
app.get('/api/search', async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${req.query.query}`);
        res.json(data);
    } catch (e) { res.json({ results: [] }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Unblockable Scraper running on port ${PORT}`));
