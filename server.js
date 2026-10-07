const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// Sirf Scraping test karne ke liye naya route
app.get('/api/get-hindi-link', async (req, res) => {
    const movieTitle = req.query.title;
    if (!movieTitle) return res.json({ error: "Movie ka naam zaroori hai" });

    try {
        // Step 1: Website par search marna 
        // Note: Yahan humein kisi aisi site ka link lagana hai jis par sakht security na ho
        const searchUrl = `https://vegamovies.is/?s=${movieTitle.replace(/ /g, '+')}`;
        
        // Aksar sites Cloudflare security ki wajah se bots ko block kar deti hain
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        const $ = cheerio.load(data);

        // Step 2: Pehli movie ka link nikalna (Classes site ke hisab se badalni padengi)
        const moviePageLink = $('.post-item a').first().attr('href');
        
        if (!moviePageLink) {
            return res.json({ status: "Failed", message: "Movie nahi mili ya block ho gayi" });
        }

        // Step 3: Movie page ke andar ja kar direct .mp4 ya download button dhoondna
        const moviePage = await axios.get(moviePageLink);
        const $$ = cheerio.load(moviePage.data);                  // Asal MP4 link pakarna         const directLink = $$('a.download-btn').attr('href'); 

        res.json({ 
            status: "Success", 
            title: movieTitle, 
            found_page: moviePageLink,
            direct_mp4_link: directLink || "MP4 button nahi mila" 
        });

    } catch (error) {
        res.json({ 
            status: "Error", 
            message: "Scraping block ho gayi (Cloudflare ya site down)", 
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Scraper Server running on port ${PORT}`));
